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

// 🛡️ NOVO: CHAVE SECRETA (Puxa do .env ou usa fallback)
const JWT_SECRET = process.env.JWT_SECRET || 'pascale_secret_key_2024';

// ============================================================================
// --- 🛡️ ROTAS DE AUTENTICAÇÃO (LOGIN) ---
// ============================================================================

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e palavra-passe são obrigatórios.' });
  }

  try {
    // 1. Procura o advogado pelo email
    const lawyer = await prisma.lawyer.findUnique({
      where: { email: email }
    });

    if (!lawyer) {
      // Mensagem genérica por segurança (não diz se o erro é no email ou na senha)
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // 2. Compara a senha digitada com a senha encriptada (ou em texto plano para contas antigas)
    // ⚠️ NOTA DE TRANSIÇÃO: Como o nosso seed.js antigo gravou "admin" em texto plano, 
    // precisamos de uma lógica dupla provisória até forçarmos a encriptação de todas as contas.
    let passwordMatch = false;
    
    if (lawyer.password.startsWith('$2b$')) {
        // Se a senha já estiver encriptada com bcrypt (começa com $2b$)
        passwordMatch = await bcrypt.compare(password, lawyer.password);
    } else {
        // Se for a conta antiga do seed.js (em texto plano)
        passwordMatch = (password === lawyer.password);
        
        // BÓNUS DE SEGURANÇA: Se ele fez login com a senha antiga em texto plano, 
        // nós encriptamos a senha e atualizamos a base de dados em background!
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

    // 3. Gera o Token de Acesso (JWT)
    const token = jwt.sign(
      { lawyerId: lawyer.id, email: lawyer.email, name: lawyer.name },
      JWT_SECRET,
      { expiresIn: '8h' } // O token expira em 8 horas
    );

    console.log(`✅ Login bem-sucedido: ${lawyer.name}`);
    
    // Retorna o token e os dados básicos do advogado
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


// ============================================================================
// --- ROTAS DE LEITURA ---
// ============================================================================

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'Operacional', database: 'PostgreSQL Conectado e a Responder' });
  } catch (e) {
    res.status(500).json({ status: 'Erro', database: 'Falha na conexão com a base de dados' });
  }
});

app.get('/api/cases', async (req, res) => {
  try {
    const cases = await prisma.case.findMany({
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

app.get('/api/financials', async (req, res) => {
  try {
    const financials = await prisma.financial.findMany({
      include: { client: true },
      orderBy: { dueDate: 'asc' }
    });
    res.json(financials);
  } catch (error) {
    console.error("Erro no financeiro:", error);
    res.status(500).json({ error: 'Erro interno ao procurar financeiro' });
  }
});

// ============================================================================
// --- ROTAS DE ESCRITA ---
// ============================================================================

app.patch('/api/cases/:id/move', async (req, res) => {
  const { id } = req.params;
  const { stage, status } = req.body;

  if (!stage || !status) {
    return res.status(400).json({ error: 'Faltam parâmetros obrigatórios (stage, status).' });
  }

  try {
    const updatedCase = await prisma.case.update({
      where: { id },
      data: { stage, status }
    });
    console.log(`✅ Processo ${id} movido para: ${stage}`);
    res.json(updatedCase);
  } catch (error) {
    console.error("Erro ao mover processo:", error);
    res.status(500).json({ error: 'Erro ao atualizar processo na base de dados.' });
  }
});

// CRIAÇÃO DE NOVO PROCESSO E CLIENTE (COM NÚMERO DO PROCESSO E OBSERVAÇÕES)
app.post('/api/cases', async (req, res) => {
  const { client, cpf, phone, title, processNumber, notes } = req.body;

  if (!client || !title) {
    return res.status(400).json({ error: 'Nome do cliente e título da acção são obrigatórios.' });
  }

  try {
    const lawyer = await prisma.lawyer.findFirst();
    if (!lawyer) {
      return res.status(400).json({ error: 'Nenhum advogado encontrado na base de dados.' });
    }

    // 🚨 REGRA DE NEGÓCIO: BLOQUEIA SE O CPF JÁ EXISTIR NO SISTEMA PARA OUTRO CLIENTE
    if (cpf) {
      const cpfExists = await prisma.client.findFirst({ where: { cpf: cpf } });
      if (cpfExists && cpfExists.name !== client) {
        return res.status(400).json({ 
          error: `Este CPF já está associado ao cliente "${cpfExists.name}". Não é possível duplicar cadastros.` 
        });
      }
    }

    // Procura o cliente pelo nome (para o caso de ele não ter digitado CPF)
    let dbClient = await prisma.client.findFirst({ where: { name: client } });

    // Se não existe, cria um novo
    if (!dbClient) {
      dbClient = await prisma.client.create({
        data: { 
          name: client, 
          cpf: cpf || null, 
          phone: phone || '', 
          lawyerId: lawyer.id 
        }
      });
      console.log(`👤 Novo cliente registado: ${client} (CPF: ${cpf})`);
    } else {
      // Se o cliente já existia no sistema mas não tinha CPF ou Phone, atualiza-o
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

    // Cria o processo anexando os novos campos inteligentes
    const newCase = await prisma.case.create({
      data: {
        title: title,
        processNumber: processNumber || null,
        notes: notes || null,
        stage: "peticao",
        status: "Novo",
        anxietyScore: 0,
        clientId: dbClient.id,
        lawyerId: lawyer.id,
      },
      include: { client: true, timeline: true }
    });

    console.log(`⚖️ Novo processo criado: ${title}`);
    res.status(201).json(newCase);
  } catch (error) {
    console.error("Erro ao criar processo:", error);
    res.status(500).json({ error: 'Erro ao guardar o processo na base de dados.' });
  }
});

app.post('/api/financials', async (req, res) => {
  const { title, client, amount, dueDate, type } = req.body;

  if (!title || !client || amount === undefined) {
    return res.status(400).json({ error: 'Dados financeiros incompletos.' });
  }

  try {
    const dbClient = await prisma.client.findFirst({
      where: { name: client }
    });

    if (!dbClient) {
      return res.status(404).json({ error: 'Cliente não encontrado no sistema.' });
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

    console.log(`💰 Fatura criada: R$ ${amount} para ${client}`);
    res.status(201).json(newFinancial);
  } catch (error) {
    console.error("Erro ao lançar fatura:", error);
    res.status(500).json({ error: 'Erro interno ao guardar a fatura.' });
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

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`\n⚖️  PASCALE JURIS BACKEND`);
  console.log(`🚀 API Pronta: http://localhost:${PORT}`);
});

process.on('SIGTERM', async () => {
  console.log('🔴 Sinal SIGTERM recebido. A fechar conexões com o Prisma...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('✅ Servidor HTTP encerrado com segurança.');
    process.exit(0);
  });
});