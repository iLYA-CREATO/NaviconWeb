const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Глобальная настройка тестов
beforeAll(async () => {
  // Подключение к тестовой базе данных
  await prisma.$connect();
});

afterAll(async () => {
  // Отключение от базы данных
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Очистка базы данных перед каждым тестом
  const tablenames = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
  `;

  for (const { tablename } of tablenames) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
  }
});