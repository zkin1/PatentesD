const searchController = require('../../../server/controllers/searchController');
const Search = require('../../../server/models/Search');

jest.mock('../../../server/models/Search');

describe('Search Controller', () => {
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

  describe('searchByPatente', () => {
    it('should find a user by patente', async () => {
      const mockUser = {
        id: 1,
        nombre: 'Test User',
        numeroPatente: 'ABC123',
        numeroTelefono: '123456789'
      };
      Search.findByPatente.mockResolvedValue(mockUser);

      req.params.numeroPatente = 'ABC123';

      await searchController.searchByPatente(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 404 if user not found', async () => {
      Search.findByPatente.mockResolvedValue(null);

      req.params.numeroPatente = 'XYZ789';

      await searchController.searchByPatente(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
    });
  });

  describe('registerSearch', () => {
    it('should register a new search', async () => {
      const mockSearchData = {
        id: 1,
        correoUsuario: 'test@duoc.cl',
        numeroPatente: 'ABC123'
      };
      Search.create.mockResolvedValue(1);

      req.body = {
        correoUsuario: 'test@duoc.cl',
        numeroPatente: 'ABC123'
      };

      await searchController.registerSearch(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining(mockSearchData));
    });
  });

  // Aquí irían más pruebas para otros métodos del controlador
});