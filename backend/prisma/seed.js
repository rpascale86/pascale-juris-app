import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 A iniciar o povoamento da base de dados...')

  // 1. Criar o Advogado (Tenant)
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

  // 2. Criar Cliente: Carlos Silva (Com CPF e Novo Formato de Data)
  const carlos = await prisma.client.upsert({
    where: { cpf: '111.111.111-11' },
    update: {}, // Se já existir, não faz nada
    create: {
      name: 'Carlos Silva',
      cpf: '111.111.111-11',
      phone: '(11) 99999-9999',
      email: 'carlos@email.com',
      profession: 'Engenheiro',
      lawyerId: advogado.id,
      cases: {
        create: {
          title: 'Acção de Indemnização vs Banco X',
          status: 'Em Andamento',
          stage: 'analise_juiz',
          anxietyScore: 85,
          lawyerId: advogado.id,
          timeline: {
            create: [
              { title: 'Petição Inicial', description: 'Enviámos o seu pedido ao juiz.', date: '10/01/2024', completed: true },
              { title: 'Citação do Réu', description: 'O Banco foi notificado.', date: '15/01/2024', completed: true },
              { title: 'Análise do Juiz', description: 'O juiz está a analisar os argumentos.', date: 'Hoje', completed: false, isCurrent: true },
              { title: 'Audiência', description: 'Reunião para ouvir testemunhas.', date: 'Pendente', completed: false },
              { title: 'Sentença', description: 'Decisão final.', date: 'Pendente', completed: false }
            ]
          }
        }
      },
      financials: {
        create: [
          // Repare que as datas agora estão no padrão internacional YYYY-MM-DD para o banco
          { title: 'Honorários Iniciais', amount: 2500.00, dueDate: '2024-01-10', status: 'Pago', type: 'Pix' },
          { title: 'Parcela 2/10', amount: 500.00, dueDate: '2024-02-10', status: 'Atrasado', type: 'Boleto' }
        ]
      }
    }
  })

  console.log(`✅ Cliente criado: ${carlos.name}`)

  // 3. Criar Cliente: Mariana Souza
  const mariana = await prisma.client.upsert({
    where: { cpf: '222.222.222-22' },
    update: {},
    create: {
      name: 'Mariana Souza',
      cpf: '222.222.222-22',
      phone: '(21) 98888-7777',
      profession: 'Médica',
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