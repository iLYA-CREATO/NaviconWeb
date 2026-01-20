const request = require('supertest');
const express = require('express');
const bidsRoutes = require('../routes/bids');
const prisma = require('../prisma/client');

// Создание Express приложения для тестирования
const app = express();
app.use(express.json());
app.use('/bids', bidsRoutes);

describe('Bids Routes', () => {
  let authToken;
  let testUser;
  let testClient;
  let testClientObject;

  beforeEach(async () => {
    // Создание тестового пользователя
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');

    const hashedPassword = await bcrypt.hash('testpass123', 10);
    testUser = await prisma.user.create({
      data: {
        username: 'testuser',
        password: hashedPassword,
        email: 'test@example.com'
      }
    });

    // Создание тестового клиента
    testClient = await prisma.client.create({
      data: {
        name: 'Test Client',
        email: 'client@example.com',
        phone: '+1234567890',
        responsibleId: testUser.id
      }
    });

    // Создание тестового клиента object
    testClientObject = await prisma.clientObject.create({
      data: {
        clientId: testClient.id,
        brandModel: 'Test Car Model',
        stateNumber: 'ABC123',
        equipment: 'Test Equipment'
      }
    });

    // Генерация токена аутентификации
    authToken = jwt.sign(
      { id: testUser.id, username: testUser.username },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );
  });

  describe('GET /bids', () => {
    it('should return empty array when no bids exist', async () => {
      const response = await request(app)
        .get('/bids')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should return bids with proper formatting', async () => {
      // Создание тестовой заявки
      const bid = await prisma.bid.create({
        data: {
          clientId: testClient.id,
          tema: 'Test Bid',
          amount: 1000.50,
          status: 'Pending',
          description: 'Test description',
          clientObjectId: testClientObject.id,
          createdBy: testUser.id
        }
      });

      const response = await request(app)
        .get('/bids')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('id', bid.id);
      expect(response.body[0]).toHaveProperty('clientName', testClient.name);
      expect(response.body[0]).toHaveProperty('title', bid.tema);
      expect(response.body[0]).toHaveProperty('amount', 1000.5);
      expect(response.body[0]).toHaveProperty('status', bid.status);
      expect(response.body[0]).toHaveProperty('clientObject');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/bids')
        .expect(401);
    });
  });

  describe('GET /bids/:id', () => {
    it('should return bid details by id', async () => {
      const bid = await prisma.bid.create({
        data: {
          clientId: testClient.id,
          tema: 'Test Bid Details',
          amount: 2000.00,
          status: 'In Progress',
          description: 'Detailed test description',
          clientObjectId: testClientObject.id,
          createdBy: testUser.id
        }
      });

      const response = await request(app)
        .get(`/bids/${bid.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', bid.id);
      expect(response.body).toHaveProperty('client');
      expect(response.body).toHaveProperty('clientObject');
      expect(response.body).toHaveProperty('creator');
      expect(response.body).toHaveProperty('title', bid.tema);
      expect(response.body).toHaveProperty('amount', 2000);
    });

    it('should return 404 for non-existent bid', async () => {
      const response = await request(app)
        .get('/bids/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe('Bid not found');
    });
  });

  describe('POST /bids', () => {
    it('should create a new bid successfully', async () => {
      const bidData = {
        clientId: testClient.id,
        title: 'New Test Bid',
        amount: 1500.75,
        status: 'Pending',
        description: 'New bid description',
        clientObjectId: testClientObject.id
      };

      const response = await request(app)
        .post('/bids')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bidData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('clientName', testClient.name);
      expect(response.body).toHaveProperty('title', bidData.title);
      expect(response.body).toHaveProperty('amount', 1500.75);
    });

    it('should return error for non-existent client', async () => {
      const bidData = {
        clientId: 99999,
        title: 'Invalid Bid',
        amount: 1000
      };

      const response = await request(app)
        .post('/bids')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bidData)
        .expect(404);

      expect(response.body.message).toBe('Client not found');
    });

    it('should create bid without client object', async () => {
      const bidData = {
        clientId: testClient.id,
        title: 'Bid Without Object',
        amount: 500.00,
        status: 'Pending'
      };

      const response = await request(app)
        .post('/bids')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bidData)
        .expect(201);

      expect(response.body.title).toBe(bidData.title);
      expect(response.body.clientObjectId).toBeNull();
    });
  });

  describe('PUT /bids/:id', () => {
    let existingBid;

    beforeEach(async () => {
      existingBid = await prisma.bid.create({
        data: {
          clientId: testClient.id,
          tema: 'Existing Bid',
          amount: 1000.00,
          status: 'Pending',
          createdBy: testUser.id
        }
      });
    });

    it('should update bid successfully', async () => {
      const updateData = {
        title: 'Updated Bid Title',
        amount: 2000.00,
        status: 'Completed',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/bids/${existingBid.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.amount).toBe(2000);
      expect(response.body.status).toBe(updateData.status);
    });

    it('should return 404 for non-existent bid', async () => {
      const response = await request(app)
        .put('/bids/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /bids/:id', () => {
    it('should delete bid successfully', async () => {
      const bid = await prisma.bid.create({
        data: {
          clientId: testClient.id,
          tema: 'Bid to Delete',
          amount: 500.00,
          createdBy: testUser.id
        }
      });

      const response = await request(app)
        .delete(`/bids/${bid.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Bid deleted');
      expect(response.body.bid).toHaveProperty('id', bid.id);

      // Проверка, что заявка удалена
      const deletedBid = await prisma.bid.findUnique({
        where: { id: bid.id }
      });
      expect(deletedBid).toBeNull();
    });

    it('should return 404 for non-existent bid', async () => {
      const response = await request(app)
        .delete('/bids/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});