const { Gasto } = require('../models');
const { Op } = require('sequelize');

const gastosController = {
  async listar(req, res) {
    try {
      const { fechaInicio, fechaFin } = req.query;
      let where = {};
      if (fechaInicio && fechaFin) {
        where.fecha = { [Op.between]: [fechaInicio, fechaFin] };
      }
      const gastos = await Gasto.findAll({ where, order: [['fecha', 'DESC']] });
      res.json(gastos);
    } catch (error) {
      res.status(500).json({ error: 'Error al listar gastos' });
    }
  },
  async crear(req, res) {
    try {
      const { descripcion, monto, categoria, fecha } = req.body;
      if (!descripcion || !monto) return res.status(400).json({ error: 'Descripción y monto requeridos' });
      const gasto = await Gasto.create({
        descripcion, monto, categoria: categoria || 'otros',
        fecha: fecha || new Date().toISOString().split('T')[0], adminId: req.user.id,
      });
      res.status(201).json(gasto);
    } catch (error) {
      res.status(500).json({ error: 'Error al crear gasto' });
    }
  },
  async actualizar(req, res) {
    try {
      const gasto = await Gasto.findByPk(req.params.id);
      if (!gasto) return res.status(404).json({ error: 'Gasto no encontrado' });
      await gasto.update(req.body);
      res.json(gasto);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar gasto' });
    }
  },
  async eliminar(req, res) {
    try {
      const gasto = await Gasto.findByPk(req.params.id);
      if (!gasto) return res.status(404).json({ error: 'Gasto no encontrado' });
      await gasto.destroy();
      res.json({ message: 'Gasto eliminado' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar gasto' });
    }
  },
};

module.exports = gastosController;
