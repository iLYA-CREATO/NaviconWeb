require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testLoadPermissions() {
    const prisma = new PrismaClient();

    try {
        console.log('Testing permissions load...');

        // Создадим тестовую роль с правами
        const testPermissions = {
            user_create: true,
            user_edit: true,
            user_delete: false,
            role_create: false,
            role_edit: false,
            role_delete: false,
            spec_category_create: true,
            spec_category_edit: false,
            spec_category_delete: false,
            spec_create: true,
            spec_edit: true,
            spec_delete: false,
            bid_type_create: false,
            bid_type_edit: false,
            bid_type_delete: false,
            client_create: true,
            client_edit: false,
            client_delete: false,
            bid_create: true,
            bid_edit: true,
            bid_delete: true,
            bid_equipment_add: false,
            tab_warehouse: true,
            tab_salary: true,
        };

        const role = await prisma.role.create({
            data: {
                name: 'Тестовая роль для загрузки',
                description: 'Роль для тестирования загрузки прав',
                permissions: testPermissions,
            },
        });

        console.log('✅ Role created with ID:', role.id);

        // Загрузим роль и проверим права
        const loadedRole = await prisma.role.findUnique({
            where: { id: role.id },
        });

        console.log('✅ Loaded permissions:', loadedRole.permissions);

        // Проверим, что права совпадают
        const permissionsMatch = JSON.stringify(testPermissions) === JSON.stringify(loadedRole.permissions);
        console.log('✅ Permissions match:', permissionsMatch);

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

testLoadPermissions();