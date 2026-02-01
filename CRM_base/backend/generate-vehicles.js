const prisma = require('./prisma/client');

// Tambov Oblast region codes (68 is the main code for Tambov)
const tambovRegions = ['68'];

// Russian license plate letters
const plateLetters = ['А', 'В', 'Е', 'К', 'М', 'Н', 'О', 'Р', 'С', 'Т', 'У', 'Х'];

// Vehicle brands/models commonly used in Tambov region
const vehicleBrands = [
    // Cars
    { brand: 'Toyota', models: ['Camry', 'Corolla', 'RAV4', 'Land Cruiser'] },
    { brand: 'Hyundai', models: ['Solaris', 'Creta', 'Elantra', ' Tucson'] },
    { brand: 'Kia', models: ['Rio', 'Sportage', 'Ceed', 'Optima'] },
    { brand: 'Volkswagen', models: ['Polo', 'Tiguan', 'Passat', 'Jetta'] },
    { brand: 'Skoda', models: ['Rapid', 'Octavia', 'Kodiaq', 'Karoq'] },
    { brand: 'Ford', models: ['Focus', 'Kuga', 'Mondeo', 'Explorer'] },
    { brand: 'Nissan', models: ['Almera', 'Qashqai', 'X-Trail', 'Terrano'] },
    { brand: 'Renault', models: ['Logan', 'Duster', 'Kaptur', 'Sandero'] },
    { brand: 'Chevrolet', models: ['Cruze', 'Cobalt', 'Tracker', 'Tahoe'] },
    { brand: 'Opel', models: ['Astra', 'Mokka', 'Crossland', 'Grandland'] },
    { brand: 'BMW', models: ['3 серии', '5 серии', 'X3', 'X5'] },
    { brand: 'Mercedes', models: ['C класс', 'E класс', 'GLC', 'GLE'] },
    { brand: 'Lada (ВАЗ)', models: ['Granta', 'Vesta', 'XRAY', 'Niva'] },
    { brand: 'ГАЗ', models: ['Газель', 'Соболь', 'Бизнес', 'NEXT'] },
    { brand: 'УАЗ', models: ['Патриот', 'Хантер', 'Буханка', 'Пикап'] },
    // Trucks
    { brand: 'КамАЗ', models: ['43118', '5511', '5490', '43253'] },
    { brand: 'МАЗ', models: ['5551', '6312', '6501', '5360'] },
    { brand: 'ГАЗ', models: ['3307', '3309', '66', '53'] },
    // Special equipment
    { brand: 'Komatsu', models: ['PC200', 'PC300', 'D61', 'WA380'] },
    { brand: 'Caterpillar', models: ['320', '950', '140M', 'D6'] },
    { brand: 'Hitachi', models: ['ZX200', 'ZX240', 'EX200', 'ZAXIS'] },
    { brand: 'JCB', models: ['3CX', '4CX', 'JS130', 'JS205'] },
    { brand: 'Bobcat', models: ['S570', 'S650', 'T590', 'A770'] },
];

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateStateNumber() {
    // Russian license plate format: А000АА 68RUS or А000АА 168RUS
    const letter1 = randomElement(plateLetters);
    const number = randomInt(1, 999);
    const numberStr = number.toString().padStart(3, '0');
    const letter2 = randomElement(plateLetters);
    const letter3 = randomElement(plateLetters);
    const region = randomElement(tambovRegions);
    return `${letter1}${numberStr}${letter2}${letter3} ${region}`;
}

function generateVehicleBrandModel() {
    const brandData = randomElement(vehicleBrands);
    const model = randomElement(brandData.models);
    return `${brandData.brand} ${model}`;
}

async function generateVehicles(count) {
    console.log(`Generating ${count} vehicles...\n`);
    
    try {
        // Get all clients from database
        const clients = await prisma.client.findMany({
            select: {
                id: true,
                name: true
            }
        });
        
        if (clients.length === 0) {
            console.log('No clients found in database. Please create clients first.');
            process.exit(1);
        }
        
        console.log(`Found ${clients.length} clients in database`);
        
        let created = 0;
        let errors = [];
        
        for (let i = 0; i < count; i++) {
            // Select random client
            const randomClient = randomElement(clients);
            
            // Generate vehicle data
            const brandModel = generateVehicleBrandModel();
            const stateNumber = generateStateNumber();
            const region = randomElement(tambovRegions);
            const distance = randomInt(1, 400); // Distance up to 400 km
            
            try {
                await prisma.clientObject.create({
                    data: {
                        clientId: randomClient.id,
                        brandModel: brandModel,
                        stateNumber: stateNumber,
                        region: region,
                        distance: distance
                    }
                });
                created++;
                console.log(`OK ${i + 1}/${count}: ${brandModel} (${stateNumber}) - ${randomClient.name} (${distance} км)`);
            } catch (error) {
                errors.push(`${brandModel}: ${error.message}`);
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
        console.log('Usage: node generate-vehicles.js --count=10');
        process.exit(1);
    }
    
    try {
        await prisma.$connect();
        await generateVehicles(count);
    } catch (error) {
        console.error('Database error: ' + error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
