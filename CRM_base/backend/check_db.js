const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabases() {
  try {
    const databases = await prisma.$queryRaw`SELECT datname FROM pg_database WHERE datistemplate = false;`;
    console.log('Available databases:', databases);
    const version = await prisma.$queryRaw`SELECT version();`;
    console.log('PostgreSQL version:', version);
    const owner = await prisma.$queryRaw`SELECT datname, datdba::text as owner FROM pg_database WHERE datname = 'naviconbaseroot';`;
    console.log('Database owner:', owner);
    const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`;
    console.log('Tables in public schema:', tables);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabases();