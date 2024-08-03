const jwt = require('jsonwebtoken');

class TokenService {
  static generateToken(user) {
    return jwt.sign(
      { id: user.id, correoInstitucional: user.correoInstitucional },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
}

module.exports = TokenService;