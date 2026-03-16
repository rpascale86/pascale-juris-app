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

// --- CONFIGURAÇÃO DE SEGURANÇA CORS ---
// Permite apenas o seu frontend oficial e o ambiente de desenvolvimento
const allowedOrigins = [
  'http://localhost:5173', 
  'https://pascale-juris-app.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Acesso bloqueado por política de segurança CORS'));
    }
  }
}));

app.use(express.json());

// Configuração de Memória para Uploads (Evita sobrecarga no disco do servidor)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB
});

// Chave Mestra de Encriptação
const JWT_SECRET = process.env.JWT_SECRET || 'pascale_master_key_2025_secure_v3';

// Inicialização do Supabase (Apenas se as chaves existirem)
const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) 
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY) 
  : null;


// ============================================================================
// --- 🛡️ MIDDLEWARE DE AUTENTICAÇÃO (A BARREIRA SaaS) ---
// ============================================================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (!token) return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Sessão expirada ou inválida. Faça login novamente.' });
    req.user = user; // Injeta os dados do advogado (ID) na requisição
    next();
  });
};


// ============================================================================
// --- 🔓 ROTAS PÚBLICAS (LOGIN E REGISTO) ---
// ============================================================================

app.post('/api/register', async (req, res) => {
  const { name, email, password, officeName } = req.body;
  try {
    const exists = await prisma.lawyer.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: 'Este e-mail já está registado no sistema.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const lawyer = await prisma.lawyer.create({
      data: { name, email, password: hashedPassword, officeName }
    });

    const token = jwt.sign(
      { lawyerId: lawyer.id, email: lawyer.email, name: lawyer.name }, 
      JWT_SECRET, 
      { expiresIn: '12h' }
    );

    res.status(201).json({ token, lawyer: { id: lawyer.id, name: lawyer.name, officeName } });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno ao criar conta de advogado.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const lawyer = await prisma.lawyer.findUnique({ where: { email } });
    if (!lawyer) return res.status(401).json({ error: 'Utilizador não encontrado ou senha incorreta.' });

    const validPassword = await bcrypt.compare(password, lawyer.password);
    if (!validPassword) return res.status(401).json({ error: 'Utilizador não encontrado ou senha incorreta.' });

    const token = jwt.sign(
      { lawyerId: lawyer.id, email: lawyer.email, name: lawyer.name }, 
      JWT_SECRET, 
      { expiresIn: '12h' }
    );

    res.json({ 
      token, 
      lawyer: { 
        id: lawyer.id, 
        name: lawyer.name, 
        officeName: lawyer.officeName, 
        primaryColor: lawyer.primaryColor 
      } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro crítico no processo de login.' });
  }
});

// Captura de Leads (Público - Vindo do Site)
app.post('/api/leads', async (req, res) => {
  const { name, phone, type } = req.body;
  try {
    // Atribui o lead ao primeiro administrador por padrão (Configurável no futuro)
    const admin = await prisma.lawyer.findFirst();
    if (!admin) return res.status(400).json({ error: 'Sistema em configuração.' });

    const lead = await prisma.lead.create({
      data: { name, phone, type, lawyerId: admin.id }
    });
    res.status(201).json(lead);
  } catch (e) {
    res.status(500).json({ error: 'Falha ao processar contacto.' });
  }
});


// ============================================================================
// --- 🔒 ROTAS PRIVADAS (ISOLAMENTO TOTAL POR ADVOGADO) ---
// ============================================================================

// --- GESTÃO DE PROCESSOS ---
app.get('/api/cases', authenticateToken, async (req, res) => {
  try {
    const cases = await prisma.case.findMany({
      where: { lawyerId: req.user.lawyerId },
      include: { client: true, timeline: true },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar processos.' });
  }
});

app.post('/api/cases', authenticateToken, async (req, res) => {
  const { client, cpf, phone, title, processNumber } = req.body;
  try {
    // Tenta encontrar ou criar o cliente dentro do escritório do advogado logado
    let dbClient = await prisma.client.findFirst({ 
      where: { name: client, lawyerId: req.user.lawyerId } 
    });

    if (!dbClient) {
      dbClient = await prisma.client.create({
        data: { name: client, cpf, phone, lawyerId: req.user.lawyerId }
      });
    }

    const newCase = await prisma.case.create({
      data: { 
        title, 
        processNumber, 
        clientId: dbClient.id, 
        lawyerId: req.user.lawyerId 
      },
      include: { client: true }
    });
    res.status(201).json(newCase);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao registar novo caso.' });
  }
});

app.patch('/api/cases/:id/move', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { stage, status } = req.body;
  try {
    const updated = await prisma.case.update({
      where: { id, lawyerId: req.user.lawyerId },
      data: { stage, status }
    });
    res.json(updated);
  } catch (e) {
    res.status(403).json({ error: 'Acesso negado a este processo.' });
  }
});

// --- CRM DE LEADS ---
app.get('/api/leads', authenticateToken, async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      where: { lawyerId: req.user.lawyerId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar leads.' });
  }
});

// --- FINANCEIRO ---
app.get('/api/financials', authenticateToken, async (req, res) => {
  try {
    const financials = await prisma.financial.findMany({
      where: { client: { lawyerId: req.user.lawyerId } },
      include: { client: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(financials);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar financeiro.' });
  }
});

app.post('/api/financials', authenticateToken, async (req, res) => {
  const { title, client, amount, dueDate, type } = req.body;
  try {
    const dbClient = await prisma.client.findFirst({ 
      where: { name: client, lawyerId: req.user.lawyerId } 
    });
    if (!dbClient) return res.status(404).json({ error: 'Cliente não encontrado no seu escritório.' });

    const fin = await prisma.financial.create({
      data: { 
        title, 
        amount: parseFloat(amount), 
        dueDate, 
        type, 
        clientId: dbClient.id 
      }
    });
    res.status(201).json(fin);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao processar fatura.' });
  }
});

// --- ARQUIVO DIGITAL (SUPABASE) ---
app.get('/api/documents', authenticateToken, async (req, res) => {
  try {
    const docs = await prisma.document.findMany({
      where: { lawyerId: req.user.lawyerId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao aceder ao arquivo.' });
  }
});

app.post('/api/documents', authenticateToken, upload.single('file'), async (req, res) => {
  const { name, client } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ error: 'Nenhum ficheiro detetado.' });

  try {
    let fileUrl = '';
    
    if (supabase) {
      const fileName = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(fileName, file.buffer, { contentType: file.mimetype });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('documentos')
        .getPublicUrl(fileName);
        
      fileUrl = publicData.publicUrl;
    }

    const doc = await prisma.document.create({
      data: { 
        name, 
        client, 
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB', 
        url: fileUrl, 
        lawyerId: req.user.lawyerId 
      }
    });

    res.status(201).json(doc);
  } catch(e) {
    res.status(500).json({ error: 'Falha crítica no upload para a nuvem.' });
  }
});

// Inicialização do Sistema
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`\n⚖️  PASCALE JURIS v3.5 - MOTOR SaaS ATIVO`);
  console.log(`🌍 Endpoint: http://localhost:${PORT}`);
});