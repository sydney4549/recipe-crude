require('dotenv').config();
const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5
};

// Cloud databases need SSL. Set DB_SSL=true in the cloud environment variables.
if (process.env.DB_SSL === 'true') {
  config.ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
}

module.exports = mysql.createPool(config);
