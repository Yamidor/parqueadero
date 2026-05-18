const { Factura } = require('../models');
const { Op } = require('sequelize');

/**
 * Generate a unique invoice code based on service type
 * Format: PKR-YYYY-NNNNN (parqueo), PKL-YYYY-NNNNN (lavado), PKM-YYYY-NNNNN (mensualidad)
 */
async function generarCodigoFactura(tipoServicio) {
  const prefijos = {
    parqueo: 'PKR',
    lavado: 'PKL',
    mensualidad: 'PKM',
  };

  const prefijo = prefijos[tipoServicio] || 'PKR';
  const year = new Date().getFullYear();
  const base = `${prefijo}-${year}-`;

  // Find the last invoice with this prefix
  const ultimaFactura = await Factura.findOne({
    where: {
      codigo: { [Op.like]: `${base}%` },
    },
    order: [['id', 'DESC']],
  });

  let siguiente = 1;
  if (ultimaFactura) {
    const ultimoNumero = parseInt(ultimaFactura.codigo.split('-')[2], 10);
    siguiente = ultimoNumero + 1;
  }

  return `${base}${String(siguiente).padStart(5, '0')}`;
}

module.exports = { generarCodigoFactura };
