const request = require('supertest');
const app = require('../../server/server');
const db = require('../../server/config/database');

describe('Search Endpoints', () => {
  let authToken;

  beforeAll(async () => {
    await global.setupTestDatabase();
    // Registrar y loguear un usuario para obtener el token
    await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Test User',
        correoInstitucional: 'test@duoc.cl',
        contraseña: 'password123',
        numeroPatente: 'ABC123',
        numeroTelefono: '123456789'
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        correoInstitucional: 'test@duoc.cl',
        contraseña: 'password123'
      });

    authToken = loginRes.body.token;
  });

  afterEach(async () => {
    await global.clearTestDatabase();
  });

  afterAll(async () => {
    await db.close();
  });

  it('should search for a user by patente', async () => {
    const res = await request(app)
      .get('/api/search/patente/ABC123')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('nombre', 'Test User');
    expect(res.body).toHaveProperty('numeroPatente', 'ABC123');
  });

  it('should register a search', async () => {
    const res = await request(app)
      .post('/api/search/register')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        correoUsuario: 'test@duoc.cl',
        numeroPatente: 'ABC123'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
  });

  it('should verify if a patente exists', async () => {
    const res = await request(app)
      .get('/api/search/verify/ABC123');

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('existe', true);
  });
});