const { Configuracion } = require('../models');

const configuracionController = {
  async obtener(req, res) {
    try {
      let config = await Configuracion.findOne();
      if (!config) {
        config = await Configuracion.create({
          nombreNegocio: 'ParkPro', nit: '', direccion: '', telefono: '',
        });
      }
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener configuración' });
    }
  },
  async actualizar(req, res) {
    try {
      let config = await Configuracion.findOne();
      if (!config) {
        config = await Configuracion.create(req.body);
      } else {
        await config.update(req.body);
      }
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar configuración' });
    }
  },
};

module.exports = configuracionController;
