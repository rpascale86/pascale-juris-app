import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
// 🛡️ IMPORTAÇÃO DAS BIBLIOTECAS DE SEGURANÇA
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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

// 🛡️ CHAVE SECRETA (Puxa do .env ou usa fallback)
const JWT_SECRET = process.env.JWT_SECRET || 'pascale_secret_key_2024';

// ============================================================================
// --- 🛡️ MIDDLEWARE DE SEGURANÇA (A FRONTEIRA INVISÍVEL) ---
// ============================================================================
// Esta função verifica se o utilizador enviou um Token válido antes de 
// o deixar aceder aos dados da base de dados.
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato esperado: "Bearer TOKEN_AQUI"

  if (token == null) {
    return res.status(401).json({ error: 'Acesso negado. Token de segurança não fornecido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado. Faça login novamente.' });
    
    // Se o token for válido, guardamos os dados do advogado (incluindo o lawyerId)
    // na variável `req.user` para a usarmos nas rotas seguintes.
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
    return res.status(400).json({ error: 'Email e palavra-passe são obrigatórios.' });
  }

  try {
    const lawyer = await prisma.lawyer.findUnique({
      where: { email: email }
    });

    if (!lawyer) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    let passwordMatch = false;
    
    // Suporte para contas antigas vs contas novas encriptadas
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
            console.log(`🔐 Senha da conta ${email} foi encriptada em background com sucesso.`);
        }
    }

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // O Token agora carrega o ID do Advogado para isolamento de dados!
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

app.post('/api/leads', async (req, res) => {
  const { name, phone, type } = req.body;
  console.log(`🚀 NOVO LEAD CAPTURADO: ${name} (${type}) - ${phone}`);
  res.status(201).json({ message: 'Lead recebido com sucesso' });
});

app.get('/', (req, res) => {
  res.send('API Pascale Juris Online e Otimizada para Produção! 🚀');
});


// ============================================================================
// --- 🔒 ROTAS PRIVADAS (EXIGEM TOKEN E ISOLAM OS DADOS POR ESCRITÓRIO) ---
// ============================================================================

// Repare no "authenticateToken" injetado na rota!
app.get('/api/cases', authenticateToken, async (req, res) => {
  try {
    const cases = await prisma.case.findMany({
      where: { lawyerId: req.user.lawyerId }, // 🚨 ISOLAMENTO DE DADOS: Apenas do advogado logado!
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

app.get('/api/financials', authenticateToken, async (req, res) => {
  try {
    const financials = await prisma.financial.findMany({
      where: { client: { lawyerId: req.user.lawyerId } }, // 🚨 ISOLAMENTO DE DADOS: Apenas faturas dos seus clientes
      include: { client: true },
      orderBy: { dueDate: 'asc' }
    });
    res.json(financials);
  } catch (error) {
    console.error("Erro no financeiro:", error);
    res.status(500).json({ error: 'Erro interno ao procurar financeiro' });
  }
});

app.patch('/api/cases/:id/move', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { stage, status } = req.body;

  if (!stage || !status) {
    return res.status(400).json({ error: 'Faltam parâmetros obrigatórios.' });
  }

  try {
    // Verifica se o processo pertence de facto ao advogado que tentou movê-lo
    const existingCase = await prisma.case.findFirst({
      where: { id: id, lawyerId: req.user.lawyerId }
    });

    if (!existingCase) {
      return res.status(403).json({ error: 'Acesso não autorizado a este processo.' });
    }

    const updatedCase = await prisma.case.update({
      where: { id },
      data: { stage, status }
    });
    console.log(`✅ Processo ${id} movido para: ${stage} pelo advogado ${req.user.name}`);
    res.json(updatedCase);
  } catch (error) {
    console.error("Erro ao mover processo:", error);
    res.status(500).json({ error: 'Erro ao atualizar processo na base de dados.' });
  }
});

app.post('/api/cases', authenticateToken, async (req, res) => {
  const { client, cpf, phone, title, processNumber, notes } = req.body;
  const lawyerId = req.user.lawyerId; // 🚨 Puxamos o ID do dono da conta através do Token JWT

  if (!client || !title) {
    return res.status(400).json({ error: 'Nome do cliente e título da acção são obrigatórios.' });
  }

  try {
    if (cpf) {
      const cpfExists = await prisma.client.findFirst({ where: { cpf: cpf } });
      if (cpfExists && cpfExists.name !== client) {
        return res.status(400).json({ 
          error: `Este CPF já está associado ao cliente "${cpfExists.name}". Não é possível duplicar cadastros.` 
        });
      }
    }

    // Procura o cliente atrelado a ESTE advogado especificamente
    let dbClient = await prisma.client.findFirst({ 
      where: { name: client, lawyerId: lawyerId } 
    });

    if (!dbClient) {
      dbClient = await prisma.client.create({
        data: { 
          name: client, 
          cpf: cpf || null, 
          phone: phone || '', 
          lawyerId: lawyerId // Atribui o cliente a este advogado
        }
      });
      console.log(`👤 Novo cliente registado: ${client} (CPF: ${cpf}) para o escritório ${req.user.name}`);
    } else {
      if ((cpf && !dbClient.cpf) || (phone && !dbClient.phone)) {
        await prisma.client.update({
          where: { id: dbClient.id },
          data: { 
            ...(cpf && !dbClient.cpf ? { cpf } : {}),
            ...(phone && !dbClient.phone ? { phone } : {})
          }
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
        lawyerId: lawyerId, // Atribui o processo a este advogado
      },
      include: { client: true, timeline: true }
    });

    res.status(201).json(newCase);
  } catch (error) {
    console.error("Erro ao criar processo:", error);
    res.status(500).json({ error: 'Erro ao guardar o processo na base de dados.' });
  }
});

app.post('/api/financials', authenticateToken, async (req, res) => {
  const { title, client, amount, dueDate, type } = req.body;
  const lawyerId = req.user.lawyerId;

  if (!title || !client || amount === undefined) {
    return res.status(400).json({ error: 'Dados financeiros incompletos.' });
  }

  try {
    const dbClient = await prisma.client.findFirst({
      where: { name: client, lawyerId: lawyerId } // Procura o cliente APENAS neste escritório
    });

    if (!dbClient) {
      return res.status(404).json({ error: 'Cliente não encontrado no seu sistema.' });
    }

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
    console.error("Erro ao lançar fatura:", error);
    res.status(500).json({ error: 'Erro interno ao guardar a fatura.' });
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