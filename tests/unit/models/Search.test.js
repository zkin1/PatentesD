const Search = require('../../../server/models/Search');
const User = require('../../../server/models/User');
const db = require('../../../server/config/database');

describe('Search Model', () => {
  beforeAll(async () => {
    await global.setupTestDatabase();
  });

  afterEach(async () => {
    await global.clearTestDatabase();
  });

  afterAll(async () => {
    await db.close();
  });

  it('should create a new search record', async () => {
    const searchData = {
      correoUsuario: 'test@duoc.cl',
      numeroPatente: 'ABC123'
    };

    const searchId = await Search.create(searchData);
    expect(searchId).toBeDefined();
  });

  it('should find a user by patente', async () => {
    const userData = {
      nombre: 'Test User',
      correoInstitucional: 'test@duoc.cl',
      contraseña: 'hashedPassword',
      numeroPatente: 'ABC123',
      numeroTelefono: '123456789'
    };

    await User.create(userData);

    const user = await Search.findByPatente('ABC123');
    expect(user).toBeDefined();
    expect(user.numeroPatente).toBe('ABC123');
    expect(user.nombre).toBe('Test User');
  });
});