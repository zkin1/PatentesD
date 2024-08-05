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
const config = require('./config/config');

// Configuración de la aplicación
const app = express();
const PORT = process.env.PORT || 49160;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors({
  origin: ['http://34.170.175.113', 'https://34.170.175.113'],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "default-src": ["'self'", "https:", "http:"],
      "script-src": ["'self'", "'unsafe-inline'", "https:", "http:"],
      "script-src-attr": ["'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'", "https:", "http:"],
      "img-src": ["'self'", "data:", "https:", "http:"],
      "font-src": ["'self'", "https:", "http:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
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
  const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'html', req.path), 'utf8');
  const renderedHtml = htmlContent.replace('{{API_URL}}', config.API_URL);
  res.send(renderedHtml);
});

// Ruta para la página principal
app.get('/', (req, res) => {
  const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'html', 'index.html'), 'utf8');
  const renderedHtml = htmlContent.replace('{{API_URL}}', config.API_URL);
  res.send(renderedHtml);
});

// Ruta para manejar todas las demás solicitudes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'src', 'html', 'index.html'));
});

// Middleware de manejo de errores
app.use(errorHandler);


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
  console.log(`Servidor HTTP escuchando en ${config.API_URL}:80`);
});

httpsServer.listen(443, () => {
  console.log(`Servidor HTTPS escuchando en ${config.API_URL}:443`);
});


// Manejo de cierre del servidor
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido. Cerrando servidores HTTP y HTTPS.');
  httpServer.close(() => console.log('Servidor HTTP cerrado.'));
  httpsServer.close(() => console.log('Servidor HTTPS cerrado.'));
});

app.use((req, res, next) => {
  if (req.secure) {
    next();
  } else {
    res.redirect('https://' + req.headers.host + req.url);
  }
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  next();
});


app.options('*', cors()) // habilita pre-flight request para todas las rutas
// Exportar la app para pruebas
module.exports = app;