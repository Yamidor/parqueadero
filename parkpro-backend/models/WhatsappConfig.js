const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WhatsappConfig = sequelize.define('WhatsappConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  vinculado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  numero: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  vinculadoEn: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'whatsapp_config',
});

module.exports = WhatsappConfig;
