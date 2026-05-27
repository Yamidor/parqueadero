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
  horaAvisoMensualidad: {
    // Hora del día en formato "HH:MM" a la que se envía el aviso "vence mañana"
    // por WhatsApp. Ej: "09:00", "22:43". El cron corre cada minuto y verifica
    // que la notificación de hoy no se haya enviado aún (uniqueness por mensualidad).
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: '09:00',
  },
}, {
  tableName: 'configuracion',
});

module.exports = Configuracion;
