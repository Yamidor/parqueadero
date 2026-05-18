const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Puesto = sequelize.define('Puesto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  numero: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  tipo: {
    type: DataTypes.ENUM('moto', 'carro', 'mixto'),
    allowNull: false,
    defaultValue: 'mixto',
  },
  estado: {
    type: DataTypes.ENUM('libre', 'ocupado'),
    allowNull: false,
    defaultValue: 'libre',
  },
  descripcion: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
}, {
  tableName: 'puestos',
});

module.exports = Puesto;
