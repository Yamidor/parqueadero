const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Factura = sequelize.define('Factura', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  codigo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  vehiculoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'vehiculos', key: 'id' },
  },
  puestoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'puestos', key: 'id' },
  },
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'clientes', key: 'id' },
  },
  cajeroId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'usuarios', key: 'id' },
  },
  tipoServicio: {
    type: DataTypes.ENUM('parqueo', 'lavado', 'mensualidad'),
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'pagado', 'cancelado'),
    allowNull: false,
    defaultValue: 'pendiente',
  },
  horaIngreso: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  horaSalida: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  totalHoras: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
  },
  valorTotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  fechaPago: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  metodoPago: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: 'efectivo',
  },
  codigoQR: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  subtipoLavado: {
    type: DataTypes.ENUM('normal', 'full'),
    allowNull: true,
  },
}, {
  tableName: 'facturas',
});

module.exports = Factura;
