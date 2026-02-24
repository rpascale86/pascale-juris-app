import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
// 🛡️ IMPORTAÇÃO DAS BIBLIOTECAS DE SEGURANÇA E UPLOAD
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';

dotenv.config();

const prisma = new PrismaClient();
const app = express();

const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'https://pascale-juris-app.vercel.app'];
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

// 📦 CONFIGURAÇÃO DO MULTER (Para receber ficheiros físicos do Frontend)
const upload = multer({ storage: multer.memoryStorage() });

// 🛡️ CHAVE SECRETA (Puxa do .env ou usa fallback)
const JWT_SECRET = process.env.JWT_SECRET || 'pascale_secret_key_2024';

// ============================================================================
// --- 🛡️ MIDDLEWARE DE SEGURANÇA (A FRONTEIRA INVISÍVEL) ---
// ============================================================================
// Verifica se o utilizador enviou um Token válido antes de dar acesso aos dados
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Esperado: "Bearer TOKEN"

  if (token == null) {
    return res.status(401).json({ error: 'Acesso negado. Token de segurança não fornecido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado. Faça login novamente.' });
    
    // Guarda os dados do advogado no request para isolar os dados
    req.user = user;
    next();
  });
};

// ============================================================================
// --- 🔓 ROTAS PÚBLICAS (NÃO PRECISAM DE TOKEN) ---
// ============================================================================

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e palavra-passe são obrigatórios.' });
  }

  try {
    const lawyer = await prisma.lawyer.findUnique({
      where: { email: email }
    });

    if (!lawyer) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    let passwordMatch = false;
    
    // Compatibilidade com senhas antigas e novas (Bcrypt)
    if (lawyer.password.startsWith('$2b$')) {
        passwordMatch = await bcrypt.compare(password, lawyer.password);
    } else {
        passwordMatch = (password === lawyer.password);
        if (passwordMatch) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.lawyer.update({
                where: { id: lawyer.id },
                data: { password: hashedPassword }
            });
            console.log(`🔐 Palavra-passe da conta ${email} encriptada com sucesso.`);
        }
    }

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { lawyerId: lawyer.id, email: lawyer.email, name: lawyer.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    console.log(`✅ Login bem-sucedido: ${lawyer.name}`);
    
    res.json({
      token,
      lawyer: {
        id: lawyer.id,
        name: lawyer.name,
        email: lawyer.email,
        primaryColor: lawyer.primaryColor
      }
    });

  } catch (error) {
    console.error("Erro no processo de login:", error);
    res.status(500).json({ error: 'Erro interno no servidor durante o login.' });
  }
});


app.post('/api/register', async (req, res) => {
  const { name, email, password, officeName } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  try {
    const existingLawyer = await prisma.lawyer.findUnique({ where: { email } });
    if (existingLawyer) {
      return res.status(400).json({ error: 'Este e-mail já está em uso. Por favor, faça login.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const colors = ['#4f46e5', '#2563eb', '#0284c7', '#0d9488', '#059669', '#dc2626', '#ea580c', '#d97706', '#7c3aed'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newLawyer = await prisma.lawyer.create({
      data: {
        name,
        email,
        password: hashedPassword,
        primaryColor: randomColor,
      }
    });

    const token = jwt.sign(
      { lawyerId: newLawyer.id, email: newLawyer.email, name: newLawyer.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    console.log(`🎉 Novo Escritório Registado: ${officeName || name}`);

    res.status(201).json({
      token,
      lawyer: {
        id: newLawyer.id,
        name: newLawyer.name,
        email: newLawyer.email,
        primaryColor: newLawyer.primaryColor,
        officeName: officeName 
      }
    });

  } catch (error) {
    console.error("Erro no registo:", error);
    res.status(500).json({ error: 'Erro interno ao tentar criar a conta.' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'Operacional', database: 'PostgreSQL Conectado e a Responder' });
  } catch (e) {
    res.status(500).json({ status: 'Erro', database: 'Falha na conexão com a base de dados' });
  }
});

// CAPTURA PÚBLICA DE LEADS (Landing Page)
app.post('/api/leads', async (req, res) => {
  const { name, phone, type } = req.body;
  try {
    // MVP: Como a Landing Page pública não tem um Tenant específico ainda,
    // enviamos o Lead para o primeiro advogado da base (Admin principal).
    const lawyer = await prisma.lawyer.findFirst();
    if (!lawyer) return res.status(400).json({ error: 'Nenhum advogado encontrado.' });

    const newLead = await prisma.lead.create({
      data: { name, phone, type, date: "Hoje", lawyerId: lawyer.id }
    });
    console.log(`🚀 NOVO LEAD CAPTURADO: ${name} (${type}) - ${phone}`);
    res.status(201).json(newLead);
  } catch (e) {
    console.error("Erro ao guardar lead:", e);
    res.status(500).json({ error: 'Erro ao guardar lead' });
  }
});

app.get('/', (req, res) => {
  res.send('API Pascale Juris Online e Otimizada para Produção! 🚀');
});


// ============================================================================
// --- 🔒 ROTAS PRIVADAS (EXIGEM TOKEN E ISOLAM DADOS POR ESCRITÓRIO) ---
// ============================================================================

// --- PROCESSOS ---
app.get('/api/cases', authenticateToken, async (req, res) => {
  try {
    const cases = await prisma.case.findMany({
      where: { lawyerId: req.user.lawyerId }, // ISOLAMENTO
      include: { client: true, timeline: true },
      orderBy: { updatedAt: 'desc' }, 
      take: 200 
    });
    res.json(cases);
  } catch (error) {
    console.error("Erro ao procurar processos:", error);
    res.status(500).json({ error: 'Erro interno ao procurar processos' });
  }
});

app.post('/api/cases', authenticateToken, async (req, res) => {
  const { client, cpf, phone, title, processNumber, notes } = req.body;
  const lawyerId = req.user.lawyerId; 

  if (!client || !title) {
    return res.status(400).json({ error: 'Nome do cliente e título da acção são obrigatórios.' });
  }

  try {
    if (cpf) {
      const cpfExists = await prisma.client.findFirst({ where: { cpf: cpf, lawyerId: lawyerId } });
      if (cpfExists && cpfExists.name !== client) {
        return res.status(400).json({ 
          error: `Este CPF já está associado ao cliente "${cpfExists.name}". Não é possível duplicar cadastros.` 
        });
      }
    }

    let dbClient = await prisma.client.findFirst({ 
      where: { name: client, lawyerId: lawyerId } 
    });

    if (!dbClient) {
      dbClient = await prisma.client.create({
        data: { name: client, cpf: cpf || null, phone: phone || '', lawyerId: lawyerId }
      });
      console.log(`👤 Novo cliente registado: ${client}`);
    } else {
      if ((cpf && !dbClient.cpf) || (phone && !dbClient.phone)) {
        await prisma.client.update({
          where: { id: dbClient.id },
          data: { ...(cpf && !dbClient.cpf ? { cpf } : {}), ...(phone && !dbClient.phone ? { phone } : {}) }
        });
      }
    }

    const newCase = await prisma.case.create({
      data: {
        title: title,
        processNumber: processNumber || null,
        notes: notes || null,
        stage: "peticao",
        status: "Novo",
        anxietyScore: 0,
        clientId: dbClient.id,
        lawyerId: lawyerId, 
      },
      include: { client: true, timeline: true }
    });

    res.status(201).json(newCase);
  } catch (error) {
    console.error("Erro ao criar processo:", error);
    res.status(500).json({ error: 'Erro ao guardar o processo na base de dados.' });
  }
});

app.patch('/api/cases/:id/move', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { stage, status } = req.body;

  if (!stage || !status) return res.status(400).json({ error: 'Faltam parâmetros obrigatórios.' });

  try {
    const existingCase = await prisma.case.findFirst({
      where: { id: id, lawyerId: req.user.lawyerId }
    });

    if (!existingCase) return res.status(403).json({ error: 'Acesso não autorizado a este processo.' });

    const updatedCase = await prisma.case.update({
      where: { id },
      data: { stage, status }
    });
    console.log(`✅ Processo ${id} movido para: ${stage}`);
    res.json(updatedCase);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar processo.' });
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
    res.status(500).json({ error: 'Erro interno ao procurar financeiro' });
  }
});

app.post('/api/financials', authenticateToken, async (req, res) => {
  const { title, client, amount, dueDate, type } = req.body;
  const lawyerId = req.user.lawyerId;

  if (!title || !client || amount === undefined) return res.status(400).json({ error: 'Dados financeiros incompletos.' });

  try {
    const dbClient = await prisma.client.findFirst({
      where: { name: client, lawyerId: lawyerId } 
    });

    if (!dbClient) return res.status(404).json({ error: 'Cliente não encontrado no seu sistema.' });

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

// --- LEADS ---
app.get('/api/leads', authenticateToken, async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      where: { lawyerId: req.user.lawyerId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao procurar leads.' });
  }
});

app.patch('/api/leads/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const existingLead = await prisma.lead.findFirst({
      where: { id: id, lawyerId: req.user.lawyerId }
    });
    if (!existingLead) return res.status(403).json({ error: 'Acesso não autorizado a este lead.' });

    const updated = await prisma.lead.update({
      where: { id: id },
      data: { status }
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao atualizar status do lead.' });
  }
});

// --- DOCUMENTOS ---
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

// 🚀 ROTA ATUALIZADA: AGORA COM MULTER (UPLOAD REAL)
app.post('/api/documents', authenticateToken, upload.single('file'), async (req, res) => {
  const { name, client } = req.body;
  const file = req.file;

  if (!name || !client) {
    return res.status(400).json({ error: 'Nome e cliente são obrigatórios.' });
  }

  try {
    // Calcula o tamanho real do ficheiro enviado
    const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' : 'Desconhecido';
    console.log(`📥 Ficheiro Recebido: ${name} (${fileSizeMB})`);

    const newDoc = await prisma.document.create({
      data: {
        name,
        client,
        size: fileSizeMB, 
        date: new Date().toLocaleDateString('pt-PT'),
        lawyerId: req.user.lawyerId
      }
    });
    res.status(201).json(newDoc);
  } catch(e) {
    console.error("Erro ao guardar documento:", e);
    res.status(500).json({ error: 'Erro ao guardar documento.' });
  }
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`\n⚖️  PASCALE JURIS BACKEND`);
  console.log(`🚀 API Pronta e Segura: http://localhost:${PORT}`);
});

process.on('SIGTERM', async () => {
  console.log('🔴 Sinal SIGTERM recebido. A fechar conexões com o Prisma...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('✅ Servidor HTTP encerrado com segurança.');
    process.exit(0);
  });
});