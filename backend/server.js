import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// --- ROTAS DE LEITURA (O QUE JÁ TÍNHAMOS) ---

app.get('/api/health', (req, res) => {
  res.json({ status: 'Operacional', database: 'PostgreSQL Conectado' });
});

// Busca todos os processos
app.get('/api/cases', async (req, res) => {
  try {
    const cases = await prisma.case.findMany({
      include: { client: true, timeline: true }
    });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// Busca todo o financeiro
app.get('/api/financials', async (req, res) => {
  try {
    const financials = await prisma.financial.findMany({
      include: { client: true }
    });
    res.json(financials);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar financeiro' });
  }
});

// --- ROTAS DE ESCRITA (AS NOVIDADES!) ---

// 1. Mover Processo de Fase (Já tínhamos)
app.patch('/api/cases/:id/move', async (req, res) => {
  const { id } = req.params;
  const { stage, status } = req.body;

  try {
    const updatedCase = await prisma.case.update({
      where: { id },
      data: { stage, status }
    });
    console.log(`✅ Processo ${id} movido para: ${stage}`);
    res.json(updatedCase);
  } catch (error) {
    console.error("Erro ao mover:", error);
    res.status(500).json({ error: 'Erro ao atualizar processo' });
  }
});

// 2. Criar Novo Processo (Nova Função!)
app.post('/api/cases', async (req, res) => {
  const { client, phone, title } = req.body;

  try {
    // Para simplificar no MVP, pegamos o primeiro advogado registado na base
    const lawyer = await prisma.lawyer.findFirst();

    if (!lawyer) {
      return res.status(400).json({ error: 'Nenhum advogado encontrado na base de dados.' });
    }

    // 1º Passo: Verifica se o Cliente já existe ou cria um novo
    let dbClient = await prisma.client.findFirst({
      where: { name: client, phone: phone }
    });

    if (!dbClient) {
      dbClient = await prisma.client.create({
        data: {
          name: client,
          phone: phone,
          lawyerId: lawyer.id
        }
      });
      console.log(`👤 Novo cliente cadastrado: ${client}`);
    }

    // 2º Passo: Cria o Processo (Case) vinculado a este cliente
    const newCase = await prisma.case.create({
      data: {
        title: title,
        stage: "peticao",
        status: "Novo",
        anxietyScore: 0,
        clientId: dbClient.id,
        lawyerId: lawyer.id,
      },
      include: { client: true, timeline: true }
    });

    console.log(`⚖️ Novo processo criado para: ${client} - ${title}`);
    res.status(201).json(newCase);

  } catch (error) {
    console.error("Erro ao criar processo:", error);
    res.status(500).json({ error: 'Erro ao guardar o processo na base de dados.' });
  }
});

// 3. Criar Nova Fatura Financeira (Nova Função!)
app.post('/api/financials', async (req, res) => {
  const { title, client, amount, dueDate, type } = req.body;

  try {
    // Procura o cliente pelo nome para associar a dívida a ele
    const dbClient = await prisma.client.findFirst({
      where: { name: client }
    });

    if (!dbClient) {
      return res.status(404).json({ error: 'Cliente não encontrado. Por favor, crie um processo para ele primeiro.' });
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

    console.log(`💰 Nova fatura lançada: R$ ${amount} para ${client}`);
    res.status(201).json(newFinancial);

  } catch (error) {
    console.error("Erro ao lançar fatura:", error);
    res.status(500).json({ error: 'Erro ao guardar a fatura.' });
  }
});

// 4. Criar Novo Lead (Vindo do Site)
app.post('/api/leads', async (req, res) => {
  const { name, phone, type } = req.body;
  console.log(`🚀 NOVO LEAD CAPTURADO: ${name} (${type}) - ${phone}`);
  res.status(201).json({ message: 'Lead recebido com sucesso' });
});

// Root Catch-all (Para não aparecer o erro "Cannot GET /" da sua foto!)
app.get('/', (req, res) => {
  res.send('API Pascale Juris Online e Operacional! 🚀');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n⚖️  PASCALE JURIS BACKEND`);
  console.log(`🚀 API Pronta: http://localhost:${PORT}`);
});