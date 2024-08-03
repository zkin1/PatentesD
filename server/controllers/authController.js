const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const transporter = require('../config/email');
const crypto = require('crypto');

const codigosVerificacion = new Map();

exports.login = async (req, res) => {
  const { correoInstitucional, contraseña } = req.body;
  
  db.get('SELECT * FROM usuarios WHERE correoInstitucional = ?', [correoInstitucional], async (err, row) => {
    if (err) {
      console.error('Error en la base de datos:', err);
      return res.status(500).json({ valido: false, message: 'Error interno del servidor' });
    }

    if (row && await bcrypt.compare(contraseña, row.contraseña)) {
      const token = jwt.sign({ id: row.id, correoInstitucional: row.correoInstitucional }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({
        valido: true,
        token,
        usuario: {
          nombre: row.nombre,
          correoInstitucional: row.correoInstitucional
        }
      });
    } else {
      res.status(401).json({ valido: false, message: 'Credenciales inválidas' });
    }
  });
};

exports.register = async (req, res) => {
  const { nombre, correoInstitucional, contraseña, numeroPatente, numeroTelefono } = req.body;

  try {
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM usuarios WHERE correoInstitucional = ? OR numeroPatente = ?', 
        [correoInstitucional, numeroPatente], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingUser) {
      if (existingUser.correoInstitucional === correoInstitucional) {
        return res.status(409).json({ error: 'Ya existe un usuario con este correo institucional' });
      } else {
        return res.status(409).json({ error: 'Ya existe un usuario con esta patente' });
      }
    }

    const hashedPassword = await bcrypt.hash(contraseña, 10);

    await new Promise((resolve, reject) => {
      db.run('INSERT INTO usuarios (nombre, contraseña, numeroPatente, numeroTelefono, correoInstitucional) VALUES (?, ?, ?, ?, ?)',
        [nombre, hashedPassword, numeroPatente, numeroTelefono, correoInstitucional],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor al registrar el usuario' });
  }
};

exports.enviarCodigoVerificacion = async (req, res) => {
  const { correoInstitucional } = req.body;
  const codigo = crypto.randomInt(1000, 9999).toString();

  try {
    const usuario = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM usuarios WHERE correoInstitucional = ?', [correoInstitucional], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await transporter.sendMail({
      from: '"Patentes Duoc UC" <noreply@duoc.cl>',
      to: correoInstitucional,
      subject: "Código de verificación para cambio de contraseña",
      text: `Tu código de verificación es: ${codigo}`,
      html: `<b>Tu código de verificación es: ${codigo}</b>`
    });

    codigosVerificacion.set(correoInstitucional, {
      codigo,
      timestamp: Date.now()
    });

    res.json({ message: 'Código enviado' });
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    res.status(500).json({ message: 'Error al enviar el código' });
  }
};

exports.verificarCodigo = (req, res) => {
  const { correoInstitucional, codigo } = req.body;
  const verificacion = codigosVerificacion.get(correoInstitucional);

  if (!verificacion) {
    return res.status(400).json({ message: 'No se ha solicitado un código para este correo' });
  }

  if (verificacion.codigo !== codigo) {
    return res.status(400).json({ message: 'Código incorrecto' });
  }

  if (Date.now() - verificacion.timestamp > 15 * 60 * 1000) {
    codigosVerificacion.delete(correoInstitucional);
    return res.status(400).json({ message: 'El código ha expirado' });
  }

  codigosVerificacion.delete(correoInstitucional);
  res.json({ message: 'Código verificado correctamente' });
};

exports.cambiarPassword = async (req, res) => {
  const { correoInstitucional, nuevaPassword } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(nuevaPassword, 10);
    
    await new Promise((resolve, reject) => {
      db.run('UPDATE usuarios SET contraseña = ? WHERE correoInstitucional = ?', [hashedPassword, correoInstitucional], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error al cambiar la contraseña:', error);
    res.status(500).json({ message: 'Error al cambiar la contraseña' });
  }
};