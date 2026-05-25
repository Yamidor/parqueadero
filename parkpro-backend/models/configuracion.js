const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Configuracion = sequelize.define('Configuracion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombreNegocio: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  nit: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  direccion: {
    type: DataTypes.STRING(300),
    allowNull: true,
  },
  telefono: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  modoCobro: {
    type: DataTypes.ENUM('hora_completa', 'fraccion'),
    allowNull: false,
    defaultValue: 'hora_completa',
  },
}, {
  tableName: 'configuracion',
});

module.exports = Configuracion;
