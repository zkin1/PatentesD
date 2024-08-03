const db = require('../config/database');

exports.getUser = (req, res) => {
  const { id } = req.params;
  db.get('SELECT id, nombre, correoInstitucional, numeroPatente, numeroTelefono FROM usuarios WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      res.json(row);
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  });
};

exports.getAllUsers = (req, res) => {
  db.all('SELECT id, nombre, correoInstitucional, numeroPatente, numeroTelefono FROM usuarios', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
};

exports.updateUser = (req, res) => {
  const { id } = req.params;
  const { nombre, numeroTelefono } = req.body;
  
  db.run(
    'UPDATE usuarios SET nombre = COALESCE(?, nombre), numeroTelefono = COALESCE(?, numeroTelefono) WHERE id = ?',
    [nombre, numeroTelefono, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Usuario actualizado', changes: this.changes });
    }
  );
};