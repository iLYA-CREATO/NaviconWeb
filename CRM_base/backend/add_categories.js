const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const categories = [
        'Терминалы',
        'Датчики уровня топлива',
        'Тахографы',
        'Допог',
        'Блоки СКЗИ',
        'Carvis',
        'Оборудование подрядчиков',
        'Система мониторинга осевых нагрузок',
    ];

    for (const name of categories) {
        try {
            await prisma.equipmentCategory.upsert({
                where: { name },
                update: {},
                create: {
                    name,
                    description: null,
                    updatedAt: new Date(),
                },
            });
            console.log('✅ Created category:', name);
        } catch (error) {
            console.log('⚠️ Category already exists or error:', name, error.message);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
