const db = require('../config/database');

class User {
  static findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM usuarios WHERE correoInstitucional = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static create(user) {
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO usuarios (nombre, contraseña, numeroPatente, numeroTelefono, correoInstitucional) VALUES (?, ?, ?, ?, ?)',
        [user.nombre, user.contraseña, user.numeroPatente, user.numeroTelefono, user.correoInstitucional],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  static updatePassword(email, password) {
    return new Promise((resolve, reject) => {
      db.run('UPDATE usuarios SET contraseña = ? WHERE correoInstitucional = ?', [password, email], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }
}

module.exports = User;