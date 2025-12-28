const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create admin user
    const adminUser = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@crm.com',
            password: 'admin123', // Plain text for development
        },
    });
    console.log('✅ Created admin user:', adminUser);

    // Create demo clients
    const client1 = await prisma.client.create({
        data: {
            name: 'Acme Corporation',
            email: 'contact@acme.com',
            phone: '+380501234567',
            company: 'Acme Corp',
            status: 'Active',
        },
    });
    console.log('✅ Created client:', client1);

    const client2 = await prisma.client.create({
        data: {
            name: 'Tech Solutions Ltd',
            email: 'info@techsolutions.com',
            phone: '+380507654321',
            company: 'Tech Solutions',
            status: 'Pending',
        },
    });
    console.log('✅ Created client:', client2);

    // Create demo bids
    const bid1 = await prisma.bid.create({
        data: {
            clientId: client1.id,
            title: 'Website Redesign',
            amount: 50000,
            status: 'Pending',
            description: 'Complete website redesign project',
        },
    });
    console.log('✅ Created bid:', bid1);

    const bid2 = await prisma.bid.create({
        data: {
            clientId: client2.id,
            title: 'Mobile App Development',
            amount: 120000,
            status: 'Accepted',
            description: 'Cross-platform mobile application',
        },
    });
    console.log('✅ Created bid:', bid2);

    console.log('🎉 Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });