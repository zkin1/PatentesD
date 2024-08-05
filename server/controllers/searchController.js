const db = require('../config/database');

exports.searchByPatente = (req, res) => {
  const numeroPatente = req.params.numeroPatente;
  console.log('Buscando patente:', numeroPatente);
  db.get('SELECT id, nombre, numeroPatente, numeroTelefono, correoInstitucional FROM usuarios WHERE numeroPatente = ?', [numeroPatente], (err, row) => {
    if (err) {
      console.error('Error en la consulta a la base de datos:', err);
      res.status(500).json({ error: 'Error interno del servidor', details: err.message });
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

exports.registerSearch = async (req, res) => {
    const { correoUsuario, numeroPatente } = req.body;
    console.log('Registrando consulta:', { correoUsuario, numeroPatente });
    
    try {
      const lastID = await new Promise((resolve, reject) => {
        db.run('INSERT INTO consultasRegistradas (correoUsuario, numeroPatente) VALUES (?, ?)',
          [correoUsuario, numeroPatente],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
      
      console.log('Consulta registrada exitosamente');
      res.status(201).json({ message: 'Consulta registrada exitosamente', id: lastID, correoUsuario, numeroPatente });
    } catch (err) {
      console.error('Error al registrar la consulta:', err);
      res.status(500).json({ error: 'Error al registrar la consulta', details: err.message });
    }
  };

exports.getAllSearches = (req, res) => {
  console.log('Obteniendo todas las consultas registradas');
  db.all('SELECT * FROM consultasRegistradas', [], (err, rows) => {
    if (err) {
      console.error('Error al obtener las consultas:', err);
      res.status(500).json({ error: 'Error al obtener las consultas', details: err.message });
      return;
    }
    console.log(`Se encontraron ${rows.length} consultas`);
    res.json(rows);
  });
};

exports.verifyPatente = (req, res) => {
  const { numeroPatente } = req.params;
  console.log('Verificando patente:', numeroPatente);
  db.get('SELECT * FROM usuarios WHERE numeroPatente = ?', [numeroPatente], (err, row) => {
    if (err) {
      console.error('Error al verificar la patente:', err);
      res.status(500).json({ error: 'Error al verificar la patente', details: err.message });
      return;
    }
    const existe = !!row;
    console.log(`Patente ${numeroPatente} ${existe ? 'existe' : 'no existe'}`);
    res.status(200).json({ existe });
  });
};