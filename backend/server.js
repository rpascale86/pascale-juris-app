import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const prisma = new PrismaClient();
const app = express();

// ============================================================================
// --- BLINDAGEM DE SEGURANÇA (ENTERPRISE) ---
// ============================================================================
// Helmet: Protege contra vulnerabilidades web conhecidas ocultando headers sensíveis
app.use(helmet());

// CORS Estrito: Previne que domínios não autorizados consumam a API e façam CSRF
const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['http://localhost:5173'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado pela política de CORS do Servidor.'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' })); // Previne ataques de payload gigante

// Rate Limiting: Previne ataques de Força Bruta em rotas sensíveis
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // Limita a 20 tentativas por IP
  message: { success: false, error: 'Muitas tentativas de login. Bloqueio temporário ativado.' }
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 120, // Limite geral de requisições por IP
  message: { success: false, error: 'Limite de requisições excedido.' }
});

app.use('/api/', apiLimiter);

// Limite rigoroso de 5MB para upload em memória (Evita OOM Crash no Node.js)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } 
});

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("CRÍTICO: JWT_SECRET não definido no ambiente. O sistema não é seguro.");
  process.exit(1);
}

const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) 
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY) 
  : null;

// ============================================================================
// --- MIDDLEWARE DE AUTENTICAÇÃO E ISOLAMENTO DE TENANT (RBAC) ---
// ============================================================================
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token ausente ou mal formatado. Acesso negado.' });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, error: 'Sessão expirada ou assinatura inválida.' });
    req.lawyerId = decoded.lawyerId; // Isolamento absoluto: garante que querys só peguem dados deste tenant
    next();
  });
};

// ============================================================================
// --- ENDPOINTS PÚBLICOS ---
// ============================================================================
app.get('/api/health', (req, res) => res.json({ status: 'Operacional', engine: 'Pascale Juris SaaS Enterprise v3', secure: true }));

app.post('/api/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Dados inválidos. A senha deve ter no mínimo 6 caracteres.' });
    }

    const existing = await prisma.lawyer.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ success: false, error: 'Conflito: E-mail já está em uso.' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const lawyer = await prisma.lawyer.create({
      data: { name, email, password: hashedPassword, primaryColor: '#1e293b' }
    });

    const token = jwt.sign({ lawyerId: lawyer.id }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ success: true, token, lawyer: { name: lawyer.name, email: lawyer.email, primaryColor: lawyer.primaryColor } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Falha interna durante o provisionamento do tenant.' });
  }
});

app.post('/api/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // ATENÇÃO: O backdoor hardcoded foi removido. A segurança agora é baseada puramente no hash do banco.
    // Qualquer usuário de teste DEVE ser criado via script de seed com senha previamente hasheada.
    
    const lawyer = await prisma.lawyer.findUnique({ where: { email } });
    
    if (!lawyer || !(await bcrypt.compare(password, lawyer.password))) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign({ lawyerId: lawyer.id }, JWT_SECRET, { expiresIn: '12h' }); // Tempo de expiração reduzido por segurança
    res.json({ success: true, token, lawyer: { name: lawyer.name, primaryColor: lawyer.primaryColor } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro de processamento na camada de autenticação.' });
  }
});

// Captura de Leads via Landing Page (Aberto)
app.post('/api/leads', async (req, res) => {
  try {
    const { name, phone, type } = req.body;
    
    if (!name || !phone || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ success: false, error: 'Payload malformado. Telefone inválido.' });
    }

    const defaultLawyer = await prisma.lawyer.findFirst(); 
    if (!defaultLawyer) return res.status(503).json({ success: false, error: 'Plataforma sem tenants aptos para roteamento.' });

    const lead = await prisma.lead.create({
      data: { name, phone, type, status: 'Novo', lawyerId: defaultLawyer.id }
    });
    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Falha ao persistir captura de lead no banco de dados.' });
  }
});

// ============================================================================
// --- ENDPOINTS PRIVADOS (Isolamento via req.lawyerId garantido) ---
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
  } catch (error) { res.status(500).json({ success: false, error: 'Erro de leitura I/O.' }); }
});

app.post('/api/cases', requireAuth, async (req, res) => {
  try {
    const { client, title, phone, cpf, processNumber, value } = req.body;
    
    let clientRecord = await prisma.client.findFirst({ where: { name: client, lawyerId: req.lawyerId } });
    if (!clientRecord) {
      clientRecord = await prisma.client.create({ data: { name: client, phone, cpfCnpj: cpf, lawyerId: req.lawyerId } });
    }

    const newCase = await prisma.case.create({
      data: {
        title, processNumber,
        value: parseFloat(value || 0),
        status: 'Novo', stage: 'peticao',
        clientId: clientRecord.id, lawyerId: req.lawyerId
      }
    });
    res.status(201).json({ success: true, data: newCase });
  } catch (error) { res.status(500).json({ success: false, error: 'Falha de escrita I/O.' }); }
});

app.patch('/api/cases/:id/move', requireAuth, async (req, res) => {
  try {
    const { stage, status } = req.body;
    const updated = await prisma.case.update({
      where: { id: req.params.id, lawyerId: req.lawyerId }, 
      data: { stage, status }
    });
    
    await prisma.caseTimeline.create({
       data: { title: `Avanço de Fase: ${stage}`, date: new Date().toLocaleDateString('pt-BR'), completed: true, caseId: req.params.id }
    });

    res.json({ success: true, data: updated });
  } catch (error) { res.status(500).json({ success: false, error: 'Acesso negado ou registro inexistente.' }); }
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
    if (!clientRecord) return res.status(404).json({ success: false, error: 'Entidade de cliente não mapeada no tenant.' });

    const fin = await prisma.financial.create({
      data: { title, amount: parseFloat(amount), dueDate, type, status: 'Aberto', clientId: clientRecord.id }
    });
    res.status(201).json({ success: true, data: fin });
  } catch (error) { res.status(500).json({ success: false, error: 'Falha de escrita I/O.' }); }
});

app.patch('/api/financials/:id/pay', requireAuth, async (req, res) => {
  try {
    // Camada extra de segurança para garantir que a fatura pertence ao tenant
    const verifyOwnership = await prisma.financial.findFirst({
      where: { id: req.params.id, client: { lawyerId: req.lawyerId } }
    });
    if(!verifyOwnership) return res.status(403).json({ success: false, error: 'Violação de perímetro de Tenant detectada.' });

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
    if (!file) return res.status(400).json({ success: false, error: 'Payload binário inexistente.' });

    let fileUrl = null;
    
    if (supabase) {
      const sanitizedName = name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniquePath = `${req.lawyerId}/${Date.now()}_${sanitizedName}`;
      
      const { error: uploadError } = await supabase.storage.from('documentos').upload(uniquePath, file.buffer, { contentType: file.mimetype });
      if (uploadError) throw new Error(`Falha de downstream Supabase: ${uploadError.message}`);
      
      const { data } = supabase.storage.from('documentos').getPublicUrl(uniquePath);
      fileUrl = data.publicUrl;
    }

    const doc = await prisma.document.create({
      data: {
        name, client,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        url: fileUrl,
        lawyerId: req.lawyerId
      }
    });

    res.status(201).json({ success: true, data: doc });
  } catch (error) { 
    res.status(500).json({ success: false, error: 'Falha no processamento de pipeline de arquivo.' }); 
  }
});

// --- CONTROLE DE EXCEÇÃO GLOBAL ---
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, error: 'Payload Too Large. O arquivo excede 5MB.' });
  }
  console.error('[ERRO DE EXECUÇÃO FATAL]', err.stack);
  res.status(500).json({ success: false, error: 'Ocorreu um erro catastrófico não tratado no motor da API.' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`\n⚖️ [PASCALE JURIS SAAS] Motor Backend Online na Porta ${PORT}`);
  console.log(`🛡️ Camadas de Segurança (Helmet, RateLimit, CORS Rigoroso) Ativadas`);
});