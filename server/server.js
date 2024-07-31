require('dotenv').config({ path: '../.env' });
require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, param, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT;
const HOST = process.env.HOST;

const server_http = http.createServer(app);

const wss = new WebSocket.Server({ server: server_http });

wss.on('connection', function connection(ws) {
  console.log('Nueva conexión WebSocket establecida');
});

app.use(cors({
  origin: ['https://34.171.190.239', 'http://34.171.190.239'],
  optionsSuccessStatus: 200
}));
app.use(bodyParser.json());

const https = require('https');
const http = require('http');
const fs = require('fs');


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 solicitudes por ventana
});
app.use(limiter);

// Conexión a SQLite
const db = new sqlite3.Database('/usr/src/app/patentesD.db', (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite');
  }
});

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Error al verificar el token:', err);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

// Ruta para obtener todos los usuarios (protegida)
app.get('/usuarios', authenticateToken, (req, res) => {
  db.all('SELECT id, nombre, correoInstitucional, numeroPatente, numeroTelefono FROM usuarios', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Ruta para verificar si una patente ya existe
app.get('/verificarPatente/:numeroPatente', [
  param('numeroPatente').isAlphanumeric().isLength({ min: 6, max: 6 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { numeroPatente } = req.params;
  db.get('SELECT * FROM usuarios WHERE numeroPatente = ?', [numeroPatente], (err, row) => {
    if (err) {
      res.status(500).json({ error: 'Error al verificar la patente' });
      return;
    }
    res.status(200).json({ existe: !!row });
  });
});

// Ruta para registrar un nuevo usuario
app.post('/usuarios', [
  body('nombre').isString().trim().notEmpty().withMessage('El nombre es requerido'),
  body('correoInstitucional').isEmail().withMessage('Correo institucional inválido'),
  body('contraseña').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('numeroPatente').custom((value) => {
    if (!/^[A-Z]{2}\d{4}$|^[A-Z]{4}\d{2}$/.test(value)) {
      throw new Error('Formato de patente inválido');
    }
    return true;
  }),
  body('numeroTelefono').isMobilePhone().withMessage('Número de teléfono inválido')
], async (req, res) => {
  console.log('Datos recibidos:', req.body);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { nombre, correoInstitucional, contraseña, numeroPatente, numeroTelefono } = req.body;

  try {
    // Verificar si ya existe un usuario con el mismo correo o patente
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

    const newUserId = await new Promise((resolve, reject) => {
      db.run('INSERT INTO usuarios (nombre, contraseña, numeroPatente, numeroTelefono, correoInstitucional) VALUES (?, ?, ?, ?, ?)',
        [nombre, hashedPassword, numeroPatente, numeroTelefono, correoInstitucional],
        function(err) {
          if (err) reject(err);
          else {
            // Emitir actualización
            broadcastDatabaseUpdate({
              type: 'newUser',
              user: { id: this.lastID, nombre, correoInstitucional, numeroPatente, numeroTelefono }
            });
            resolve(this.lastID);
          }
        }
      );
    });

    res.status(201).json({ message: 'Usuario registrado exitosamente', userId: newUserId });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor al registrar el usuario' });
  }
});

// Ruta para registrar una consulta (protegida)
app.post('/consultasRegistradas', authenticateToken, [
  body('correoUsuario').isEmail(),
  body('numeroPatente').isAlphanumeric().isLength({ min: 6, max: 6 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { correoUsuario, numeroPatente } = req.body;
  db.run('INSERT INTO consultasRegistradas (correoUsuario, numeroPatente) VALUES (?, ?)',
    [correoUsuario, numeroPatente],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Emitir actualización
      broadcastDatabaseUpdate({
        type: 'newConsulta',
        consulta: { id: this.lastID, correoUsuario, numeroPatente }
      });

      res.status(201).json({ id: this.lastID, correoUsuario, numeroPatente });
    }
  );
});

// Ruta para obtener todas las consultas registradas (protegida)
app.get('/consultasRegistradas', authenticateToken, (req, res) => {
  db.all('SELECT * FROM consultasRegistradas', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Ruta para buscar un usuario por número de patente (protegida)
app.get('/buscarPorPatente/:numeroPatente', authenticateToken, [
  param('numeroPatente').isAlphanumeric().isLength({ min: 6, max: 6 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

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
});

// Ruta para iniciar sesión
app.post('/login', [
  body('correoInstitucional').isEmail(),
  body('contraseña').isLength({ min: 6 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { correoInstitucional, contraseña } = req.body;
  console.log('Solicitud de inicio de sesión recibida:', { correoInstitucional, contraseña });

  db.get('SELECT * FROM usuarios WHERE correoInstitucional = ?', [correoInstitucional], async (err, row) => {
    if (err) {
      console.error('Error en la base de datos:', err);
      return res.status(500).json({ valido: false, message: 'Error interno del servidor' });
    }

    console.log('Usuario encontrado en la base de datos:', row);

    if (row && await bcrypt.compare(contraseña, row.contraseña)) {
      console.log('Autenticación exitosa');
      const token = jwt.sign({ id: row.id, correoInstitucional: row.correoInstitucional }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      // Emitir actualización
      broadcastDatabaseUpdate({
        type: 'login',
        user: { id: row.id, nombre: row.nombre, correoInstitucional: row.correoInstitucional }
      });

      res.json({
        valido: true,
        token,
        usuario: {
          nombre: row.nombre,
          correoInstitucional: row.correoInstitucional
        }
      });
    } else {
      console.log('Autenticación fallida');
      res.status(401).json({ valido: false, message: 'Credenciales inválidas' });
    }
  });
});


// Iniciar el servidor
const server = app.listen(PORT, HOST, () => {  
  console.log(`Servidor escuchando en http://${HOST}:${PORT}`);
});

server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string'
    ? 'Pipe ' + PORT
    : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requiere privilegios elevados`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} ya está en uso`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Función para cerrar la conexión de la base de datos al cerrar el servidor
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Conexión a la base de datos cerrada');
    process.exit(0);
  });
});


const codigosVerificacion = new Map();

// Configuración del transporter de nodemailer
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER, // tu correo
    pass: process.env.EMAIL_PASS  // tu contraseña o contraseña de aplicación
  }
});

// Ruta para enviar el código de verificación
app.post('/enviar-codigo', [
  body('correoInstitucional').isEmail().withMessage('Correo institucional inválido')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { correoInstitucional } = req.body;
  const codigo = crypto.randomInt(1000, 9999).toString();

  try {
    // Verificar si el correo existe en la base de datos
    const usuario = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM usuarios WHERE correoInstitucional = ?', [correoInstitucional], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Enviar el correo
    await transporter.sendMail({
      from: '"Patentes Duoc UC" <noreply@duoc.cl>',
      to: correoInstitucional,
      subject: "Código de verificación para cambio de contraseña",
      text: `Tu código de verificación es: ${codigo}`,
      html: `<b>Tu código de verificación es: ${codigo}</b>`
    });

    // Guardar el código (en producción, usar una base de datos o caché)
    codigosVerificacion.set(correoInstitucional, {
      codigo,
      timestamp: Date.now()
    });

    res.json({ message: 'Código enviado' });
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    res.status(500).json({ message: 'Error al enviar el código' });
  }
});

// Ruta para verificar el código
app.post('/verificar-codigo', [
  body('correoInstitucional').isEmail().withMessage('Correo institucional inválido'),
  body('codigo').isLength({ min: 4, max: 4 }).withMessage('Código inválido')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { correoInstitucional, codigo } = req.body;
  const verificacion = codigosVerificacion.get(correoInstitucional);

  if (!verificacion) {
    return res.status(400).json({ message: 'No se ha solicitado un código para este correo' });
  }

  if (verificacion.codigo !== codigo) {
    return res.status(400).json({ message: 'Código incorrecto' });
  }

  if (Date.now() - verificacion.timestamp > 15 * 60 * 1000) { // 15 minutos
    codigosVerificacion.delete(correoInstitucional);
    return res.status(400).json({ message: 'El código ha expirado' });
  }

  // Código válido
  codigosVerificacion.delete(correoInstitucional);
  res.json({ message: 'Código verificado correctamente' });
});

// Ruta para cambiar la contraseña
app.post('/cambiar-password', [
  body('correoInstitucional').isEmail().withMessage('Correo institucional inválido'),
  body('nuevaPassword').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { correoInstitucional, nuevaPassword } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(nuevaPassword, 10);
    
    // Actualizar la contraseña en la base de datos
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
});

app.get('/admin-data', authenticateToken, async (req, res) => {
  try {
    const usuarios = await new Promise((resolve, reject) => {
      db.all('SELECT id, nombre, correoInstitucional, numeroPatente, numeroTelefono FROM usuarios', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const consultas = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM consultasRegistradas', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({ usuarios, consultas });
  } catch (error) {
    console.error('Error al obtener datos de administración:', error);
    res.status(500).json({ error: 'Error al obtener datos de administración' });
  }
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '..', 'src')));

// Ruta para manejar las páginas HTML específicas
app.get('/*.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'src', 'html', req.path));
});

// Ruta para la página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/html/index.html'));
});

// Ruta para manejar todas las demás solicitudes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/html/index.html'));
});

app.get('/admin', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, '../src/html/admin.html'));
});


app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

//servidor HTTP

const httpsServer = https.createServer({
  key: fs.readFileSync('/usr/src/app/ssl/server.key'),
  cert: fs.readFileSync('/usr/src/app/ssl/server.crt')
}, app);

https.createServer(options, app).listen(443, () => {
});

http.createServer(app).listen(80, () => {
});

server.listen(80, () => {
  console.log('HTTP Server running on port 80');
});

httpsServer.listen(443, () => {
  console.log('HTTPS Server running on port 443');
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "default-src": ["'self'", "https:", "http:"],
      "script-src": ["'self'", "'unsafe-inline'", "https:", "http:"],
      "style-src": ["'self'", "'unsafe-inline'", "https:", "http:"],
      "img-src": ["'self'", "data:", "https:", "http:"],
      "font-src": ["'self'", "https:", "http:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
}));

app.use((req, res, next) => {
  if (!req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
})


//conexion con la DB en tiempo real 

// Inicializar el WebSocket Server


function broadcastDatabaseUpdate(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}