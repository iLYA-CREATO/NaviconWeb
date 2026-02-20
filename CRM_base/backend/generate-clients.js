const prisma = require('./prisma/client');

const firstNames = [
    'Александр', 'Алексей', 'Андрей', 'Антон', 'Артем', 'Борис', 'Вадим', 'Валерий',
    'Виктор', 'Владимир', 'Дмитрий', 'Евгений', 'Иван', 'Игорь', 'Константин',
    'Максим', 'Михаил', 'Николай', 'Олег', 'Павел', 'Петр', 'Сергей', 'Станислав', 'Юрий'
];

const lastNames = [
    'Иванов', 'Петров', 'Сидоров', 'Смирнов', 'Кузнецов', 'Попов', 'Соколов', 'Лебедев',
    'Козлов', 'Новиков', 'Морозов', 'Волков', 'Соловьев', 'Васильев', 'Зайцев', 'Павлов',
    'Семенов', 'Голубев', 'Виноградов', 'Богданов', 'Воробьев', 'Федоров', 'Михайлов',
    'Белоусов', 'Фомин', 'Давыдов', 'Матвеев', 'Титов', 'Марков', 'Кудрявцев'
];

const companySuffixes = ['ООО', 'ЗАО', 'ОАО', 'ИП', 'АО'];

const industryTypes = [
    'ТехноСтрой', 'ПромИнжиниринг', 'ТоргПлюс', 'СтройМастер', 'ЭнергоСервис',
    'ТелекомПро', 'ЛогистикЦентр', 'АгроПром', 'МеталлГрупп', 'СофтДевелопмент',
    'АвтоСервис', 'ГрузПеревозки', 'КлиматКонтроль', 'СанТехМонтаж', 'ЭлектроСеть',
    'КровляФасад', 'ОкнаДвери', 'РемонтСтрой', 'ЛандшафтДизайн', 'КлинингСервис'
];

const emailDomains = ['mail.ru', 'yandex.ru', 'gmail.com', 'rambler.ru', 'bk.ru'];

const responsibleNames = [
    'Кречетова Ольга',
    'Горбунова Анастасия',
    'Василенко Вадим',
    'Стариков Вадим',
    'Баранов Олег',
    'Кирилов Владислав'
];

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

function generateEmail(name, index) {
    var cleanName = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
    return cleanName + index + '@' + randomElement(emailDomains);
}

function generateCompanyName() {
    var industry = randomElement(industryTypes);
    var suffix = randomElement(companySuffixes);
    var number = randomInt(1, 999);
    return industry + ' ' + suffix + ' "' + number + '"';
}

function generatePersonName() {
    var firstName = randomElement(firstNames);
    var lastName = randomElement(lastNames);
    var isMale = Math.random() > 0.5;
    var patronymic = firstName + (isMale ? 'ович' : 'овна');
    return lastName + ' ' + firstName + ' ' + patronymic;
}

async function generateClients(count, responsibleUsers) {
    console.log('Generation ' + count + ' clients...\n');
    
    var created = 0;
    var errors = [];
    
    for (var i = 0; i < count; i++) {
        var isCompany = Math.random() > 0.4;
        var name = isCompany ? generateCompanyName() : generatePersonName();
        var email = generateEmail(name, i + 1);
        var phone = generatePhone();
        
        var data = {
            name: name,
            email: email,
            phone: phone,
            createdAt: new Date(Date.now() - randomInt(0, 365 * 24 * 60 * 60 * 1000))
        };
        
        if (responsibleUsers && responsibleUsers.length > 0) {
            var randomUser = randomElement(responsibleUsers);
            data.responsibleId = randomUser.id;
        }
        
        try {
            await prisma.client.create({
                data: data
            });
            created++;
            console.log('OK ' + (i + 1) + '/' + count + ': ' + name + 
                       (data.responsibleId ? ' (ответственный: ' + randomUser.fullName + ')' : ''));
        } catch (error) {
            errors.push(name + ': ' + error.message);
            console.log('ERROR ' + (i + 1) + ': ' + error.message);
        }
    }
    
    console.log('\n--- Result ---');
    console.log('Created: ' + created);
    console.log('Errors: ' + errors.length);
    
    if (errors.length > 0) {
        console.log('\nError details:');
        for (var j = 0; j < errors.length; j++) {
            console.log('  - ' + errors[j]);
        }
    }
}

async function main() {
    var count = null;
    
    for (var i = 0; i < process.argv.length; i++) {
        if (process.argv[i].indexOf('--count=') === 0) {
            count = parseInt(process.argv[i].split('=')[1], 10);
        }
    }
    
    if (count === null || isNaN(count) || count < 1) {
        console.log('Usage: node generate-clients.js --count=10');
        process.exit(1);
    }
    
    try {
        await prisma.$connect();
        
        console.log('Loading responsible users...');
        var responsibleUsers = await prisma.user.findMany({
            where: {
                fullName: {
                    in: responsibleNames
                }
            },
            select: {
                id: true,
                fullName: true
            }
        });
        
        console.log('Found ' + responsibleUsers.length + ' responsible users');
        
        await generateClients(count, responsibleUsers);
    } catch (error) {
        console.error('Database error: ' + error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
