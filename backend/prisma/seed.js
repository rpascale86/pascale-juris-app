import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o seeding do banco de dados (Tenant Master)...');

  // Verifica se já existe um admin para não duplicar
  const existingAdmin = await prisma.lawyer.findUnique({
    where: { email: 'admin@lopes.pt' } // Use o email que preferir para o master
  });

  if (existingAdmin) {
    console.log('Administrador já existe. Seeding ignorado.');
    return;
  }

  // Gera o Hash da senha 'admin' com salt de 12 rounds
  const hashedPassword = await bcrypt.hash('admin', 12);

  const masterLawyer = await prisma.lawyer.create({
    data: {
      name: 'Administrador Master',
      email: 'admin@lopes.pt', // Email de acesso
      password: hashedPassword, // Senha encriptada
      officeName: 'Pascale Juris Corp',
      primaryColor: '#1e293b'
    }
  });

  console.log(`Tenant Master criado com sucesso! ID: ${masterLawyer.id}`);
  console.log('Acesso: admin@lopes.pt | Senha: admin');
}

main()
  .catch((e) => {
    console.error('Falha crítica no Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });