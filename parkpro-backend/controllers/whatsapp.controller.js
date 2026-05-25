const whatsappService = require('../services/whatsapp.service');
const { WhatsappConfig } = require('../models');

const whatsappController = {
  async status(req, res) {
    try {
      const state = whatsappService.getStatus();
      const cfg = await WhatsappConfig.findOne();
      res.json({
        status: state.status,
        numero: state.numero || cfg?.numero || null,
        qr: state.qr,
        vinculado: state.status === 'ready' || !!cfg?.vinculado,
        vinculadoEn: cfg?.vinculadoEn || null,
      });
    } catch (e) {
      console.error('Error obteniendo estado WhatsApp:', e);
      res.status(500).json({ error: 'Error obteniendo estado' });
    }
  },

  async connect(req, res) {
    try {
      const result = await whatsappService.connect();
      res.json({ ok: true, ...result });
    } catch (e) {
      console.error('Error conectando WhatsApp:', e);
      res.status(500).json({ error: e.message || 'Error al conectar' });
    }
  },

  async disconnect(req, res) {
    try {
      await whatsappService.disconnect();
      res.json({ ok: true });
    } catch (e) {
      console.error('Error desconectando WhatsApp:', e);
      res.status(500).json({ error: 'Error al desconectar' });
    }
  },
};

module.exports = whatsappController;
