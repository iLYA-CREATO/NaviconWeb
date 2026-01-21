const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addDiscountColumn() {
  try {
    await prisma.$executeRaw`ALTER TABLE "BidSpecification" ADD COLUMN "discount" DECIMAL(5,2) DEFAULT 0`;
    console.log('Discount column added successfully');
  } catch (error) {
    console.error('Error adding discount column:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDiscountColumn();