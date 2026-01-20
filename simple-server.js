const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/roles', (req, res) => {
    // Тестовые данные
    const roles = [
        { id: 1, name: 'Админ', description: 'Администратор' },
        { id: 2, name: 'Менеджер', description: 'Менеджер' },
        { id: 3, name: 'Пользователь', description: 'Пользователь' }
    ];
    res.json(roles);
});

app.listen(5000, () => {
    console.log('Simple test server running on port 5000');
});