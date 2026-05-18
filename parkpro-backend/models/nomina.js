const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Nomina = sequelize.define('Nomina', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  trabajadorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'usuarios', key: 'id' },
  },
  monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  periodo: {
    type: DataTypes.ENUM('diario', 'mensual'),
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.STRING(300),
    allowNull: true,
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'usuarios', key: 'id' },
  },
}, {
  tableName: 'nomina',
});

module.exports = Nomina;
