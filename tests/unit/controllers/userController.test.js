const userController = require('../../../server/controllers/userController');
const User = require('../../../server/models/User');

jest.mock('../../../server/models/User');

describe('User Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('getUser', () => {
    it('should get a user by id', async () => {
      const mockUser = {
        id: 1,
        nombre: 'Test User',
        correoInstitucional: 'test@duoc.cl',
        numeroPatente: 'ABC123',
        numeroTelefono: '123456789'
      };
      User.findById = jest.fn().mockResolvedValue(mockUser);

      req.params.id = '1';

      await userController.getUser(req, res);

      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 404 if user not found', async () => {
      User.findById = jest.fn().mockResolvedValue(null);

      req.params.id = '999';

      await userController.getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const mockUpdatedUser = {
        id: 1,
        nombre: 'Updated User',
        numeroTelefono: '987654321'
      };
      User.update = jest.fn().mockResolvedValue(mockUpdatedUser);

      req.params.id = '1';
      req.body = {
        nombre: 'Updated User',
        numeroTelefono: '987654321'
      };

      await userController.updateUser(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Usuario actualizado',
        user: mockUpdatedUser
      }));
    });
  });

  // Aquí irían más pruebas para otros métodos del controlador
});