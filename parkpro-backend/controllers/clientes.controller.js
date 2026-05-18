const { Cliente, Vehiculo, Factura } = require('../models');

const clientesController = {
  // GET /api/clientes
  async listar(req, res) {
    try {
      const { buscar } = req.query;
      let where = {};
      if (buscar) {
        const { Op } = require('sequelize');
        where = {
          [Op.or]: [
            { nombre: { [Op.like]: `%${buscar}%` } },
            { apellido: { [Op.like]: `%${buscar}%` } },
            { documento: { [Op.like]: `%${buscar}%` } },
            { telefono: { [Op.like]: `%${buscar}%` } },
          ],
        };
      }
      const clientes = await Cliente.findAll({
        where,
        include: [{ model: Vehiculo, as: 'vehiculos' }],
        order: [['createdAt', 'DESC']],
      });
      res.json(clientes);
    } catch (error) {
      console.error('Error listando clientes:', error);
      res.status(500).json({ error: 'Error al listar clientes' });
    }
  },

  // GET /api/clientes/:id
  async obtener(req, res) {
    try {
      const cliente = await Cliente.findByPk(req.params.id, {
        include: [{ model: Vehiculo, as: 'vehiculos' }],
      });
      if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
      res.json(cliente);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener cliente' });
    }
  },

  // POST /api/clientes
  async crear(req, res) {
    try {
      const { nombre, apellido, telefono, email, documento } = req.body;
      if (!nombre || !apellido) {
        return res.status(400).json({ error: 'Nombre y apellido son requeridos' });
      }
      const cliente = await Cliente.create({ nombre, apellido, telefono, email, documento });
      res.status(201).json(cliente);
    } catch (error) {
      console.error('Error creando cliente:', error);
      res.status(500).json({ error: 'Error al crear cliente' });
    }
  },

  // PUT /api/clientes/:id
  async actualizar(req, res) {
    try {
      const cliente = await Cliente.findByPk(req.params.id);
      if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
      const { nombre, apellido, telefono, email, documento } = req.body;
      await cliente.update({ nombre, apellido, telefono, email, documento });
      res.json(cliente);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar cliente' });
    }
  },

  // GET /api/clientes/:id/historial
  async historial(req, res) {
    try {
      const cliente = await Cliente.findByPk(req.params.id, {
        include: [
          { model: Vehiculo, as: 'vehiculos' },
          {
            model: Factura,
            as: 'facturas',
            order: [['createdAt', 'DESC']],
          },
        ],
      });
      if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
      res.json(cliente);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener historial' });
    }
  },
};

module.exports = clientesController;
