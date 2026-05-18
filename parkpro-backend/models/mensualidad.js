const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Mensualidad = sequelize.define('Mensualidad', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  facturaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'facturas', key: 'id' },
  },
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'clientes', key: 'id' },
  },
  vehiculoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'vehiculos', key: 'id' },
  },
  puestoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'puestos', key: 'id' },
  },
  fechaInicio: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  fechaFin: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('activo', 'vencido', 'renovado'),
    allowNull: false,
    defaultValue: 'activo',
  },
}, {
  tableName: 'mensualidades',
});

module.exports = Mensualidad;
