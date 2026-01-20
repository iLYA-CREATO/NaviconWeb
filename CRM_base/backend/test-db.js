const { PrismaClient } = require('@prisma/client');

async function testDB() {
    const prisma = new PrismaClient();

    try {
        console.log('Testing database connection...');

        // Попробуем получить роли
        const roles = await prisma.role.findMany({
            orderBy: { createdAt: 'desc' },
        });

        console.log('Roles found:', roles.length);
        console.log('Roles:', roles);

    } catch (error) {
        console.error('Database error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testDB();