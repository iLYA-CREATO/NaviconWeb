const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create roles
    const userRole = await prisma.role.upsert({
        where: { name: 'Sklad' },
        update: {},
        create: {
            name: 'Sklad',
            description: 'Сотрудник склада',
        },
    });
    console.log('✅ Created role:', userRole);

    const adminRole = await prisma.role.upsert({
        where: { name: 'Admin' },
        update: {},
        create: {
            name: 'Admin',
            description: 'Администратор',
        },
    });
    console.log('✅ Created role:', adminRole);

    // Hash password
    const hashedPassword = await bcrypt.hash('123', 10);

    // Create admin user
    const adminUser = await prisma.user.upsert({
        where: { username: 'Sergey' },
        update: {
            fullName: 'Беляев Сергей',
            password: hashedPassword,
            role: 'Admin',
        },
        create: {
            username: 'Sergey',
            fullName: 'Беляев Сергей',
            email: 'admin@mail.ru',
            password: hashedPassword,
            role: 'Admin',
        },
    });
    console.log('✅ Created admin user:', adminUser);
    // Create Sklad user
    const skladUser = await prisma.user.upsert({
        where: { username: 'Demidov' },
        update: {
            fullName: 'Демидов Илья',
            password: hashedPassword,
            role: 'Sklad',
        },
        create: {
            username: 'Demidov',
            fullName: 'Демидов Илья',
            email: 'sklad@mail.ru',
            password: hashedPassword,
            role: 'Sklad',
        },
    });
    console.log('✅ Created admin user:', adminUser);

    // Create demo clients
    const client1 = await prisma.client.create({
        data: {
            name: 'Уваровская Нива',
            email: 'contact@acme.com',
            phone: '+380501234567',
        },
    });
    console.log('✅ Created client:', client1);

    const client2 = await prisma.client.create({
        data: {
            name: 'Агротехнологии',
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
            createdBy: adminUser.id,
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
            createdBy: adminUser.id,
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
            clientObjectId: object1.id,
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