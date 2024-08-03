const authController = require('../../../server/controllers/authController');
const User = require('../../../server/models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('../../../server/models/User');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('login', () => {
    it('should login a user successfully', async () => {
      const user = {
        id: 1,
        correoInstitucional: 'test@duoc.cl',
        contraseña: 'hashedPassword'
      };
      User.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('token');

      req.body = {
        correoInstitucional: 'test@duoc.cl',
        contraseña: 'password'
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        token: 'token'
      }));
    });

    it('should return error for invalid credentials', async () => {
      User.findByEmail.mockResolvedValue(null);

      req.body = {
        correoInstitucional: 'test@duoc.cl',
        contraseña: 'password'
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Credenciales inválidas'
      }));
    });
  });

  // Aquí irían más pruebas para register, enviarCodigoVerificacion, etc.
});