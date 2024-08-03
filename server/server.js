// Importaciones de módulos
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');

// Importaciones de rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const searchRoutes = require('./routes/searchRoutes');

// Importaciones de middleware
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Configuración de la aplicación
const app = express();
const PORT = process.env.PORT || 49160;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors({
  origin: ['https://34.171.190.239', 'http://34.171.190.239'],
  optionsSuccessStatus: 200
}));
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '..', 'src')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/search', searchRoutes);

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

// Middleware de manejo de errores
app.use(errorHandler);

// Redirección HTTPS
app.use((req, res, next) => {
  if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect('https://' + req.get('host') + req.url);
  }
  next();
});

// Configuración de HTTPS
const httpsOptions = {
  key: fs.readFileSync('/usr/src/app/ssl/server.key'),
  cert: fs.readFileSync('/usr/src/app/ssl/server.crt')
};

// Crear servidores HTTP y HTTPS
const httpServer = http.createServer(app);
const httpsServer = https.createServer(httpsOptions, app);

// Iniciar servidores
httpServer.listen(80, () => {
  console.log('Servidor HTTP escuchando en el puerto 80');
});

httpsServer.listen(443, () => {
  console.log('Servidor HTTPS escuchando en el puerto 443');
});

// Iniciar el servidor principal
app.listen(PORT, HOST, () => {
  console.log(`Servidor escuchando en http://${HOST}:${PORT}`);
});

// Manejo de cierre del servidor
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido. Cerrando servidores HTTP y HTTPS.');
  httpServer.close(() => console.log('Servidor HTTP cerrado.'));
  httpsServer.close(() => console.log('Servidor HTTPS cerrado.'));
});

// Exportar la app para pruebas
module.exports = app;