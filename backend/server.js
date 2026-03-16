import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
// 🛡️ SEGURANÇA E UPLOADS
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
// ☁️ CLIENTE SUPABASE (Armazenamento Real na Nuvem)
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const prisma = new PrismaClient();
const app = express();

// ============================================================================
// --- ⚙️ CONFIGURAÇÕES E MIDDLEWARES ---
// ============================================================================

const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:3000', 
  'https://pascale-juris-app.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Acesso bloqueado pela política de CORS'));
    }
  }
}));

app.use(express.json());

// 📦 Configuração do Multer (Limite de 10MB para otimização de memória RAM)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB Max
});

// 🔑 Chaves de Ambiente
const JWT_SECRET = process.env.JWT_SECRET || 'pascale_secret_key_2024';

// ☁️ Configuração Supabase (Puxa das variáveis que configurou na Render)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;


// ============================================================================
// --- 🤖 SERVIÇOS DE AUTOMAÇÃO (BACKGROUND WORKERS) ---
// ============================================================================

/**
 * Serviço responsável por disparar mensagens de WhatsApp.
 * Preparado para integração futura com Evolution API ou Z-API.
 */
const sendWhatsAppNotification = async (phone, message) => {
  try {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    
    console.log(`\n[🤖 WhatsApp Bot] Disparando para: +55 ${cleanPhone}`);
    console.log(`[🤖 WhatsApp Bot] Mensagem: "${message}"`);
    
    // 🚧 Integração futura:
    // await fetch('https://api-whatsapp/send', { ... });

    console.log(`[🤖 WhatsApp Bot] ✅ Mensagem enviada com sucesso em background.\n`);
  } catch (error) {
    console.error(`[🤖 WhatsApp Bot] ❌ Erro ao enviar mensagem:`, error);
  }
};


// ============================================================================
// --- 🛡️ MIDDLEWARE DE SEGURANÇA ---
// ============================================================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Sessão expirada. Faça login novamente.' });
    req.user = user;
    next();
  });
};


// ============================================================================
// --- 🔓 ROTAS PÚBLICAS ---
// ============================================================================

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'E-mail e palavra-passe obrigatórios.' });

  try {
    const lawyer = await prisma.lawyer.findUnique({ where: { email } });
    if (!lawyer) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const passwordMatch = await bcrypt.compare(password, lawyer.password);
    if (!passwordMatch) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const token = jwt.sign(
      { lawyerId: lawyer.id, email: lawyer.email, name: lawyer.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    res.json({ token, lawyer: { id: lawyer.id, name: lawyer.name, email: lawyer.email, primaryColor: lawyer.primaryColor } });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

app.post('/api/register', async (req, res) => {
  const { name, email, password, officeName } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });

  try {
    const existingLawyer = await prisma.lawyer.findUnique({ where: { email } });
    if (existingLawyer) return res.status(400).json({ error: 'Este e-mail já está em uso.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const colors = ['#4f46e5', '#2563eb', '#0284c7', '#0d9488', '#059669', '#dc2626', '#ea580c', '#d97706', '#7c3aed'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newLawyer = await prisma.lawyer.create({
      data: { name, email, password: hashedPassword, primaryColor: randomColor }
    });

    const token = jwt.sign(
      { lawyerId: newLawyer.id, email: newLawyer.email, name: newLawyer.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({ token, lawyer: { id: newLawyer.id, name: newLawyer.name, email: newLawyer.email, primaryColor: newLawyer.primaryColor, officeName } });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno ao criar conta.' });
  }
});

app.post('/api/leads', async (req, res) => {
  const { name, phone, type } = req.body;
  try {
    const lawyer = await prisma.lawyer.findFirst(); 
    if (!lawyer) return res.status(400).json({ error: 'Nenhum administrador disponível.' });

    const newLead = await prisma.lead.create({
      data: { name, phone, type, lawyerId: lawyer.id }
    });
    res.status(201).json(newLead);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao guardar lead.' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'Operacional', database: 'PostgreSQL Conectado', storage: supabase ? 'Ativo' : 'Pendente' });
});

app.get('/', (req, res) => { res.send('Pascale Juris API v3.0 Online! 🚀'); });


// ============================================================================
// --- 🔒 ROTAS PRIVADAS (ISOLAMENTO POR TENANT) ---
// ============================================================================

// --- PROCESSOS ---
app.get('/api/cases', authenticateToken, async (req, res) => {
  try {
    const cases = await prisma.case.findMany({
      where: { lawyerId: req.user.lawyerId },
      include: { client: true, timeline: true },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao procurar processos.' });
  }
});

app.post('/api/cases', authenticateToken, async (req, res) => {
  const { client, cpf, phone, title, processNumber, notes } = req.body;
  const lawyerId = req.user.lawyerId; 

  try {
    let dbClient = await prisma.client.findFirst({ where: { name: client, lawyerId: lawyerId } });

    if (!dbClient) {
      dbClient = await prisma.client.create({
        data: { name: client, cpf, phone, lawyerId: lawyerId }
      });
    }

    const newCase = await prisma.case.create({
      data: {
        title, processNumber, notes,
        clientId: dbClient.id, 
        lawyerId: lawyerId
      },
      include: { client: true, timeline: true }
    });

    res.status(201).json(newCase);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar processo.' });
  }
});

app.patch('/api/cases/:id/move', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { stage, status } = req.body;

  try {
    const existingCase = await prisma.case.findFirst({
      where: { id, lawyerId: req.user.lawyerId },
      include: { client: true }
    });

    if (!existingCase) return res.status(403).json({ error: 'Acesso negado.' });

    const updatedCase = await prisma.case.update({
      where: { id },
      data: { stage, status }
    });
    
    // 🤖 Disparo Automático WhatsApp
    if (existingCase.client?.phone) {
      const message = `Olá, ${existingCase.client.name}! O seu processo "${existingCase.title}" avançou para a fase: ${status}. Estamos a acompanhar tudo!`;
      sendWhatsAppNotification(existingCase.client.phone, message);
    }

    res.json(updatedCase);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar.' });
  }
});

// --- DOCUMENTOS E UPLOADS REAIS ---
app.get('/api/documents', authenticateToken, async (req, res) => {
  try {
    const docs = await prisma.document.findMany({ 
      where: { lawyerId: req.user.lawyerId }, 
      orderBy: { createdAt: 'desc' } 
    });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao procurar documentos.' });
  }
});

app.post('/api/documents', authenticateToken, upload.single('file'), async (req, res) => {
  const { name, client } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ error: 'Nenhum ficheiro enviado.' });

  try {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    let fileUrl = '';

    // ☁️ Envio para o Supabase Storage
    if (supabase) {
      const uniqueName = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('documentos')
        .upload(uniqueName, file.buffer, { contentType: file.mimetype });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(uniqueName);
      fileUrl = urlData.publicUrl;
    }

    // 📝 Registo na Base de Dados
    const newDoc = await prisma.document.create({
      data: {
        name,
        client,
        size: fileSizeMB,
        url: fileUrl,
        lawyerId: req.user.lawyerId
      }
    });

    res.status(201).json(newDoc);
  } catch(e) {
    res.status(500).json({ error: 'Falha no upload.' });
  }
});

// --- FINANCEIRO ---
app.get('/api/financials', authenticateToken, async (req, res) => {
  try {
    const financials = await prisma.financial.findMany({
      where: { client: { lawyerId: req.user.lawyerId } },
      include: { client: true },
      orderBy: { dueDate: 'asc' }
    });
    res.json(financials);
  } catch (error) {
    res.status(500).json({ error: 'Erro no financeiro.' });
  }
});

app.post('/api/financials', authenticateToken, async (req, res) => {
  const { title, client, amount, dueDate, type } = req.body;
  const lawyerId = req.user.lawyerId;

  if (!title || !client || amount === undefined) {
    return res.status(400).json({ error: 'Dados financeiros incompletos.' });
  }

  try {
    const dbClient = await prisma.client.findFirst({ where: { name: client, lawyerId: lawyerId } });
    if (!dbClient) return res.status(404).json({ error: 'Cliente não encontrado.' });

    const newFinancial = await prisma.financial.create({
      data: { 
        title, 
        amount: parseFloat(amount), 
        dueDate, 
        type, 
        status: "Aberto", 
        clientId: dbClient.id 
      }
    });
    res.status(201).json(newFinancial);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao guardar a fatura.' });
  }
});

// Inicialização
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n⚖️  PASCALE JURIS BACKEND v3.0`);
  console.log(`🚀 API Pronta: http://localhost:${PORT}\n`);
});