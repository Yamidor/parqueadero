const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Gasto = sequelize.define('Gasto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  descripcion: {
    type: DataTypes.STRING(300),
    allowNull: false,
  },
  monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  categoria: {
    type: DataTypes.ENUM('servicios', 'mantenimiento', 'otros'),
    allowNull: false,
    defaultValue: 'otros',
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'usuarios', key: 'id' },
  },
}, {
  tableName: 'gastos',
});

module.exports = Gasto;
