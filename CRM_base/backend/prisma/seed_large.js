const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
const russianCars = ['ВАЗ 2107', 'ГАЗель', 'КамАЗ', 'Мерседес-Бенц Sprinter', 'Фольксваген Crafter', 'Мазда CX-5', 'Тойота Camry', 'Хонда Civic', 'Форд Focus', 'Рено Logan', 'Шкода Octavia', 'Киа Rio', 'Хендай Solaris', 'Лада Веста', 'Лада Гранта', 'УАЗ Патриот', 'Нива', 'Жигули', 'Волга', 'Ока'];
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
        where: { username: 'Sergei' },
        update: {
            fullName: 'Беляев Сергей',
            password: hashedPassword,
            role: 'Admin',
        },
        create: {
            username: 'Sergei',
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
    const clients = [];
    for (let i = 0; i < 200; i++) {
        const client = await prisma.client.create({
            data: {
                name: faker.company.name(),
                email: faker.internet.email().replace(/@.*/, '@' + faker.helpers.arrayElement(['mail.ru', 'yandex.ru', 'gmail.com', 'ukr.net'])),
                phone: faker.phone.number('+38050#######'),
            },
        });
        clients.push(client);
        console.log('✅ Created client:', client.name);
    }

    // Create demo client objects
    const clientObjects = [];
    for (let i = 0; i < 100; i++) {
        const obj = await prisma.clientObject.create({
            data: {
                clientId: faker.helpers.arrayElement(clients).id,
                brandModel: faker.helpers.arrayElement(russianCars),
                stateNumber: faker.vehicle.vrm(),
                equipment: faker.lorem.words(2),
            },
        });
        clientObjects.push(obj);
        console.log('✅ Created client object:', obj.brandModel);
    }

    // Create demo bids
    const bids = [];
    const statuses = ['Pending', 'Accepted', 'Rejected', 'Completed'];
    for (let i = 0; i < 300; i++) {
        const bid = await prisma.bid.create({
            data: {
                clientId: faker.helpers.arrayElement(clients).id,
                clientObjectId: faker.helpers.maybe(() => faker.helpers.arrayElement(clientObjects).id, { probability: 0.5 }),
                tema: faker.lorem.words(3),
                amount: faker.number.int({ min: 10000, max: 500000 }),
                status: faker.helpers.arrayElement(statuses),
                description: faker.lorem.sentences(2),
                createdBy: faker.helpers.arrayElement([adminUser.id, skladUser.id]),
            },
        });
        bids.push(bid);
        console.log('✅ Created bid:', bid.tema);
    }

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

    // Get other categories
    const autopilotCategory = await prisma.specificationCategory.findFirst({
        where: { name: 'Автопилот' }
    });

    const armCategory = await prisma.specificationCategory.findFirst({
        where: { name: 'АРМ' }
    });

    const navigationCategory = await prisma.specificationCategory.findFirst({
        where: { name: 'Навигация' }
    });

    // Create autopilot specifications
    const autopilotSpecs = [
        { name: 'Установка автопилота', cost: 1500 },
        { name: 'Настройка автопилота', cost: 500 },
        { name: 'Диагностика автопилота', cost: 300 },
        { name: 'Замена блока автопилота', cost: 1200 },
        { name: 'Калибровка автопилота', cost: 400 },
    ];

    for (const spec of autopilotSpecs) {
        await prisma.specification.create({
            data: {
                categoryId: autopilotCategory.id,
                name: spec.name,
                cost: spec.cost,
                discount: 0,
            },
        });
        console.log('✅ Created specification:', spec.name);
    }

    // Create ARM specifications
    const armSpecs = [
        { name: 'Установка АРМ водителя', cost: 2000 },
        { name: 'Настройка АРМ', cost: 600 },
        { name: 'Диагностика АРМ', cost: 400 },
        { name: 'Замена дисплея АРМ', cost: 800 },
        { name: 'Обновление ПО АРМ', cost: 300 },
    ];

    for (const spec of armSpecs) {
        await prisma.specification.create({
            data: {
                categoryId: armCategory.id,
                name: spec.name,
                cost: spec.cost,
                discount: 0,
            },
        });
        console.log('✅ Created specification:', spec.name);
    }

    // Create navigation specifications
    const navigationSpecs = [
        { name: 'Установка навигатора', cost: 800 },
        { name: 'Настройка навигации', cost: 200 },
        { name: 'Диагностика навигатора', cost: 150 },
        { name: 'Замена антенны навигатора', cost: 300 },
        { name: 'Обновление карт навигатора', cost: 100 },
    ];

    for (const spec of navigationSpecs) {
        await prisma.specification.create({
            data: {
                categoryId: navigationCategory.id,
                name: spec.name,
                cost: spec.cost,
                discount: 0,
            },
        });
        console.log('✅ Created specification:', spec.name);
    }

    // Get all specifications
    const allSpecifications = await prisma.specification.findMany();

    // Create BidSpecifications for bids
    for (const bid of bids) {
        const numSpecs = faker.number.int({ min: 1, max: 5 });
        const selectedSpecs = faker.helpers.arrayElements(allSpecifications, numSpecs);
        for (const spec of selectedSpecs) {
            await prisma.bidSpecification.create({
                data: {
                    bidId: bid.id,
                    specificationId: spec.id,
                    executorId: faker.helpers.maybe(() => faker.helpers.arrayElement([adminUser.id, skladUser.id]), { probability: 0.3 }),
                },
            });
        }
        console.log(`✅ Created ${numSpecs} specifications for bid: ${bid.tema}`);
    }

    // Create demo equipment
    const equipmentList = [];
    for (let i = 0; i < 30; i++) {
        const eq = await prisma.equipment.create({
            data: {
                name: 'Smart-' + faker.string.alphanumeric(4),
                productCode: faker.number.int({ min: 1000, max: 9999 }),
                description: faker.lorem.sentence(),
                sellingPrice: faker.number.int({ min: 5000, max: 50000 }),
            },
        });
        equipmentList.push(eq);
        console.log('✅ Created equipment:', eq.name);
    }

    // Create demo suppliers
    const suppliersList = [];
    for (let i = 0; i < 20; i++) {
        const sup = await prisma.supplier.create({
            data: {
                name: faker.company.name(),
                entityType: faker.helpers.arrayElement(['Юр. лицо', 'Физ. лицо']),
                inn: faker.string.numeric(12),
                phone: faker.phone.number('+38050#######'),
                email: faker.internet.email().replace(/@.*/, '@' + faker.helpers.arrayElement(['mail.ru', 'yandex.ru', 'gmail.com', 'ukr.net'])),
            },
        });
        suppliersList.push(sup);
        console.log('✅ Created supplier:', sup.name);
    }

    // Create demo warehouses
    const warehousesList = [
        { name: 'Навикон' },
        { name: 'Навикон+' },
        { name: 'Парсек' },
    ];

    for (const warehouse of warehousesList) {
        await prisma.warehouse.create({
            data: {
                name: warehouse.name,
            },
        });
        console.log('✅ Created warehouse:', warehouse.name);
    }

    const warehouses = await prisma.warehouse.findMany();

    // Create equipment items
    for (let eq of equipmentList) {
        const numItems = faker.number.int({ min: 5, max: 20 });
        for (let j = 0; j < numItems; j++) {
            await prisma.equipmentItem.create({
                data: {
                    equipmentId: eq.id,
                    supplierId: faker.helpers.arrayElement(suppliersList).id,
                    warehouseId: faker.helpers.arrayElement(warehouses).id,
                    imei: faker.string.alphanumeric(15),
                    purchasePrice: faker.number.int({ min: 3000, max: 40000 }),
                    bidId: faker.helpers.maybe(() => faker.helpers.arrayElement(bids).id, { probability: 0.3 }),
                },
            });
        }
        console.log('✅ Created items for equipment:', eq.name);
    }

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