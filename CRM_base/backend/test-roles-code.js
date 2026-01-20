require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testRoles() {
    const prisma = new PrismaClient();

    try {
        console.log('Testing roles query...');
        const roles = await prisma.role.findMany({
            orderBy: { createdAt: 'desc' },
        });
        console.log('✅ Success! Roles:', roles);
        return roles;
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

testRoles();