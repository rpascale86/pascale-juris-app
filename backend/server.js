import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// --- ROTAS DE LEITURA ---

app.get('/api/health', (req, res) => {
  res.json({ status: 'Operacional', database: 'SQLite Conectado' });
});

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

// --- NOVAS ROTAS DE ESCRITA (AÇÃO REAL) ---

// 1. Mover Processo de Fase
app.patch('/api/cases/:id/move', async (req, res) => {
  const { id } = req.params;
  const { stage, status } = req.body;

  try {
    const updatedCase = await prisma.case.update({
      where: { id },
      data: { 
        stage, 
        status,
        // Opcional: Adicionar lógica para criar notificação aqui
      }
    });
    console.log(`✅ Processo ${id} movido para: ${stage}`);
    res.json(updatedCase);
  } catch (error) {
    console.error("Erro ao mover:", error);
    res.status(500).json({ error: 'Erro ao atualizar processo' });
  }
});

// 2. Criar Novo Lead (Vindo do Site)
app.post('/api/leads', async (req, res) => {
  const { name, phone, type } = req.body;
  
  // Nota: Num cenário real, criaríamos uma tabela "Lead". 
  // Por agora, vamos apenas logar para ver a funcionar.
  console.log(`🚀 NOVO LEAD CAPTURADO: ${name} (${type}) - ${phone}`);
  
  res.status(201).json({ message: 'Lead recebido com sucesso' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n⚖️  PASCALE JURIS BACKEND`);
  console.log(`🚀 API Pronta: http://localhost:${PORT}`);
});