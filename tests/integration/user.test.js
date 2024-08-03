const User = require('../../../server/models/User');
const db = require('../../../server/config/database');

describe('User Model', () => {
  beforeAll(async () => {
    await global.setupTestDatabase();
  });

  afterEach(async () => {
    await global.clearTestDatabase();
  });

  afterAll(async () => {
    await db.close();
  });

  it('should create a new user', async () => {
    const userData = {
      nombre: 'Test User',
      correoInstitucional: 'test@duoc.cl',
      contraseña: 'hashedPassword',
      numeroPatente: 'ABC123',
      numeroTelefono: '123456789'
    };

    const userId = await User.create(userData);
    expect(userId).toBeDefined();

    const user = await User.findByEmail('test@duoc.cl');
    expect(user).toBeDefined();
    expect(user.nombre).toBe('Test User');
  });

  it('should find a user by email', async () => {
    const userData = {
      nombre: 'Test User',
      correoInstitucional: 'test@duoc.cl',
      contraseña: 'hashedPassword',
      numeroPatente: 'ABC123',
      numeroTelefono: '123456789'
    };

    await User.create(userData);

    const user = await User.findByEmail('test@duoc.cl');
    expect(user).toBeDefined();
    expect(user.correoInstitucional).toBe('test@duoc.cl');
  });

  it('should update user password', async () => {
    const userData = {
      nombre: 'Test User',
      correoInstitucional: 'test@duoc.cl',
      contraseña: 'oldPassword',
      numeroPatente: 'ABC123',
      numeroTelefono: '123456789'
    };

    await User.create(userData);

    const newPassword = 'newPassword';
    await User.updatePassword('test@duoc.cl', newPassword);

    const updatedUser = await User.findByEmail('test@duoc.cl');
    expect(updatedUser.contraseña).toBe(newPassword);
  });
});