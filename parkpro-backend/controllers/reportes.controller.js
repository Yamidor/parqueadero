const { Factura, Gasto, Nomina } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

const reportesController = {
  async obtener(req, res) {
    try {
      const { fechaInicio, fechaFin } = req.query;
      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ error: 'fechaInicio y fechaFin son requeridos' });
      }
      const inicio = new Date(fechaInicio);
      inicio.setHours(0, 0, 0, 0);
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59, 999);

      // Total income by service type
      const facturas = await Factura.findAll({
        where: { estado: 'pagado', fechaPago: { [Op.between]: [inicio, fin] } },
        attributes: [
          'tipoServicio',
          [fn('SUM', col('valorTotal')), 'total'],
          [fn('COUNT', col('id')), 'cantidad'],
        ],
        group: ['tipoServicio'],
        raw: true,
      });

      const totalIngresos = facturas.reduce((s, f) => s + parseFloat(f.total || 0), 0);
      const vehiculosAtendidos = facturas.reduce((s, f) => s + parseInt(f.cantidad || 0), 0);

      // Total expenses
      const gastos = await Gasto.findAll({
        where: { fecha: { [Op.between]: [fechaInicio, fechaFin] } },
        attributes: [[fn('SUM', col('monto')), 'total']],
        raw: true,
      });
      const totalGastos = parseFloat(gastos[0]?.total || 0);

      // Total payroll
      const nominas = await Nomina.findAll({
        where: { fecha: { [Op.between]: [fechaInicio, fechaFin] } },
        attributes: [[fn('SUM', col('monto')), 'total']],
        raw: true,
      });
      const totalNomina = parseFloat(nominas[0]?.total || 0);

      // Daily income for chart
      const ingresosDiarios = await Factura.findAll({
        where: { estado: 'pagado', fechaPago: { [Op.between]: [inicio, fin] } },
        attributes: [
          [fn('DATE', col('fechaPago')), 'fecha'],
          [fn('SUM', col('valorTotal')), 'total'],
        ],
        group: [fn('DATE', col('fechaPago'))],
        order: [[fn('DATE', col('fechaPago')), 'ASC']],
        raw: true,
      });

      res.json({
        totalIngresos,
        vehiculosAtendidos,
        ingresosPorTipo: facturas,
        totalGastos,
        totalNomina,
        balance: totalIngresos - totalGastos - totalNomina,
        ingresosDiarios,
      });
    } catch (error) {
      console.error('Error en reportes:', error);
      res.status(500).json({ error: 'Error al generar reporte' });
    }
  },
};

module.exports = reportesController;
