require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testSavePermissions() {
    const prisma = new PrismaClient();

    try {
        console.log('Testing permissions save...');

        // Создадим тестовую роль с правами
        const testPermissions = {
            user_create: true,
            user_edit: false,
            user_delete: true,
            role_create: false,
            role_edit: false,
            role_delete: false,
            spec_category_create: true,
            spec_category_edit: true,
            spec_category_delete: false,
            spec_create: true,
            spec_edit: false,
            spec_delete: false,
            bid_type_create: false,
            bid_type_edit: false,
            bid_type_delete: false,
            client_create: true,
            client_edit: true,
            client_delete: false,
            bid_create: true,
            bid_edit: true,
            bid_delete: false,
            bid_equipment_add: true,
            tab_warehouse: true,
            tab_salary: false,
        };

        const role = await prisma.role.create({
            data: {
                name: 'Тестовая роль с правами',
                description: 'Роль для тестирования прав доступа',
                permissions: testPermissions,
            },
        });

        console.log('✅ Role created with permissions:', role);

        // Проверим, что права сохранились
        const savedRole = await prisma.role.findUnique({
            where: { id: role.id },
        });

        console.log('✅ Saved permissions:', savedRole.permissions);

        // Удалим тестовую роль
        await prisma.role.delete({
            where: { id: role.id },
        });

        console.log('✅ Test role deleted');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

testSavePermissions();