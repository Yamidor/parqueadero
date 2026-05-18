const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tarifa = sequelize.define('Tarifa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tipo: {
    type: DataTypes.ENUM(
      'hora_moto',
      'hora_carro',
      'mensualidad_moto',
      'mensualidad_carro',
      'lavado_moto',
      'lavado_carro'
    ),
    allowNull: false,
    unique: true,
  },
  valor: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'tarifas',
});

module.exports = Tarifa;
