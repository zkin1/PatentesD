const db = require('../server/config/database');

global.setupTestDatabase = async () => {
  await db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    correoInstitucional TEXT UNIQUE,
    contraseña TEXT,
    numeroPatente TEXT UNIQUE,
    numeroTelefono TEXT
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS consultasRegistradas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    correoUsuario TEXT,
    numeroPatente TEXT,
    fechaConsulta DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
};

global.clearTestDatabase = async () => {
  await db.run("DELETE FROM usuarios");
  await db.run("DELETE FROM consultasRegistradas");
};