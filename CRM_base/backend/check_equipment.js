const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEquipment() {
  try {
    const items = await prisma.equipmentItem.findMany({
      include: {
        equipment: true,
        client: true
      }
    });
    console.log('Total EquipmentItems:', items.length);
    items.forEach(item => {
      console.log(`Item ID: ${item.id}, Equipment: ${item.equipment?.name}, Client: ${item.client?.name}, ClientID: ${item.clientId}`);
    });

    const clients = await prisma.client.findMany({
      include: {
        equipmentItems: {
          include: {
            equipment: true
          }
        }
      }
    });
    console.log('\nClients with equipment:');
    clients.forEach(client => {
      console.log(`Client: ${client.name}, Equipment count: ${client.equipmentItems.length}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEquipment();