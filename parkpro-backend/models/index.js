const { sequelize } = require('../config/database');
const Usuario = require('./usuario');
const Cliente = require('./cliente');
const Vehiculo = require('./vehiculo');
const Puesto = require('./puesto');
const Tarifa = require('./tarifa');
const Factura = require('./factura');
const Mensualidad = require('./mensualidad');
const Gasto = require('./gasto');
const Nomina = require('./nomina');
const Configuracion = require('./configuracion');

// ── Associations ──

// Cliente <-> Vehiculo
Cliente.hasMany(Vehiculo, { foreignKey: 'clienteId', as: 'vehiculos' });
Vehiculo.belongsTo(Cliente, { foreignKey: 'clienteId', as: 'cliente' });

// Factura associations
Factura.belongsTo(Vehiculo, { foreignKey: 'vehiculoId', as: 'vehiculo' });
Factura.belongsTo(Puesto, { foreignKey: 'puestoId', as: 'puesto' });
Factura.belongsTo(Cliente, { foreignKey: 'clienteId', as: 'cliente' });
Factura.belongsTo(Usuario, { foreignKey: 'cajeroId', as: 'cajero' });

Vehiculo.hasMany(Factura, { foreignKey: 'vehiculoId', as: 'facturas' });
Cliente.hasMany(Factura, { foreignKey: 'clienteId', as: 'facturas' });
Puesto.hasMany(Factura, { foreignKey: 'puestoId', as: 'facturas' });

// Mensualidad associations
Mensualidad.belongsTo(Factura, { foreignKey: 'facturaId', as: 'factura' });
Mensualidad.belongsTo(Cliente, { foreignKey: 'clienteId', as: 'cliente' });
Mensualidad.belongsTo(Vehiculo, { foreignKey: 'vehiculoId', as: 'vehiculo' });
Mensualidad.belongsTo(Puesto, { foreignKey: 'puestoId', as: 'puesto' });

Cliente.hasMany(Mensualidad, { foreignKey: 'clienteId', as: 'mensualidades' });
Vehiculo.hasMany(Mensualidad, { foreignKey: 'vehiculoId', as: 'mensualidades' });

// Gasto -> admin
Gasto.belongsTo(Usuario, { foreignKey: 'adminId', as: 'admin' });

// Nomina -> trabajador & admin
Nomina.belongsTo(Usuario, { foreignKey: 'trabajadorId', as: 'trabajador' });
Nomina.belongsTo(Usuario, { foreignKey: 'adminId', as: 'admin' });

module.exports = {
  sequelize,
  Usuario,
  Cliente,
  Vehiculo,
  Puesto,
  Tarifa,
  Factura,
  Mensualidad,
  Gasto,
  Nomina,
  Configuracion,
};
