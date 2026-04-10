const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando datos de prueba...');

  // 1. Crear usuario admin
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@empresa.com' },
    update: {},
    create: {
      email: 'admin@empresa.com',
      name: 'Admin Usuario',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Usuario creado:', user.email);

  // 2. Crear proyectos
  const project1 = await prisma.project.upsert({
    where: { id: 'proj-1' },
    update: {},
    create: {
      id: 'proj-1',
      name: 'API Backend',
      description: 'API REST Node.js con Express',
      repositoryUrl: 'https://github.com/ejemplo/api-backend',
      userId: user.id,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: 'proj-2' },
    update: {},
    create: {
      id: 'proj-2',
      name: 'Frontend App',
      description: 'Aplicación React con TypeScript',
      repositoryUrl: 'https://github.com/ejemplo/frontend-app',
      userId: user.id,
    },
  });
  console.log('✅ Proyectos creados:', project1.name, project2.name);

  // 3. Crear análisis
  const analysis1 = await prisma.analysis.upsert({
    where: { id: 'ana-1' },
    update: {},
    create: {
      id: 'ana-1',
      projectId: project1.id,
      status: 'COMPLETED',
      findingsCount: 12,
      criticalCount: 2,
      highCount: 5,
      mediumCount: 4,
      lowCount: 1,
      riskScore: 65,
      remediationRate: 45,
      startedAt: new Date(Date.now() - 86400000),
      completedAt: new Date(Date.now() - 82800000),
    },
  });

  const analysis2 = await prisma.analysis.upsert({
    where: { id: 'ana-2' },
    update: {},
    create: {
      id: 'ana-2',
      projectId: project2.id,
      status: 'COMPLETED',
      findingsCount: 8,
      criticalCount: 0,
      highCount: 2,
      mediumCount: 4,
      lowCount: 2,
      riskScore: 42,
      remediationRate: 75,
      startedAt: new Date(Date.now() - 172800000),
      completedAt: new Date(Date.now() - 169200000),
    },
  });
  console.log('✅ Análisis creados');

  // 4. Crear hallazgos (findings)
  const findings = [
    {
      id: 'find-1',
      analysisId: analysis1.id,
      type: 'SQL_INJECTION',
      severity: 'CRITICAL',
      title: 'SQL Injection en endpoint /users',
      description: 'Parámetro no sanitizado en consulta SQL',
      file: 'src/routes/users.ts',
      line: 45,
      confidence: 95,
      remediationStatus: 'OPEN',
    },
    {
      id: 'find-2',
      analysisId: analysis1.id,
      type: 'XSS',
      severity: 'HIGH',
      title: 'Cross-Site Scripting en formulario de login',
      description: 'Input no escapado en campo de usuario',
      file: 'src/components/LoginForm.tsx',
      line: 23,
      confidence: 88,
      remediationStatus: 'OPEN',
    },
    {
      id: 'find-3',
      analysisId: analysis1.id,
      type: 'WEAK_ENCRYPTION',
      severity: 'HIGH',
      title: 'Contraseñas débilmente encriptadas',
      description: 'Se usa MD5 en lugar de bcrypt',
      file: 'src/services/auth.ts',
      line: 67,
      confidence: 92,
      remediationStatus: 'IN_PROGRESS',
    },
    {
      id: 'find-4',
      analysisId: analysis2.id,
      type: 'DEPENDENCY_VULNERABILITY',
      severity: 'MEDIUM',
      title: 'Dependencia vulnerable: lodash@4.17.15',
      description: 'CVE-2021-23337',
      file: 'package.json',
      line: 12,
      confidence: 100,
      remediationStatus: 'RESOLVED',
    },
  ];

  for (const finding of findings) {
    await prisma.finding.upsert({
      where: { id: finding.id },
      update: {},
      create: finding,
    });
  }
  console.log('✅ Hallazgos creados:', findings.length);

  // 5. Crear incidentes
  const incident1 = await prisma.incident.upsert({
    where: { id: 'inc-1' },
    update: {},
    create: {
      id: 'inc-1',
      findingId: 'find-1',
      status: 'OPEN',
      severity: 'CRITICAL',
      title: 'SQL Injection crítica',
      description: 'Se debe aplicar prepared statements',
      createdAt: new Date(Date.now() - 3600000),
      dueDate: new Date(Date.now() + 3600000),
    },
  });
  console.log('✅ Incidentes creados');

  // 6. Crear reportes
  const report1 = await prisma.report.upsert({
    where: { id: 'rep-1' },
    update: {},
    create: {
      id: 'rep-1',
      projectId: project1.id,
      analysisId: analysis1.id,
      title: 'Reporte de Seguridad - API Backend',
      type: 'SECURITY_AUDIT',
      status: 'COMPLETED',
      generatedAt: new Date(Date.now() - 82800000),
    },
  });
  console.log('✅ Reportes creados');

  console.log('\n🎉 Datos de prueba sembrados correctamente!\n');
  console.log('Usuario de prueba:');
  console.log('  Email: admin@empresa.com');
  console.log('  Password: password123\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
