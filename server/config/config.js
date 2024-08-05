require('dotenv').config();

module.exports = {
  API_URL: process.env.API_URL,
  PORT: process.env.PORT || 49160,
  HOST: process.env.HOST || '0.0.0.0',
  CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [],
};