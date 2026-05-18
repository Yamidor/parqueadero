const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');

const DB_NAME = 'parkpro';
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '12345',
  dialect: 'mysql',
};

// Create database if it doesn't exist
async function createDatabaseIfNotExists() {
  try {
    const connection = await mysql.createConnection({
      host: DB_CONFIG.host,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await connection.end();
    console.log(`✅ Base de datos '${DB_NAME}' verificada/creada`);
  } catch (error) {
    console.error('❌ Error creando la base de datos:', error.message);
    throw error;
  }
}

const sequelize = new Sequelize(DB_NAME, DB_CONFIG.user, DB_CONFIG.password, {
  host: DB_CONFIG.host,
  dialect: DB_CONFIG.dialect,
  logging: false,
  timezone: '-05:00',
  define: {
    timestamps: true,
  },
});

module.exports = { sequelize, createDatabaseIfNotExists };
