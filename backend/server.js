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

// 📦 Configuração do Multer (Limite de 10MB para otimização de memória RAM)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB Max
});

// 🔑 Chaves de Ambiente
const JWT_SECRET = process.env.JWT_SECRET || 'pascale_secret_key_2024';

// ☁️ Configuração Supabase (Substitua no seu .env quando criar a conta)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;


// ============================================================================
// --- 🤖 SERVIÇOS DE AUTOMAÇÃO (BACKGROUND WORKERS) ---
// ============================================================================

/**
 * Serviço responsável por disparar mensagens de WhatsApp.
 * Preparado para integração futura com Evolution API, Z-API ou Twilio.
 */
const sendWhatsAppNotification = async (phone, message) => {
  try {
    if (!phone) return;
    
    // Formata o número para o padrão internacional (remove parênteses e traços)
    const cleanPhone = phone.replace(/\D/g, '');
    
    console.log(`\n[🤖 WhatsApp Bot] Iniciando disparo para: +55 ${cleanPhone}`);
    console.log(`[🤖 WhatsApp Bot] Mensagem: "${message}"`);
    
    // 🚧 AQUI ENTRARÁ O SEU FETCH PARA A API DO WHATSAPP (Ex: Evolution API)
    // const response = await fetch('https://sua-api-whatsapp/message/sendText', {
    //   method: 'POST',
    //   headers: { 'apikey': process.env.WHATSAPP_API_KEY, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ number: `55${cleanPhone}`, text: message })
    // });

    console.log(`[🤖 WhatsApp Bot] ✅ Mensagem simulada enviada com sucesso em background.\n`);
  } catch (error) {
    console.error(`[🤖 WhatsApp Bot] ❌ Erro ao enviar mensagem:`, error);
  }
};


// ============================================================================
// --- 🛡️ MIDDLEWARE DE SEGURANÇA (A FRONTEIRA INVISÍVEL) ---
// ============================================================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token de segurança não fornecido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado. Faça login novamente.' });
    req.user = user;
    next();
  });
};


// ============================================================================
// --- 🔓 ROTAS PÚBLICAS (NÃO PRECISAM DE TOKEN) ---
// ============================================================================

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'E-mail e palavra-passe são obrigatórios.' });

  try {
    const lawyer = await prisma.lawyer.findUnique({ where: { email } });
    if (!lawyer) return res.status(401).json({ error: 'Credenciais inválidas.' });

    let passwordMatch = false;
    
    // Suporte para transição transparente para senhas encriptadas
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
            console.log(`🔐 Palavra-passe da conta ${email} atualizada com forte encriptação.`);
        }
    }

    if (!passwordMatch) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const token = jwt.sign(
      { lawyerId: lawyer.id, email: lawyer.email, name: lawyer.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    res.json({ token, lawyer: { id: lawyer.id, name: lawyer.name, email: lawyer.email, primaryColor: lawyer.primaryColor } });
  } catch (error) {
    console.error("Erro no processo de login:", error);
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
    res.status(500).json({ error: 'Erro interno ao tentar criar a conta.' });
  }
});

app.post('/api/leads', async (req, res) => {
  const { name, phone, type } = req.body;
  try {
    const lawyer = await prisma.lawyer.findFirst();
    if (!lawyer) return res.status(400).json({ error: 'Nenhum advogado encontrado.' });

    const newLead = await prisma.lead.create({
      data: { name, phone, type, date: "Hoje", lawyerId: lawyer.id }
    });
    res.status(201).json(newLead);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao guardar lead' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'Operacional', database: 'PostgreSQL Conectado', storage: 'Preparado para Supabase' });
  } catch (e) {
    res.status(500).json({ status: 'Erro', database: 'Falha na conexão com a base de dados' });
  }
});

app.get('/', (req, res) => { res.send('API Pascale Juris Enterprise Online! 🚀'); });


// ============================================================================
// --- 🔒 ROTAS PRIVADAS (EXIGEM TOKEN E ISOLAM DADOS POR ESCRITÓRIO) ---
// ============================================================================

// --- PROCESSOS ---
app.get('/api/cases', authenticateToken, async (req, res) => {
  try {
    const cases = await prisma.case.findMany({
      where: { lawyerId: req.user.lawyerId },
      include: { client: true, timeline: true },
      orderBy: { updatedAt: 'desc' }, 
      take: 200 
    });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno ao procurar processos' });
  }
});

app.post('/api/cases', authenticateToken, async (req, res) => {
  const { client, cpf, phone, title, processNumber, notes } = req.body;
  const lawyerId = req.user.lawyerId; 

  if (!client || !title) return res.status(400).json({ error: 'Nome do cliente e título da acção são obrigatórios.' });

  try {
    if (cpf) {
      const cpfExists = await prisma.client.findFirst({ where: { cpf: cpf, lawyerId: lawyerId } });
      if (cpfExists && cpfExists.name !== client) {
        return res.status(400).json({ error: `Este CPF já está associado ao cliente "${cpfExists.name}".` });
      }
    }

    let dbClient = await prisma.client.findFirst({ where: { name: client, lawyerId: lawyerId } });

    if (!dbClient) {
      dbClient = await prisma.client.create({ data: { name: client, cpf: cpf || null, phone: phone || '', lawyerId: lawyerId } });
    } else if ((cpf && !dbClient.cpf) || (phone && !dbClient.phone)) {
      await prisma.client.update({
        where: { id: dbClient.id },
        data: { ...(cpf && !dbClient.cpf ? { cpf } : {}), ...(phone && !dbClient.phone ? { phone } : {}) }
      });
    }

    const newCase = await prisma.case.create({
      data: {
        title, processNumber: processNumber || null, notes: notes || null,
        stage: "peticao", status: "Novo", anxietyScore: 0,
        clientId: dbClient.id, lawyerId: lawyerId, 
      },
      include: { client: true, timeline: true }
    });

    res.status(201).json(newCase);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao guardar o processo na base de dados.' });
  }
});

// 🚀 AUTOMAÇÃO INJETADA NA ATUALIZAÇÃO DO PROCESSO
app.patch('/api/cases/:id/move', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { stage, status } = req.body;

  if (!stage || !status) return res.status(400).json({ error: 'Faltam parâmetros obrigatórios.' });

  try {
    const existingCase = await prisma.case.findFirst({
      where: { id: id, lawyerId: req.user.lawyerId },
      include: { client: true } // Precisamos do cliente para saber o telemóvel!
    });

    if (!existingCase) return res.status(403).json({ error: 'Acesso não autorizado a este processo.' });

    const updatedCase = await prisma.case.update({
      where: { id },
      data: { stage, status }
    });
    
    // 🤖 Disparo da Automação de WhatsApp (Não bloqueia a resposta da API)
    if (existingCase.client && existingCase.client.phone) {
      const faseText = stage === 'analise_juiz' ? 'Em Análise pelo Juiz' : stage === 'sentenca' ? 'Concluído (Sentença)' : stage;
      const message = `Olá, ${existingCase.client.name}! Temos boas notícias. O seu processo "${existingCase.title}" avançou para a fase: ${faseText}. O ${req.user.name} está acompanhando tudo de perto.`;
      
      // Dispara assincronamente (background)
      sendWhatsAppNotification(existingCase.client.phone, message);
    }

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
  if (!title || !client || amount === undefined) return res.status(400).json({ error: 'Dados financeiros incompletos.' });

  try {
    const dbClient = await prisma.client.findFirst({ where: { name: client, lawyerId: req.user.lawyerId } });
    if (!dbClient) return res.status(404).json({ error: 'Cliente não encontrado.' });

    const newFinancial = await prisma.financial.create({
      data: { title, amount: parseFloat(amount), dueDate, type, status: "Aberto", clientId: dbClient.id }
    });
    res.status(201).json(newFinancial);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao guardar fatura.' });
  }
});

// --- LEADS ---
app.get('/api/leads', authenticateToken, async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({ where: { lawyerId: req.user.lawyerId }, orderBy: { createdAt: 'desc' } });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao procurar leads.' });
  }
});

app.patch('/api/leads/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const existingLead = await prisma.lead.findFirst({ where: { id: id, lawyerId: req.user.lawyerId } });
    if (!existingLead) return res.status(403).json({ error: 'Acesso não autorizado.' });

    const updated = await prisma.lead.update({ where: { id: id }, data: { status } });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao atualizar status.' });
  }
});

// --- DOCUMENTOS ---
app.get('/api/documents', authenticateToken, async (req, res) => {
  try {
    const docs = await prisma.document.findMany({ where: { lawyerId: req.user.lawyerId }, orderBy: { createdAt: 'desc' } });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao procurar documentos.' });
  }
});

// ☁️ ROTA ATUALIZADA: UPLOAD REAL NO SUPABASE STORAGE E GRAVAÇÃO DO LINK
app.post('/api/documents', authenticateToken, upload.single('file'), async (req, res) => {
  const { name, client } = req.body;
  const file = req.file;

  if (!name || !client || !file) {
    return res.status(400).json({ error: 'Nome, cliente e o ficheiro são obrigatórios.' });
  }

  try {
    // 1. Calcula Tamanho
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    let fileUrl = '';

    // 2. Integração Otimizada Supabase (Executa se as chaves existirem no .env)
    if (supabase) {
      const uniqueFileName = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
      
      console.log(`☁️ A enviar o ficheiro [${uniqueFileName}] para o cofre Supabase...`);
      
      const { data, error } = await supabase.storage
        .from('documentos') // Este bucket tem de ser criado lá no painel do Supabase
        .upload(uniqueFileName, file.buffer, { contentType: file.mimetype });

      if (error) throw error;

      // Recupera o Link Público
      const { data: publicUrlData } = supabase.storage.from('documentos').getPublicUrl(uniqueFileName);
      fileUrl = publicUrlData.publicUrl;
      console.log(`☁️ Upload Concluído! URL: ${fileUrl}`);
    } else {
      console.warn('⚠️ Credenciais do Supabase ausentes no .env. Guardando metadados localmente (Mock Upload).');
    }

    // 3. Grava no PostgreSQL
    const newDoc = await prisma.document.create({
      data: {
        name,
        client,
        size: fileSizeMB, 
        date: new Date().toLocaleDateString('pt-PT'),
        lawyerId: req.user.lawyerId,
        url: fileUrl // 🚀 AGORA GRAVAMOS O LINK OFICIAL NA BASE DE DADOS
      }
    });

    res.status(201).json(newDoc); 
  } catch(e) {
    console.error("Erro Crítico no Upload do Documento:", e);
    res.status(500).json({ error: 'Erro ao processar e guardar documento na nuvem.' });
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