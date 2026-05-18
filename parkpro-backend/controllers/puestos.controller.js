const { Puesto } = require('../models');

const puestosController = {
  // GET /api/puestos
  async listar(req, res) {
    try {
      const puestos = await Puesto.findAll({ order: [['numero', 'ASC']] });
      res.json(puestos);
    } catch (error) {
      console.error('Error listando puestos:', error);
      res.status(500).json({ error: 'Error al listar puestos' });
    }
  },

  // POST /api/puestos
  async crear(req, res) {
    try {
      const { numero, tipo, descripcion } = req.body;
      const existe = await Puesto.findOne({ where: { numero } });
      if (existe) {
        return res.status(400).json({ error: `El puesto #${numero} ya existe` });
      }
      const puesto = await Puesto.create({ numero, tipo: tipo || 'mixto', descripcion });
      const io = req.app.get('io');
      if (io) io.emit('puesto_actualizado', puesto);
      res.status(201).json(puesto);
    } catch (error) {
      console.error('Error creando puesto:', error);
      res.status(500).json({ error: 'Error al crear puesto' });
    }
  },

  // PUT /api/puestos/:id
  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { numero, tipo, estado, descripcion } = req.body;
      const puesto = await Puesto.findByPk(id);
      if (!puesto) return res.status(404).json({ error: 'Puesto no encontrado' });

      if (numero !== undefined) puesto.numero = numero;
      if (tipo !== undefined) puesto.tipo = tipo;
      if (estado !== undefined) puesto.estado = estado;
      if (descripcion !== undefined) puesto.descripcion = descripcion;

      await puesto.save();
      const io = req.app.get('io');
      if (io) io.emit('puesto_actualizado', puesto);
      res.json(puesto);
    } catch (error) {
      console.error('Error actualizando puesto:', error);
      res.status(500).json({ error: 'Error al actualizar puesto' });
    }
  },

  // DELETE /api/puestos/:id
  async eliminar(req, res) {
    try {
      const { id } = req.params;
      const puesto = await Puesto.findByPk(id);
      if (!puesto) return res.status(404).json({ error: 'Puesto no encontrado' });
      if (puesto.estado === 'ocupado') {
        return res.status(400).json({ error: 'No se puede eliminar un puesto ocupado' });
      }
      await puesto.destroy();
      res.json({ message: 'Puesto eliminado correctamente' });
    } catch (error) {
      console.error('Error eliminando puesto:', error);
      res.status(500).json({ error: 'Error al eliminar puesto' });
    }
  },
};

module.exports = puestosController;
