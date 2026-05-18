const { Nomina, Usuario } = require('../models');
const { Op } = require('sequelize');

const nominaController = {
  async listar(req, res) {
    try {
      const { fechaInicio, fechaFin } = req.query;
      let where = {};
      if (fechaInicio && fechaFin) {
        where.fecha = { [Op.between]: [fechaInicio, fechaFin] };
      }
      const nominas = await Nomina.findAll({
        where,
        include: [{ model: Usuario, as: 'trabajador', attributes: ['id', 'nombre', 'email'] }],
        order: [['fecha', 'DESC']],
      });
      res.json(nominas);
    } catch (error) {
      res.status(500).json({ error: 'Error al listar nómina' });
    }
  },
  async crear(req, res) {
    try {
      const { trabajadorId, monto, periodo, fecha, descripcion } = req.body;
      if (!trabajadorId || !monto || !periodo) {
        return res.status(400).json({ error: 'trabajadorId, monto y periodo son requeridos' });
      }
      const nomina = await Nomina.create({
        trabajadorId, monto, periodo, descripcion,
        fecha: fecha || new Date().toISOString().split('T')[0], adminId: req.user.id,
      });
      const nominaCompleta = await Nomina.findByPk(nomina.id, {
        include: [{ model: Usuario, as: 'trabajador', attributes: ['id', 'nombre', 'email'] }],
      });
      res.status(201).json(nominaCompleta);
    } catch (error) {
      res.status(500).json({ error: 'Error al crear nómina' });
    }
  },
  async eliminar(req, res) {
    try {
      const nomina = await Nomina.findByPk(req.params.id);
      if (!nomina) return res.status(404).json({ error: 'Nómina no encontrada' });
      await nomina.destroy();
      res.json({ message: 'Nómina eliminada' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar nómina' });
    }
  },
};

module.exports = nominaController;
