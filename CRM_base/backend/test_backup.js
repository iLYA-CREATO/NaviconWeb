// Simple test script for backup functionality
const axios = require('axios');

async function testBackup() {
    try {
        console.log('Testing backup creation...');

        // First, login to get token
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'Sergei',
            password: '123'
        });

        const token = loginResponse.data.token;
        console.log('Logged in successfully');

        // Create backup
        const backupResponse = await axios.post('http://localhost:5000/api/backups/create', {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Backup created:', backupResponse.data);

        // List backups
        const listResponse = await axios.get('http://localhost:5000/api/backups/list', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Backups list:', listResponse.data);

    } catch (error) {
        console.error('Test failed:', error.response?.data || error.message);
    }
}

testBackup();