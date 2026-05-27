const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NotificacionEnviada = sequelize.define('NotificacionEnviada', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  mensualidadId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'mensualidades', key: 'id' },
  },
  tipo: {
    type: DataTypes.ENUM('vence_3d', 'vence_2d', 'aviso_1d'),
    allowNull: false,
  },
  fechaEnvio: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'notificaciones_enviadas',
  indexes: [
    { unique: true, fields: ['mensualidadId', 'tipo'] },
  ],
});

module.exports = NotificacionEnviada;
