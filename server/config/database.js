const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();


const dbPassword = process.env.DB_PASSWORD || '';
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/patentesD.db');


const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
      console.error('Error al abrir la base de datos:', err.message);
    } else {
      if (dbPassword) {
        db.run(`PRAGMA key = '${dbPassword}'`);
      }
      console.log('Conectado a la base de datos SQLite');
    }
  });

module.exports = db;