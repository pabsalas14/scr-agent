import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Crear usuario de prueba
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@empresa.com' },
    update: {},
    create: {
      email: 'admin@empresa.com',
      name: 'Admin Usuario',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Usuario creado:', user);

  // Crear proyectos de prueba
  const project1 = await prisma.project.upsert({
    where: { id: 'proj-1' },
    update: {},
    create: {
      id: 'proj-1',
      name: 'API Backend',
      description: 'API REST de prueba',
      repoUrl: 'https://github.com/ejemplo/api-backend',
      userId: user.id,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: 'proj-2' },
    update: {},
    create: {
      id: 'proj-2',
      name: 'Frontend App',
      description: 'Aplicación React de prueba',
      repoUrl: 'https://github.com/ejemplo/frontend-app',
      userId: user.id,
    },
  });

  console.log('Proyectos creados:', { project1, project2 });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
