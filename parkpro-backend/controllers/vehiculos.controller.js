const { Vehiculo, Cliente } = require('../models');

const vehiculosController = {
  // GET /api/vehiculos
  async listar(req, res) {
    try {
      const vehiculos = await Vehiculo.findAll({
        include: [{ model: Cliente, as: 'cliente' }],
        order: [['createdAt', 'DESC']],
      });
      res.json(vehiculos);
    } catch (error) {
      res.status(500).json({ error: 'Error al listar vehículos' });
    }
  },

  // GET /api/vehiculos/placa/:placa
  async buscarPorPlaca(req, res) {
    try {
      const { placa } = req.params;
      const vehiculo = await Vehiculo.findOne({
        where: { placa: placa.toUpperCase() },
        include: [{ model: Cliente, as: 'cliente' }],
      });
      if (!vehiculo) {
        return res.status(404).json({ error: 'Vehículo no encontrado', found: false });
      }
      res.json({ ...vehiculo.toJSON(), found: true });
    } catch (error) {
      res.status(500).json({ error: 'Error al buscar vehículo' });
    }
  },

  // POST /api/vehiculos
  async crear(req, res) {
    try {
      const { clienteId, placa, tipo, marca, modelo, color } = req.body;
      if (!clienteId || !placa || !tipo) {
        return res.status(400).json({ error: 'clienteId, placa y tipo son requeridos' });
      }
      const existe = await Vehiculo.findOne({ where: { placa: placa.toUpperCase() } });
      if (existe) {
        return res.status(400).json({ error: 'Ya existe un vehículo con esa placa' });
      }
      const vehiculo = await Vehiculo.create({
        clienteId,
        placa: placa.toUpperCase(),
        tipo,
        marca,
        modelo,
        color,
      });
      const vehiculoConCliente = await Vehiculo.findByPk(vehiculo.id, {
        include: [{ model: Cliente, as: 'cliente' }],
      });
      res.status(201).json(vehiculoConCliente);
    } catch (error) {
      console.error('Error creando vehículo:', error);
      res.status(500).json({ error: 'Error al crear vehículo' });
    }
  },

  // PUT /api/vehiculos/:id
  async actualizar(req, res) {
    try {
      const vehiculo = await Vehiculo.findByPk(req.params.id);
      if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' });
      const { tipo, marca, modelo, color } = req.body;
      await vehiculo.update({ tipo, marca, modelo, color });
      res.json(vehiculo);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar vehículo' });
    }
  },
};

module.exports = vehiculosController;
