const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vehiculo = sequelize.define('Vehiculo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'clientes', key: 'id' },
  },
  placa: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
  },
  tipo: {
    type: DataTypes.ENUM('moto', 'carro'),
    allowNull: false,
  },
  marca: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  modelo: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  color: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
}, {
  tableName: 'vehiculos',
});

module.exports = Vehiculo;
