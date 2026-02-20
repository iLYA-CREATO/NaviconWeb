const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');
const prisma = require('../prisma/client');

// Создание Express приложения для тестирования
const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        password: 'testpass123',
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.user.email).toBe(userData.email);
    });

    it('should return error for duplicate username', async () => {
      // Сначала создаем пользователя
      await prisma.user.create({
        data: {
          username: 'existinguser',
          password: 'hashedpass',
          email: 'existing@example.com'
        }
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'existinguser',
          password: 'testpass123',
          email: 'different@example.com'
        })
        .expect(400);

      expect(response.body.message).toBe('Имя пользователя уже существует');
    });

    it('should return error for duplicate email', async () => {
      // Сначала создаем пользователя
      await prisma.user.create({
        data: {
          username: 'user1',
          password: 'hashedpass',
          email: 'same@example.com'
        }
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'user2',
          password: 'testpass123',
          email: 'same@example.com'
        })
        .expect(400);

      expect(response.body.message).toBe('Email уже существует');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Создание тестового пользователя
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('testpass123', 10);

      await prisma.user.create({
        data: {
          username: 'testuser',
          password: hashedPassword,
          email: 'test@example.com'
        }
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user.username).toBe('testuser');
    });

    it('should return error for invalid username', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'nonexistent',
          password: 'testpass123'
        })
        .expect(400);

      expect(response.body.message).toBe('Неверные учетные данные');
    });

    it('should return error for invalid password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpass'
        })
        .expect(400);

      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('GET /auth/me', () => {
    let token;
    let user;

    beforeEach(async () => {
      // Создание тестового пользователя and get token
      const bcrypt = require('bcryptjs');
      const jwt = require('jsonwebtoken');

      const hashedPassword = await bcrypt.hash('testpass123', 10);
      user = await prisma.user.create({
        data: {
          username: 'testuser',
          password: hashedPassword,
          email: 'test@example.com'
        }
      });

      token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );
    });

    it('should return user data with valid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.user.id).toBe(user.id);
      expect(response.body.user.username).toBe(user.username);
    });

    it('should return error without token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .expect(401);

      expect(response.body.message).toBe('No token provided');
    });

    it('should return error with invalid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(500);
    });
  });
});