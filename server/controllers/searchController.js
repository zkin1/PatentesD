const db = require('../config/database');

exports.searchByPatente = (req, res) => {
  const numeroPatente = req.params.numeroPatente;
  console.log('Buscando patente:', numeroPatente);
  db.get('SELECT id, nombre, numeroPatente, numeroTelefono, correoInstitucional FROM usuarios WHERE numeroPatente = ?', [numeroPatente], (err, row) => {
    if (err) {
      console.error('Error en la consulta a la base de datos:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      console.log('Usuario encontrado:', row);
      res.json(row);
    } else {
      console.log('Usuario no encontrado');
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  });
};

exports.registerSearch = (req, res) => {
  const { correoUsuario, numeroPatente } = req.body;
  db.run('INSERT INTO consultasRegistradas (correoUsuario, numeroPatente) VALUES (?, ?)',
    [correoUsuario, numeroPatente],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ id: this.lastID, correoUsuario, numeroPatente });
    }
  );
};

exports.getAllSearches = (req, res) => {
  db.all('SELECT * FROM consultasRegistradas', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
};

exports.verifyPatente = (req, res) => {
  const { numeroPatente } = req.params;
  db.get('SELECT * FROM usuarios WHERE numeroPatente = ?', [numeroPatente], (err, row) => {
    if (err) {
      res.status(500).json({ error: 'Error al verificar la patente' });
      return;
    }
    res.status(200).json({ existe: !!row });
  });
};