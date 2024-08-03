const db = require('../server/config/database');

module.exports = async () => {
  await db.run("DROP TABLE IF EXISTS usuarios");
  await db.run("DROP TABLE IF EXISTS consultasRegistradas");
  await db.close();
};