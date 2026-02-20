const prisma = require('./prisma/client');

const applicationThemes = [
    'Выдача оборудования',
    'Настройка оборудования',
    'Установка тахографа',
    'Установка ДУТ',
    'Установка терминала',
    'Монтаж проводки',
    'Замена оборудования',
    'Профилактика техники',
    'Ремонт электрооборудования',
    'Наладка системы',
    'Обслуживание серверов',
    'Установка ПО',
    'Обновление прошивки',
    'Калибровка датчиков',
    'Монтаж системы видеонаблюдения',
    'Установка СКУД',
    'Настройка сети',
    'Подключение к интернету',
    'Установка пожарной сигнализации',
    'Монтаж охранной системы',
    'Настройка офисной техники',
    'Установка кондиционера',
    'Монтаж вентиляции',
    'Ремонт оргтехники',
    'Заправка картриджей',
    'Установка мебели',
    'Сборка оборудования',
    'Настройка телефонии',
    'Установка АТС',
    'Монтаж ЛВС',
    'Прокладка кабеля',
    'Установка розеток',
    'Ремонт электрики',
    'Настройка маршрутизатора',
    'Установка принтера',
    'Настройка сканера',
    'Монтаж солнечных панелей',
    'Установка стабилизатора',
    'Настройка системы отопления',
    'Монтаж теплого пола',
    'Установка водонагревателя',
    'Ремонт сантехники',
    'Настройка умного дома',
    'Установка домофона',
    'Монтаж навесного оборудования',
    'Настройка промышленного оборудования',
    'Установка станка',
    'Ремонт производственной линии',
    'Наладка конвейера',
    'Монтаж освещения',
    'Установка вывески',
    'Настройка кассового аппарата',
    'Установка банкомата',
    'Монтаж рекламной конструкции',
    'Ремонт фасада',
    'Настройка системы вентиляции',
    'Установка фильтров',
    'Монтаж трубопровода',
    'Настройка компрессора',
    'Установка генератора',
    'Ремонт двигателя',
    'Наладка насосного оборудования',
    'Монтаж резервуара',
    'Установка антенны',
    'Настройка спутникового оборудования',
    'Монтаж заземления',
    'Установка молниезащиты',
    'Ремонт кровли',
    'Настройка системы полива',
    'Установка ирригационной системы',
    'Монтаж ограждения',
    'Наладка ворот',
    'Установка шлагбаума',
    'Ремонт подъемника',
    'Настройка лифта',
    'Монтаж эскалатора',
    'Установка турникета',
    'Наладка системы оповещения',
    'Монтаж звукового оборудования',
    'Установка проектора',
    'Настройка интерактивной доски',
    'Ремонт музыкальной аппаратуры',
    'Наладка светового оборудования',
    'Монтаж сцены',
    'Установка спортивного инвентаря',
    'Настройка тренажеров',
    'Монтаж бассейна',
    'Установка сауны',
    'Ремонт джакузи',
    'Наладка котельной',
    'Монтаж газового оборудования',
    'Установка счетчиков',
    'Настройка приборов учета',
    'Монтаж системы кондиционирования',
    'Установка чиллера',
    'Ремонт фанкойла',
    'Наладка вентиляционной установки',
    'Монтаж воздуховодов',
    'Установка рекуператора'
];

// Street types for work addresses
const streetTypes = ['ул', 'пр-т', 'пер', 'шоссе', 'бульвар', 'наб', 'пр-д'];

// Streets in Tambov region
const streets = [
    'Ленина', 'Советская', 'Первомайская', 'Московская', 'Калинина',
    'Мичурина', 'Пушкина', 'Горького', 'К Маркса', 'Энгельса',
    'Крупской', 'Октябрьская', 'Дзержинского', 'Чайковского', 'Строителей',
    'Победы', 'Репина', 'Ломоносова', 'Гагарина', 'Чехова',
    'Тургенева', 'Некрасова', 'Фрунзе', 'Володарского', 'Кирова'
];

// Default statuses (will be overridden by bid type statuses if available)
const defaultBidStatuses = ['Открыта', 'Тестовый', 'Закрыта'];

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generatePhone() {
    return '+7 (9' + randomInt(0, 9) + randomInt(0, 9) + ') ' + 
           randomInt(100, 999) + '-' + randomInt(10, 99) + '-' + randomInt(10, 99);
}

function generateFullName() {
    const firstNames = ['Александр', 'Алексей', 'Андрей', 'Антон', 'Артем', 'Борис', 'Вадим', 'Валерий', 'Виктор', 'Владимир', 'Дмитрий', 'Евгений', 'Иван', 'Игорь', 'Константин', 'Максим', 'Михаил', 'Николай', 'Олег', 'Павел', 'Петр', 'Сергей', 'Станислав', 'Юрий'];
    const lastNames = ['Иванов', 'Петров', 'Сидоров', 'Смирнов', 'Кузнецов', 'Попов', 'Соколов', 'Лебедев', 'Козлов', 'Новиков', 'Морозов', 'Волков', 'Соловьев', 'Васильев', 'Зайцев', 'Павлов', 'Семенов', 'Голубев', 'Виноградов', 'Богданов'];
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const patronymic = firstName + 'ович';
    return `${lastName} ${firstName} ${patronymic}`;
}

function generateWorkAddress() {
    const streetType = randomElement(streetTypes);
    const street = randomElement(streets);
    const house = randomInt(1, 200);
    const building = randomInt(0, 5) > 0 ? '' : `к${randomInt(1, 5)}`;
    const office = randomInt(0, 10) > 5 ? ` оф.${randomInt(1, 50)}` : '';
    return `г. Тамбов, ${streetType} ${street}, д.${house}${building}${office}`;
}

function generateDescription(theme) {
    const descriptions = [
        `Требуется ${theme.toLowerCase()} в соответствии с техническим заданием.`,
        `Необходимо выполнить работы по ${theme.toLowerCase()} на объекте заказчика.`,
        `Заявка на ${theme.toLowerCase()}. Срочность - высокая.`,
        `Прошу организовать ${theme.toLowerCase()} в удобное для вас время.`,
        `Требуется квалифицированная помощь по ${theme.toLowerCase()}.`,
        `${theme}. Работы должны быть выполнены качественно и в срок.`,
        `Обращение по поводу ${theme.toLowerCase()}. Прошу перезвонить для уточнения деталей.`,
        `Нужна консультация и помощь по ${theme.toLowerCase()}.`,
    ];
    return randomElement(descriptions);
}

function generateContractNumber() {
    return `№${randomInt(100, 999)}/2025`;
}

function generateUpdNumber() {
    return `УПД-${randomInt(10000, 99999)}`;
}

async function generateBids(count) {
    console.log(`Generating ${count} bids...\n`);
    
    try {
        // Get all clients
        const clients = await prisma.client.findMany({
            select: { id: true, name: true }
        });
        
        if (clients.length === 0) {
            console.log('No clients found in database. Please create clients first.');
            process.exit(1);
        }
        
        // Get all client objects (vehicles)
        const clientObjects = await prisma.clientObject.findMany({
            select: { id: true, clientId: true, brandModel: true, stateNumber: true }
        });
        
        // Get all bid types with their statuses
        const bidTypes = await prisma.bidType.findMany({
            select: { id: true, name: true, statuses: true }
        });
        
        // Get all users (creators)
        const users = await prisma.user.findMany({
            select: { id: true, fullName: true }
        });
        
        console.log(`Found ${clients.length} clients, ${clientObjects.length} vehicles, ${bidTypes.length} bid types, ${users.length} users`);
        
        if (bidTypes.length === 0) {
            console.log('No bid types found. Creating a default bid type...');
            const defaultBidType = await prisma.bidType.create({
                data: {
                    name: 'Стандартная заявка',
                    description: 'Стандартный тип заявки для всех видов работ',
                    statuses: [
                        { name: 'Открыта', color: '#22c55e', order: 1 },
                        { name: 'В работе', color: '#3b82f6', order: 2 },
                        { name: 'Выполнена', color: '#10b981', order: 3 },
                        { name: 'Отменена', color: '#ef4444', order: 4 },
                        { name: 'Приостановлена', color: '#f59e0b', order: 5 }
                    ],
                    transitions: {
                        'Открыта': ['В работе', 'Отменена'],
                        'В работе': ['Выполнена', 'Приостановлена', 'Отменена'],
                        'Приостановлена': ['В работе', 'Отменена']
                    }
                }
            });
            bidTypes.push({ id: defaultBidType.id, name: defaultBidType.name, statuses: defaultBidType.statuses });
            console.log(`Created default bid type: ${defaultBidType.name}`);
        }
        
        if (users.length === 0) {
            console.log('No users found. Please create users first.');
            process.exit(1);
        }
        
        // Helper function to get valid statuses for a bid type
        const getStatusNames = (bidType) => {
            if (bidType.statuses && Array.isArray(bidType.statuses)) {
                const names = bidType.statuses.map(s => s.name).filter(Boolean);
                if (names.length > 0) return names;
            }
            return defaultBidStatuses;
        };
        
        let created = 0;
        let errors = [];
        
        for (let i = 0; i < count; i++) {
            const randomClient = randomElement(clients);
            const randomClientObject = clientObjects.length > 0 ? 
                clientObjects.filter(co => co.clientId === randomClient.id) : [];
            const selectedClientObject = randomClientObject.length > 0 ? 
                randomElement(randomClientObject) : null;
            const randomBidType = randomElement(bidTypes);
            const randomUser = randomElement(users);
            
            // Get valid statuses for this bid type
            const validStatuses = getStatusNames(randomBidType);
            
            const tema = randomElement(applicationThemes);
            const status = randomElement(validStatuses);
            const amount = parseFloat((Math.random() * 50000 + 1000).toFixed(2));
            const description = generateDescription(tema);
            const contactFullName = generateFullName();
            const contactPhone = generatePhone();
            const workAddress = generateWorkAddress();
            const contract = generateContractNumber();
            const updNumber = generateUpdNumber();
            const plannedDurationHours = randomInt(1, 24);
            const plannedReactionTimeMinutes = randomInt(30, 480);
            
            // Random dates
            const createdAt = new Date(Date.now() - randomInt(0, 90 * 24 * 60 * 60 * 1000)); // Last 90 days
            const plannedResolutionDate = new Date(createdAt.getTime() + randomInt(1, 14) * 24 * 60 * 60 * 1000);
            const updDate = new Date(createdAt.getTime() + randomInt(0, 5) * 24 * 60 * 60 * 1000);
            
            try {
                const newBid = await prisma.bid.create({
                    data: {
                        clientId: randomClient.id,
                        bidTypeId: randomBidType.id,
                        tema: tema,
                        amount: amount,
                        status: status,
                        description: description,
                        clientObjectId: selectedClientObject ? selectedClientObject.id : null,
                        createdBy: randomUser.id,
                        contactFullName: contactFullName,
                        contactPhone: contactPhone,
                        workAddress: workAddress,
                        contract: contract,
                        updNumber: updNumber,
                        updDate: updDate,
                        plannedResolutionDate: plannedResolutionDate,
                        plannedReactionTimeMinutes: plannedReactionTimeMinutes,
                        plannedDurationHours: plannedDurationHours,
                        createdAt: createdAt,
                        updatedAt: new Date()
                    }
                });
                created++;
                console.log(`OK ${i + 1}/${count}: ${tema.substring(0, 40)}... - ${randomClient.name} (${status})`);
            } catch (error) {
                errors.push(`${tema}: ${error.message}`);
                console.log(`ERROR ${i + 1}: ${error.message}`);
            }
        }
        
        console.log('\n--- Result ---');
        console.log(`Created: ${created}`);
        console.log(`Errors: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log('\nError details:');
            errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        }
    } catch (error) {
        console.error('Database error: ' + error.message);
        process.exit(1);
    }
}

async function main() {
    let count = null;
    
    for (let i = 0; i < process.argv.length; i++) {
        if (process.argv[i].indexOf('--count=') === 0) {
            count = parseInt(process.argv[i].split('=')[1], 10);
        }
    }
    
    if (count === null || isNaN(count) || count < 1) {
        console.log('Usage: node generate-bids.js --count=10');
        process.exit(1);
    }
    
    try {
        await prisma.$connect();
        await generateBids(count);
    } catch (error) {
        console.error('Database error: ' + error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
