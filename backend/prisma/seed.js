import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 A iniciar o povoamento da base de dados...')

  // 1. Criar o Advogado (Tenant)
  // Usamos upsert para evitar erro se rodar o seed 2 vezes
  const advogado = await prisma.lawyer.upsert({
    where: { email: 'admin@lopes.pt' },
    update: {},
    create: {
      email: 'admin@lopes.pt',
      password: 'admin', // Em produção, isto seria encriptado
      name: 'Dr. Marcos Lopes',
      primaryColor: '#4f46e5',
    }
  })

  console.log(`✅ Advogado garantido: ${advogado.name}`)

  // 2. Criar Cliente: Carlos Silva (Caso Complexo)
  const carlos = await prisma.client.create({
    data: {
      name: 'Carlos Silva',
      phone: '(11) 99999-9999',
      email: 'carlos@email.com',
      lawyerId: advogado.id,
      cases: {
        create: {
          title: 'Acção de Indemnização vs Banco X',
          status: 'Em Andamento',
          stage: 'analise_juiz',
          anxietyScore: 85,
          lawyerId: advogado.id, // <--- CORREÇÃO: Liga o caso ao advogado
          timeline: {
            create: [
              { title: 'Petição Inicial', description: 'Enviámos o seu pedido ao juiz.', date: '10/01/2024', completed: true },
              { title: 'Citação do Réu', description: 'O Banco foi notificado.', date: '15/01/2024', completed: true },
              { title: 'Análise do Juiz', description: 'O juiz está a ler os argumentos.', date: 'Hoje', completed: false, isCurrent: true },
              { title: 'Audiência', description: 'Reunião para ouvir testemunhas.', date: 'Pendente', completed: false },
              { title: 'Sentença', description: 'Decisão final.', date: 'Pendente', completed: false }
            ]
          }
        }
      },
      financials: {
        create: [
          { title: 'Honorários Iniciais', amount: 2500.00, dueDate: '10/01/2024', status: 'Pago', type: 'Pix' },
          { title: 'Parcela 2/10', amount: 500.00, dueDate: '10/02/2024', status: 'Atrasado', type: 'Boleto' }
        ]
      }
    }
  })

  console.log(`✅ Cliente criado: ${carlos.name}`)

  // 3. Criar Cliente: Mariana Souza (Caso Finalizado)
  const mariana = await prisma.client.create({
    data: {
      name: 'Mariana Souza',
      phone: '(21) 98888-7777',
      lawyerId: advogado.id,
      cases: {
        create: {
          title: 'Divórcio Consensual',
          status: 'A Finalizar',
          stage: 'sentenca',
          anxietyScore: 10,
          lawyerId: advogado.id, // <--- CORREÇÃO: Liga o caso ao advogado
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
            { title: 'Honorários Finais', amount: 1200.00, dueDate: '15/02/2024', status: 'Aberto', type: 'Cartão' }
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