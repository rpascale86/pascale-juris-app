import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt';

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando o povoamento do banco de dados...')

  // 1. Criar o Advogado (Tenant)
  const hashedPassword = await bcrypt.hash('admin', 12);
  const advogado = await prisma.lawyer.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      email: 'admin@admin.com',
      password: hashedPassword, // Segurança aplicada com bcrypt
      name: 'Dr. Renzo',
      primaryColor: '#0f172a', // Ajustado para o slate-900 (padrão)
    }
  })

  console.log(`✅ Advogado garantido: ${advogado.name}`)

  // UUIDs estáticos gerados para garantir a execução do upsert sem depender de @unique no CPF
  const carlosId = 'e28e469e-5683-49fb-a70e-e5b026cc331f';
  const marianaId = '8a12e5c8-11f4-422d-8e47-e855cb24e6fb';

  // 2. Criar Cliente: Carlos Silva
  const carlos = await prisma.client.upsert({
    where: { id: carlosId }, // Buscando pelo ID primário (Garante a integridade do Prisma)
    update: {}, 
    create: {
      id: carlosId,
      name: 'Carlos Silva',
      cpfCnpj: '111.111.111-11',
      phone: '(11) 99999-9999',
      email: 'carlos@email.com',
      lawyerId: advogado.id,
      cases: {
        create: {
          title: 'Ação de Indenização vs Banco X',
          status: 'Em Andamento',
          stage: 'analise_juiz',
          anxietyScore: 85,
          lawyerId: advogado.id,
          timeline: {
            create: [
              { title: 'Petição Inicial', description: 'Enviamos o seu pedido ao juiz.', date: '10/01/2024', completed: true },
              { title: 'Citação do Réu', description: 'O Banco foi notificado oficialmente.', date: '15/01/2024', completed: true },
              { title: 'Análise do Juiz', description: 'O juiz está analisando os argumentos.', date: 'Hoje', completed: false, isCurrent: true },
              { title: 'Audiência', description: 'Reunião designada para ouvir testemunhas.', date: 'Pendente', completed: false },
              { title: 'Sentença', description: 'Decisão de mérito final.', date: 'Pendente', completed: false }
            ]
          }
        }
      },
      financials: {
        create: [
          // Datas no padrão internacional YYYY-MM-DD para o banco de dados
          { title: 'Honorários Iniciais', amount: 2500.00, dueDate: '2024-01-10', status: 'Pago', type: 'Pix' },
          { title: 'Parcela 2/10', amount: 500.00, dueDate: '2024-02-10', status: 'Atrasado', type: 'Boleto' }
        ]
      }
    }
  })

  console.log(`✅ Cliente criado: ${carlos.name}`)

  // 3. Criar Cliente: Mariana Souza
  const mariana = await prisma.client.upsert({
    where: { id: marianaId }, // Buscando pelo ID primário
    update: {},
    create: {
      id: marianaId,
      name: 'Mariana Souza',
      cpfCnpj: '222.222.222-22',
      phone: '(21) 98888-7777',
      lawyerId: advogado.id,
      cases: {
        create: {
          title: 'Divórcio Consensual',
          status: 'A Finalizar',
          stage: 'sentenca',
          anxietyScore: 10,
          lawyerId: advogado.id,
          timeline: {
            create: [
                { title: 'Entrada', description: 'Processo iniciado.', date: '01/02/2024', completed: true },
                { title: 'Sentença', description: 'Divórcio homologado.', date: 'Ontem', completed: true, isCurrent: true }
            ]
          }
        }
      },
      financials: {
        create: [
            { title: 'Honorários Finais', amount: 1200.00, dueDate: '2024-02-15', status: 'Aberto', type: 'Cartão' }
        ]
      }
    }
  })

  console.log(`✅ Cliente criada: ${mariana.name}`)
  console.log('🏁 Povoamento concluído com sucesso!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })