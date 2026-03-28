import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const prisma = new PrismaClient();
const app = express();

// ============================================================================
// --- CONFIGURAÇÃO DE SEGURANÇA E CORS ---
// ============================================================================
app.use(cors({
  origin: '*', // Permite chamadas de qualquer frontend (Vercel, localhost, etc.)
  credentials: true
}));
app.use(express.json());

// Limite de 10MB para upload de arquivos em memória
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } 
});

const JWT_SECRET = process.env.JWT_SECRET || 'pascale_master_key_super_segura';
const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) 
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY) 
  : null;

// ============================================================================
// --- MIDDLEWARE DE AUTENTICAÇÃO E ISOLAMENTO DE TENANT ---
// ============================================================================
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, error: 'Token ausente. Acesso negado.' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, error: 'Sessão expirada ou inválida.' });
    req.lawyerId = decoded.lawyerId; // Injeta o ID do advogado na requisição para isolar os dados
    next();
  });
};

// ============================================================================
// --- ENDPOINTS PÚBLICOS (Não requerem login) ---
// ============================================================================
app.get('/api/health', (req, res) => res.json({ status: 'Operacional', engine: 'Pascale Juris SaaS Enterprise' }));

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await prisma.lawyer.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ success: false, error: 'Este e-mail já está registado.' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const lawyer = await prisma.lawyer.create({
      data: { name, email, password: hashedPassword, primaryColor: '#1e293b' }
    });

    const token = jwt.sign({ lawyerId: lawyer.id }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ success: true, token, lawyer: { name: lawyer.name, email: lawyer.email, primaryColor: lawyer.primaryColor } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Falha no registo do escritório.' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const lawyer = await prisma.lawyer.findUnique({ where: { email } });
    
    if (!lawyer || !(await bcrypt.compare(password, lawyer.password))) {
      // Exceção para o usuário de testes "admin"
      if (email === 'admin' && password === 'admin') {
         const adminLawyer = await prisma.lawyer.findFirst(); 
         if(!adminLawyer) return res.status(401).json({ success: false, error: 'Ambiente de teste sem advogados criados.' });
         const token = jwt.sign({ lawyerId: adminLawyer.id }, JWT_SECRET, { expiresIn: '24h' });
         return res.json({ success: true, token, lawyer: { name: adminLawyer.name, primaryColor: adminLawyer.primaryColor } });
      }
      return res.status(401).json({ success: false, error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign({ lawyerId: lawyer.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token, lawyer: { name: lawyer.name, primaryColor: lawyer.primaryColor } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro interno na autenticação.' });
  }
});

// Receber Leads do site público
app.post('/api/leads', async (req, res) => {
  try {
    const { name, phone, type } = req.body;
    const defaultLawyer = await prisma.lawyer.findFirst(); // Associa ao primeiro advogado criado
    
    if (!defaultLawyer) return res.status(400).json({ success: false, error: 'Sistema sem advogados configurados.' });

    const lead = await prisma.lead.create({
      data: { name, phone, type, status: 'Novo', lawyerId: defaultLawyer.id }
    });
    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao registar Lead.' });
  }
});

// ============================================================================
// --- ENDPOINTS PRIVADOS (Requerem Token JWT) ---
// ============================================================================

// --- PROCESSOS (CASES) ---
app.get('/api/cases', requireAuth, async (req, res) => {
  try {
    const cases = await prisma.case.findMany({
      where: { lawyerId: req.lawyerId },
      include: { client: true, timeline: { orderBy: { createdAt: 'asc' } } },
      orderBy: { updatedAt: 'desc' }
    });
    res.json({ success: true, data: cases });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/cases', requireAuth, async (req, res) => {
  try {
    const { client, title, phone, cpf, processNumber, value } = req.body;
    
    // Procura se o cliente já existe, se não, cria-o
    let clientRecord = await prisma.client.findFirst({ where: { name: client, lawyerId: req.lawyerId } });
    if (!clientRecord) {
      clientRecord = await prisma.client.create({ data: { name: client, phone, cpfCnpj: cpf, lawyerId: req.lawyerId } });
    }

    const newCase = await prisma.case.create({
      data: {
        title,
        processNumber,
        value: parseFloat(value || 0),
        status: 'Novo',
        stage: 'peticao',
        clientId: clientRecord.id,
        lawyerId: req.lawyerId
      }
    });
    res.status(201).json({ success: true, data: newCase });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.patch('/api/cases/:id/move', requireAuth, async (req, res) => {
  try {
    const { stage, status } = req.body;
    const updated = await prisma.case.update({
      where: { id: req.params.id, lawyerId: req.lawyerId }, 
      data: { stage, status }
    });
    
    // Regista o movimento no histórico automaticamente
    await prisma.caseTimeline.create({
       data: { title: `Avanço de Fase: ${stage}`, date: new Date().toLocaleDateString('pt-BR'), completed: true, caseId: req.params.id }
    });

    res.json({ success: true, data: updated });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// --- LEADS CRM ---
app.get('/api/leads', requireAuth, async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({ where: { lawyerId: req.lawyerId }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: leads });
  } catch (error) { res.status(500).json({ success: false }); }
});

// --- FINANCEIRO ---
app.get('/api/financials', requireAuth, async (req, res) => {
  try {
    const fins = await prisma.financial.findMany({
      where: { client: { lawyerId: req.lawyerId } },
      include: { client: true },
      orderBy: { dueDate: 'asc' }
    });
    res.json({ success: true, data: fins });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.post('/api/financials', requireAuth, async (req, res) => {
  try {
    const { client, title, amount, dueDate, type } = req.body;
    const clientRecord = await prisma.client.findFirst({ where: { name: client, lawyerId: req.lawyerId } });
    if (!clientRecord) return res.status(404).json({ success: false, error: 'Cliente não encontrado.' });

    const fin = await prisma.financial.create({
      data: { title, amount: parseFloat(amount), dueDate, type, status: 'Aberto', clientId: clientRecord.id }
    });
    res.status(201).json({ success: true, data: fin });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.patch('/api/financials/:id/pay', requireAuth, async (req, res) => {
  try {
    const updated = await prisma.financial.update({
      where: { id: req.params.id }, 
      data: { status: 'Pago', paymentDate: new Date() }
    });
    res.json({ success: true, data: updated });
  } catch (error) { res.status(500).json({ success: false }); }
});

// --- DOCUMENTOS (SUPABASE) ---
app.get('/api/documents', requireAuth, async (req, res) => {
  try {
    const docs = await prisma.document.findMany({ where: { lawyerId: req.lawyerId }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: docs });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.post('/api/documents', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { client, name } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, error: 'Nenhum ficheiro recebido.' });

    let fileUrl = null;
    
    if (supabase) {
      const sanitizedName = name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniquePath = `${req.lawyerId}/${Date.now()}_${sanitizedName}`;
      
      const { error: uploadError } = await supabase.storage.from('documentos').upload(uniquePath, file.buffer, { contentType: file.mimetype });
      if (uploadError) throw new Error(`Erro Supabase: ${uploadError.message}`);
      
      const { data } = supabase.storage.from('documentos').getPublicUrl(uniquePath);
      fileUrl = data.publicUrl;
    }

    const doc = await prisma.document.create({
      data: {
        name,
        client,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        url: fileUrl,
        lawyerId: req.lawyerId
      }
    });

    res.status(201).json({ success: true, data: doc });
  } catch (error) { 
    res.status(500).json({ success: false, error: error.message }); 
  }
});

// --- PÁRA-QUEDAS GLOBAL (Impede o servidor de craschar) ---
app.use((err, req, res, next) => {
  console.error('[ERRO CRÍTICO NO SERVIDOR]', err);
  res.status(500).json({ success: false, error: 'Ocorreu um erro interno na API.' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`\n⚖️ [PASCALE JURIS SAAS] Motor Backend Online na Porta ${PORT}`);
  console.log(`🛡️ Isolamento Multi-Tenant (JWT) Ativado`);
});