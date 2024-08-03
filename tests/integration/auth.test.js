const request = require('supertest');
const app = require('../../server/server');
const db = require('../../server/config/database');

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    await global.setupTestDatabase();
  });

  afterEach(async () => {
    await global.clearTestDatabase();
  });

  afterAll(async () => {
    await db.close();
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Test User',
        correoInstitucional: 'test@duoc.cl',
        contraseña: 'password123',
        numeroPatente: 'ABC123',
        numeroTelefono: '123456789'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Usuario registrado exitosamente');
  });

  it('should login a user', async () => {
    // First, register a user
    await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Test User',
        correoInstitucional: 'test@duoc.cl',
        contraseña: 'password123',
        numeroPatente: 'ABC123',
        numeroTelefono: '123456789'
      });

    // Then, try to login
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        correoInstitucional: 'test@duoc.cl',
        contraseña: 'password123'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });
});