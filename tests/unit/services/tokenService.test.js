const TokenService = require('../../../server/services/tokenService');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('Token Service', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('generateToken', () => {
    it('should generate a token', () => {
      const mockUser = { id: 1, correoInstitucional: 'test@duoc.cl' };
      jwt.sign.mockReturnValue('mock-token');

      const token = TokenService.generateToken(mockUser);

      expect(token).toBe('mock-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 1, correoInstitucional: 'test@duoc.cl' },
        'test-secret',
        { expiresIn: '1h' }
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const mockDecodedToken = { id: 1, correoInstitucional: 'test@duoc.cl' };
      jwt.verify.mockReturnValue(mockDecodedToken);

      const result = TokenService.verifyToken('valid-token');

      expect(result).toEqual(mockDecodedToken);
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
    });

    it('should return null for an invalid token', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = TokenService.verifyToken('invalid-token');

      expect(result).toBeNull();
    });
  });
});