const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create roles
    const userRole = await prisma.role.upsert({
        where: { name: 'Пользователь' },
        update: {},
        create: {
            name: 'Пользователь',
            description: 'Обычный пользователь',
        },
    });
    console.log('✅ Created role:', userRole);

    const adminRole = await prisma.role.upsert({
        where: { name: 'Администратор' },
        update: {},
        create: {
            name: 'Администратор',
            description: 'Полный доступ',
        },
    });
    console.log('✅ Created role:', adminRole);

    // Create admin user
    const adminUser = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            fullName: 'Администратор',
            role: 'admin',
        },
        create: {
            username: 'admin',
            fullName: 'Администратор',
            email: 'admin@crm.com',
            password: 'admin123', // Plain text for development
            role: 'admin',
        },
    });
    console.log('✅ Created admin user:', adminUser);

    // Create demo clients
    const client1 = await prisma.client.create({
        data: {
            name: 'Acme Corporation',
            email: 'contact@acme.com',
            phone: '+380501234567',
        },
    });
    console.log('✅ Created client:', client1);

    const client2 = await prisma.client.create({
        data: {
            name: 'Tech Solutions Ltd',
            email: 'info@techsolutions.com',
            phone: '+380507654321',
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

    // Create demo client objects
    const object1 = await prisma.clientObject.create({
        data: {
            clientId: client1.id,
            brandModel: 'Toyota Camry',
            stateNumber: 'AA1234BB',
            equipment: null,
        },
    });
    console.log('✅ Created client object:', object1);

    const object2 = await prisma.clientObject.create({
        data: {
            clientId: client1.id,
            brandModel: 'Honda Civic',
            stateNumber: 'CC5678DD',
            equipment: 'GPS, Air Conditioning',
        },
    });
    console.log('✅ Created client object:', object2);

    // Associate objects with bids
    await prisma.bid.update({
        where: { id: bid1.id },
        data: {
            clientObjects: {
                connect: [{ id: object1.id }, { id: object2.id }],
            },
        },
    });

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