const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME || 'parkpro';
// Configurable por variables de entorno. En produccion el script de arranque
// usa el puerto 3307 para no chocar con un MySQL ya instalado en 3306.
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '12345',
  dialect: 'mysql',
};

// Create database if it doesn't exist
async function createDatabaseIfNotExists() {
  try {
    const connection = await mysql.createConnection({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await connection.end();
    console.log(`✅ Base de datos '${DB_NAME}' verificada/creada (puerto ${DB_CONFIG.port})`);
  } catch (error) {
    console.error('❌ Error creando la base de datos:', error.message);
    throw error;
  }
}

const sequelize = new Sequelize(DB_NAME, DB_CONFIG.user, DB_CONFIG.password, {
  host: DB_CONFIG.host,
  port: DB_CONFIG.port,
  dialect: DB_CONFIG.dialect,
  logging: false,
  timezone: '-05:00',
  define: {
    timestamps: true,
  },
});

module.exports = { sequelize, createDatabaseIfNotExists };
