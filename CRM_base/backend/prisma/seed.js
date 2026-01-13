const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');


    const adminRole = await prisma.role.upsert({
        where: { name: 'Админ' },
        update: {},
        create: {
            name: 'Админ',
            description: 'Администратор',
        },
    });
    console.log('✅ Created role:', adminRole);

    const managerRole = await prisma.role.upsert({
        where: { name: 'Менеджер' },
        update: {},
        create: {
            name: 'Менеджер',
            description: 'Менеджер',
        },
    });
    console.log('✅ Created role:', managerRole);

    const techSpecialistRole = await prisma.role.upsert({
        where: { name: 'Технический специалист' },
        update: {},
        create: {
            name: 'Технический специалист',
            description: 'Технический специалист',
        },
    });
    console.log('✅ Created role:', techSpecialistRole);

    const accountantRole = await prisma.role.upsert({
        where: { name: 'Бухгалтер' },
        update: {},
        create: {
            name: 'Бухгалтер',
            description: 'Бухгалтер',
        },
    });
    console.log('✅ Created role:', accountantRole);

    const installerRole = await prisma.role.upsert({
        where: { name: 'Монтажник' },
        update: {},
        create: {
            name: 'Монтажник',
            description: 'Монтажник',
        },
    });
    console.log('✅ Created role:', installerRole);

    const userRole = await prisma.role.upsert({
        where: { name: 'Пользователь' },
        update: {},
        create: {
            name: 'Пользователь',
            description: 'Пользователь',
        },
    });
    console.log('✅ Created role:', userRole);
    // Create default bid type
    const defaultBidType = await prisma.bidType.create({
        data: {
            name: 'Стандартная заявка',
            description: 'Стандартный тип заявки',
            statuses: [
                { name: 'Открыта', position: 1, allowedActions: ["edit", "assign_executor"] },
                { name: 'Закрыта', position: 999, allowedActions: [] }
            ],
            transitions: [
                { fromPosition: 1, toPosition: 999 }
            ]
        },
    });
    console.log('✅ Created bid type:', defaultBidType);

    // Hash password
    const hashedPassword = await bcrypt.hash('123', 10);

    // Create admin user
    const adminUser = await prisma.user.upsert({
        where: { username: 'Sergei' },
        update: {
            fullName: 'Беляев Сергей',
            password: hashedPassword,
            role: 'Админ',
        },
        create: {
            username: 'Sergei',
            fullName: 'Беляев Сергей',
            email: 'admin@mail.ru',
            password: hashedPassword,
            role: 'Админ',
        },
    });


    // Менеджеры
    const managerUser1 = await prisma.user.upsert({
        where: { username: 'Olga' },
        update: {
            fullName: 'Кречетова Ольга',
            password: hashedPassword,
            role: 'Менеджер',
        },
        create: {
            username: 'Olga',
            fullName: 'Кречетова Ольга',
            email: 'manager1@mail.ru',
            password: hashedPassword,
            role: 'Менеджер',
        },
    });
    const managerUser2 = await prisma.user.upsert({
        where: { username: 'Nasty999' },
        update: {
            fullName: 'Горбунова Анастасия',
            password: hashedPassword,
            role: 'Менеджер',
        },
        create: {
            username: 'Nasty999',
            fullName: 'Горбунова Анастасия',
            email: 'manager2@mail.ru',
            password: hashedPassword,
            role: 'Менеджер',
        },
    });
    const managerUser3 = await prisma.user.upsert({
        where: { username: 'VV' },
        update: {
            fullName: 'Василенко Вадим',
            password: hashedPassword,
            role: 'Менеджер',
        },
        create: {
            username: 'VV',
            fullName: 'Василенко Вадим',
            email: 'manager3@mail.ru',
            password: hashedPassword,
            role: 'Менеджер',
        },
    });
    const managerUser4 = await prisma.user.upsert({
        where: { username: 'CV' },
        update: {
            fullName: 'Стариков Вадим',
            password: hashedPassword,
            role: 'Менеджер',
        },
        create: {
            username: 'CV',
            fullName: 'Стариков Вадим',
            email: 'manager4@mail.ru',
            password: hashedPassword,
            role: 'Менеджер',
        },
    });
    // Монтажники
    const montagUser1 = await prisma.user.upsert({
        where: { username: 'Vladik' },
        update: {
            fullName: 'Евдокимов Владислав',
            password: hashedPassword,
            role: 'Монтажник',
        },
        create: {
            username: 'Vladik',
            fullName: 'Евдокимов Владислав',
            email: 'installer1@mail.ru',
            password: hashedPassword,
            role: 'Монтажник',
        },
    });
    const montagUser2 = await prisma.user.upsert({
        where: { username: 'Zuev' },
        update: {
            fullName: 'Зуев Сергей',
            password: hashedPassword,
            role: 'Монтажник',
        },
        create: {
            username: 'Zuev',
            fullName: 'Зуев Сергей',
            email: 'installer2@mail.ru',
            password: hashedPassword,
            role: 'Монтажник',
        },
    });

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
            bidTypeId: defaultBidType.id,
            tema: 'Website Redesign',
            amount: 50000,
            status: 'Открыта',
            description: 'Complete website redesign project',
            createdBy: adminUser.id,
        },
    });
    console.log('✅ Created bid:', bid1);

    const bid2 = await prisma.bid.create({
        data: {
            clientId: client2.id,
            bidTypeId: defaultBidType.id,
            tema: 'Mobile App Development',
            amount: 120000,
            status: 'Открыта',
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

    // Create specification categories
    const categories = [
        'Автопилот',
        'АРМ',
        'Навигация',
        'Прочее',
        'Тахографы'
    ];

    for (const categoryName of categories) {
        await prisma.specificationCategory.create({
            data: {
                name: categoryName,
            },
        });
        console.log('✅ Created specification category:', categoryName);
    }

    // Get the tachograph category
    const tachographCategory = await prisma.specificationCategory.findFirst({
        where: { name: 'Тахографы' }
    });

    // Create tachograph specifications
    const tachographSpecs = [
        { name: 'Демонтаж/Монтаж/Калибровка тахографа', cost: 550 },
        { name: 'Демонтаж тахографа', cost: 110 },
        { name: 'Диагностика спидометра, Д/С', cost: 220 },
        { name: 'Диагностика тахографа', cost: 220 },
        { name: 'Замена байонетной фишки', cost: 330 },
        { name: 'Замена д/с', cost: 400 },
        { name: 'Замена спидометра', cost: 300 },
        { name: 'Замена фишки А/В', cost: 150 },
        { name: 'Замена фишки Д/С', cost: 330 },
        { name: 'Исправление неполадок спидометра, Д/С', cost: 330 },
        { name: 'Калибровка тахографа', cost: 330 },
        { name: 'Корректировка пробега', cost: 100 },
        { name: 'Монтаж тахографа', cost: 110 },
        { name: 'Настройка тахографа', cost: 110 },
        { name: 'Прошивка тахографа', cost: 110 },
        { name: 'Ремонт проводки', cost: 440 },
        { name: 'Связь с датчиком (VDO - Kitas)', cost: 150 },
        { name: 'Установка Д/С', cost: 300 },
        { name: 'Установка сигнальной проводки', cost: 440 },
        { name: 'Установка сигнальной проводки ИНО', cost: 1100 },
        { name: 'Установка спидометра', cost: 330 },
        { name: 'Установка тахографа', cost: 770 },
        { name: 'Установка тахографа вместо VDO', cost: 550 },
        { name: 'Установка тахографа с подготовкой', cost: 550 },
    ];

    for (const spec of tachographSpecs) {
        await prisma.specification.create({
            data: {
                categoryId: tachographCategory.id,
                name: spec.name,
                cost: spec.cost,
                discount: 0,
            },
        });
        console.log('✅ Created specification:', spec.name);
    }

    // Get the prochee category
    const procheeCategory = await prisma.specificationCategory.findFirst({
        where: { name: 'Прочее' }
    });

    // Create prochee specifications
    const procheeSpecs = [
        { name: 'Диагностика проводки', cost: 220 },
        { name: 'Дорога 1км', cost: 1.50 },
        { name: 'Замена антенн', cost: 220 },
        { name: 'Замена держака предохранителя', cost: 200 },
        { name: 'Замена клемм-колец', cost: 200 },
        { name: 'Замена предохранителя', cost: 100 },
        { name: 'Комплект видеонаблюдения', cost: 1900 },
        { name: 'Монтаж видеокамеры', cost: 400 },
        { name: 'Монтаж видеокамеры + 10м провода', cost: 1000 },
        { name: 'Монтаж видеокамеры + 5м провода', cost: 600 },
        { name: 'Монтаж видеорегистатора', cost: 500 },
        { name: 'Монтаж кожуха ГВАБ', cost: 350 },
        { name: 'Монтаж кронштейна СИО', cost: 200 },
        { name: 'Монтаж НК 19', cost: 300 },
        { name: 'Монтаж проблескового маяка', cost: 800 },
        { name: 'Монтаж розетки на полуприцеп', cost: 1000 },
        { name: 'Перепломбировка', cost: 150 },
        { name: 'Переработка в выходной', cost: 400 },
        { name: 'Повышающий коэф.', cost: 1000 },
        { name: 'Разборка/Сборка приборных панелей', cost: 550 },
        { name: 'Ремонт проводки', cost: 450 },
        { name: 'Сборка/Пайка проводки ADM под прикуриватель', cost: 100 },
        { name: 'Установка ГВАБ', cost: 1100 },
        { name: 'Установка ГВАБ ИНО', cost: 1650 },
        { name: 'Установка курсоуказателя', cost: 500 },
        { name: 'Установка рации', cost: 1300 },
        { name: 'Установка УОС', cost: 850 },
        { name: 'Установка УОС + клапан', cost: 1000 },
    ];

    for (const spec of procheeSpecs) {
        await prisma.specification.create({
            data: {
                categoryId: procheeCategory.id,
                name: spec.name,
                cost: spec.cost,
                discount: 0,
            },
        });
        console.log('✅ Created specification:', spec.name);
    }

    // Create demo equipment
    const equipmentList = [
        { name: 'Smart-2430', productCode: 2430 },
        { name: 'Smart-2435', productCode: 2435 },
        { name: 'Smart-2421', productCode: 2421 },
        { name: 'Smart-2411', productCode: 2411 },
        { name: 'Smart-2413', productCode: 2413 },
        { name: 'Smart-2423', productCode: 2423 },
        { name: 'Smart-2412', productCode: 2412 },
        { name: 'Smart-2425', productCode: 2425 },
        { name: 'Smart-2433', productCode: 2433 },
    ];

    for (const equipment of equipmentList) {
        await prisma.equipment.create({
            data: {
                name: equipment.name,
                productCode: equipment.productCode,
            },
        });
        console.log('✅ Created equipment:', equipment.name, 'with product code:', equipment.productCode);
    }

    // Create demo suppliers
    const suppliersList = [
        {
            name: 'Инкотекст',
            entityType: 'Юр. лицо',
            inn: '123456789012',
            phone: '+380501234567',
            email: 'info@inkotext.com'
        },
        {
            name: 'СпецПроект2',
            entityType: 'Юр. лицо',
            inn: '987654321098',
            phone: '+380507654321',
            email: 'contact@specproject2.com'
        },
        {
            name: 'Навтелеком',
            entityType: 'Юр. лицо',
            inn: '456789012345',
            phone: '+380509876543',
            email: 'support@navtelecom.com'
        },
        {
            name: 'ЧипДип',
            entityType: 'Юр. лицо',
            inn: '789012345678',
            phone: '+380501112233',
            email: 'sales@chipdip.com'
        },
    ];

    for (const supplier of suppliersList) {
        await prisma.supplier.create({
            data: {
                name: supplier.name,
                entityType: supplier.entityType,
                inn: supplier.inn,
                phone: supplier.phone,
                email: supplier.email,
            },
        });
        console.log('✅ Created supplier:', supplier.name);
    }


    // Update all users to Admin role
    await prisma.user.updateMany({
        data: { role: 'Админ' }
    });
    console.log('✅ Updated all users to Admin role');

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