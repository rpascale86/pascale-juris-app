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
// --- 🛡️ CORS & SEGURANÇA ---
// ============================================================================
const allowedOrigins = ['http://localhost:5173', 'https://pascale-juris-app.vercel.app'];
app.use(cors({
  origin: (origin, callback) => {
    // Permite chamadas sem origem (ex: Postman) ou das origens autorizadas
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Bloqueio CORS de Segurança'));
  },
  credentials: true
}));

app.use(express.json());

// --- 📦 UPLOAD CONFIG (Proteção de Memória contra ficheiros gigantes) ---
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB Max
});

// --- 🔑 AMBIENTE E NUVEM ---
const JWT_SECRET = process.env.JWT_SECRET || 'pascale_master_key_secure_enterprise';
const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) 
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY) : null;

// ============================================================================
// --- 🔐 MIDDLEWARE DE AUTENTICAÇÃO (O Guarda-Costas) ---
// ============================================================================
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; 
  if (!token) return res.status(401).json({ success: false, error: 'Acesso não autorizado.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, error: 'A sua sessão expirou.' });
    req.user = user; // Injeta a identidade do Advogado na requisição
    next();
  });
};

// ============================================================================
// --- 🔓 ROTAS PÚBLICAS (Sem Autenticação) ---
// ============================================================================

app.post('/api/register', async (req, res, next) => {
  try {
    const { name, email, password, officeName } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Dados incompletos.' });
    }

    const exists = await prisma.lawyer.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ success: false, error: 'Este e-mail já está em uso.' });

    const hashedPassword = await bcrypt.hash(password, 12); // Encriptação de alto nível (Custo 12)
    const lawyer = await prisma.lawyer.create({ 
      data: { name, email, password: hashedPassword, officeName } 
    });

    const token = jwt.sign({ lawyerId: lawyer.id, email: lawyer.email, name: lawyer.name }, JWT_SECRET, { expiresIn: '12h' });
    res.status(201).json({ success: true, token, lawyer: { id: lawyer.id, name: lawyer.name, officeName } });
  } catch (error) { next(error); } // Passa para o Pára-quedas Global
});

app.post('/api/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const lawyer = await prisma.lawyer.findUnique({ where: { email } });
    if (!lawyer || !(await bcrypt.compare(password, lawyer.password))) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign({ lawyerId: lawyer.id, email: lawyer.email, name: lawyer.name }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ success: true, token, lawyer: { id: lawyer.id, name: lawyer.name, officeName: lawyer.officeName, primaryColor: lawyer.primaryColor } });
  } catch (error) { next(error); }
});

// Receber contacto do site
app.post('/api/leads', async (req, res, next) => {
  try {
    const { name, phone, type, email } = req.body;
    const admin = await prisma.lawyer.findFirst();
    if (!admin) return res.status(400).json({ success: false, error: 'O sistema ainda não tem administradores.' });

    const lead = await prisma.lead.create({ 
      data: { name, phone, email, type, lawyerId: admin.id } 
    });
    res.status(201).json({ success: true, data: lead });
  } catch (error) { next(error); }
});


// ============================================================================
// --- 🔒 ROTAS PRIVADAS (Com Isolamento SaaS) ---
// ============================================================================

// --- PROCESSOS ---
app.get('/api/cases', authenticateToken, async (req, res, next) => {
  try {
    const cases = await prisma.case.findMany({
      where: { lawyerId: req.user.lawyerId },
      include: { client: true, timeline: true },
      orderBy: { updatedAt: 'desc' }
    });
    res.json({ success: true, data: cases });
  } catch (error) { next(error); }
});

app.post('/api/cases', authenticateToken, async (req, res, next) => {
  try {
    const { client, cpfCnpj, phone, title, processNumber, value } = req.body;
    
    // Associa ou cria o cliente com os novos campos Enterprise
    let dbClient = await prisma.client.findFirst({ where: { name: client, lawyerId: req.user.lawyerId } });
    if (!dbClient) {
      dbClient = await prisma.client.create({ 
        data: { name: client, cpfCnpj, phone, lawyerId: req.user.lawyerId } 
      });
    }
    
    const newCase = await prisma.case.create({
      data: { 
        title, 
        processNumber, 
        value: parseFloat(value || 0), 
        clientId: dbClient.id, 
        lawyerId: req.user.lawyerId 
      },
      include: { client: true }
    });
    res.status(201).json({ success: true, data: newCase });
  } catch (error) { next(error); }
});

app.patch('/api/cases/:id/move', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stage, status } = req.body;
    const updated = await prisma.case.update({
      where: { id, lawyerId: req.user.lawyerId },
      data: { stage, status }
    });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
});

// --- LEADS ---
app.get('/api/leads', authenticateToken, async (req, res, next) => {
  try {
    const leads = await prisma.lead.findMany({ 
      where: { lawyerId: req.user.lawyerId }, 
      orderBy: { createdAt: 'desc' } 
    });
    res.json({ success: true, data: leads });
  } catch (error) { next(error); }
});

// --- FINANCEIRO ---
app.get('/api/financials', authenticateToken, async (req, res, next) => {
  try {
    const fin = await prisma.financial.findMany({ 
      where: { client: { lawyerId: req.user.lawyerId } },
      include: { client: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: fin });
  } catch (error) { next(error); }
});

app.post('/api/financials', authenticateToken, async (req, res, next) => {
  try {
    const { title, client, amount, dueDate, type } = req.body;
    const dbClient = await prisma.client.findFirst({ where: { name: client, lawyerId: req.user.lawyerId } });
    if (!dbClient) return res.status(404).json({ success: false, error: 'O Cliente não foi encontrado.' });
    
    const fin = await prisma.financial.create({ 
      data: { title, amount: parseFloat(amount), dueDate, type, clientId: dbClient.id } 
    });
    res.status(201).json({ success: true, data: fin });
  } catch (error) { next(error); }
});

// --- ARQUIVO DIGITAL (SUPABASE) ---
app.get('/api/documents', authenticateToken, async (req, res, next) => {
  try {
    const docs = await prisma.document.findMany({ 
      where: { lawyerId: req.user.lawyerId }, 
      orderBy: { createdAt: 'desc' } 
    });
    res.json({ success: true, data: docs });
  } catch (error) { next(error); }
});

app.post('/api/documents', authenticateToken, upload.single('file'), async (req, res, next) => {
  try {
    const { name, client } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, error: 'Nenhum ficheiro fornecido.' });
    
    let fileUrl = '';
    if (supabase) {
      // Limpeza de caracteres especiais no nome do ficheiro para evitar erros no Supabase
      const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${Date.now()}_${cleanName}`;
      
      const { error } = await supabase.storage.from('documentos').upload(fileName, file.buffer, { contentType: file.mimetype });
      if (error) throw new Error(`Supabase Error: ${error.message}`);
      
      const { data } = supabase.storage.from('documentos').getPublicUrl(fileName);
      fileUrl = data.publicUrl;
    }
    
    const doc = await prisma.document.create({
      data: { 
        name, 
        client, 
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB', 
        fileType: file.mimetype, // Grava o tipo de ficheiro (PDF, JPG)
        url: fileUrl, 
        lawyerId: req.user.lawyerId 
      }
    });
    res.status(201).json({ success: true, data: doc });
  } catch (error) { next(error); }
});

// Endpoint de Saúde
app.get('/api/health', (req, res) => res.json({ status: 'Online', version: 'v4.0 Enterprise' }));

// ============================================================================
// --- 🚨 GLOBAL ERROR HANDLER (Pára-quedas do Servidor) ---
// ============================================================================
app.use((err, req, res, next) => {
  console.error('\n[🚨 ERRO CRÍTICO NO SISTEMA]:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Ocorreu um erro interno no servidor. A equipa técnica foi notificada.' 
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`\n⚖️  PASCALE JURIS - MOTOR ENTERPRISE LIGADO`);
  console.log(`🚀 API Operacional na Porta: ${PORT}`);
});