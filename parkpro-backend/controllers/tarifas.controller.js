const { Tarifa } = require('../models');

const tarifasController = {
  async listar(req, res) {
    try {
      const tarifas = await Tarifa.findAll({ order: [['tipo', 'ASC']] });
      res.json(tarifas);
    } catch (error) {
      res.status(500).json({ error: 'Error al listar tarifas' });
    }
  },
  async actualizar(req, res) {
    try {
      const tarifa = await Tarifa.findByPk(req.params.id);
      if (!tarifa) return res.status(404).json({ error: 'Tarifa no encontrada' });
      const { valor } = req.body;
      if (valor === undefined || valor < 0) return res.status(400).json({ error: 'Valor inválido' });
      tarifa.valor = valor;
      await tarifa.save();
      res.json(tarifa);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar tarifa' });
    }
  },
};

module.exports = tarifasController;
