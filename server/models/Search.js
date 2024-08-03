const db = require('../config/database');

class Search {
  static create(search) {
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO consultasRegistradas (correoUsuario, numeroPatente) VALUES (?, ?)',
        [search.correoUsuario, search.numeroPatente],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  static findByPatente(patente) {
    return new Promise((resolve, reject) => {
      db.get('SELECT id, nombre, numeroPatente, numeroTelefono, correoInstitucional FROM usuarios WHERE numeroPatente = ?', [patente], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
}

module.exports = Search;