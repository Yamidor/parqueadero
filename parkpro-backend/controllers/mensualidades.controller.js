const { Mensualidad, Factura, Vehiculo, Cliente, Puesto, Tarifa, Configuracion } = require('../models');
const { generarCodigoFactura } = require('../utils/codigoFactura');
const { generateQR } = require('../utils/qrGenerator');
const whatsappService = require('../services/whatsapp.service');
const { Op } = require('sequelize');

// Envía un mensaje de confirmación de mensualidad por WhatsApp (no bloqueante).
async function enviarConfirmacionWhatsapp(mensualidad, vehiculo, puesto, valorTotal, tipo) {
  try {
    if (!whatsappService.isReady() || !vehiculo?.cliente?.telefono) return;
    const config = await Configuracion.findOne();
    const nombreNegocio = config?.nombreNegocio || 'ParkPro';
    const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);
    const accion = tipo === 'renovar' ? 'renovada' : 'activa';
    const mensaje =
      `🅿️ *${nombreNegocio}*\n` +
      `Hola ${vehiculo.cliente.nombre}, tu mensualidad fue *${accion}* correctamente.\n\n` +
      `🚗 Placa: *${vehiculo.placa}*\n` +
      `🅿️ Puesto: #${puesto?.numero ?? '-'}\n` +
      `📅 Inicio: ${mensualidad.fechaInicio}\n` +
      `🔚 Vence: *${mensualidad.fechaFin}*\n` +
      `💰 Valor: ${fmt(valorTotal)}\n\n` +
      `Para consultar los días restantes, envía tu placa por este chat. ¡Gracias!`;
    whatsappService.sendMessage(vehiculo.cliente.telefono, mensaje).catch(() => {});
  } catch (e) { console.error('Error enviando confirmación mensualidad:', e.message); }
}

const mensualidadesController = {
  // POST /api/mensualidades — Register new monthly subscription
  async registrar(req, res) {
    try {
      const { vehiculoId, puestoId, clienteId } = req.body;
      const cajeroId = req.user.id;

      const vehiculo = await Vehiculo.findByPk(vehiculoId, {
        include: [{ model: Cliente, as: 'cliente' }],
      });
      if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' });

      const puesto = await Puesto.findByPk(puestoId);
      if (!puesto) return res.status(404).json({ error: 'Puesto no encontrado' });

      // Get monthly rate
      const tipoTarifa = vehiculo.tipo === 'moto' ? 'mensualidad_moto' : 'mensualidad_carro';
      const tarifa = await Tarifa.findOne({ where: { tipo: tipoTarifa } });
      const valorTotal = tarifa ? parseFloat(tarifa.valor) : 0;

      // Calculate dates
      const hoy = new Date();
      const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const fechaFin = new Date(fechaInicio);
      fechaFin.setMonth(fechaFin.getMonth() + 1);
      // Handle months with different days (e.g., Jan 31 → Feb 28)
      if (fechaFin.getDate() !== fechaInicio.getDate()) {
        fechaFin.setDate(0); // Last day of previous month
      }

      // Generate invoice
      const codigo = await generarCodigoFactura('mensualidad');
      const codigoQR = await generateQR(codigo);

      const factura = await Factura.create({
        codigo,
        vehiculoId,
        puestoId,
        clienteId: clienteId || vehiculo.clienteId,
        cajeroId,
        tipoServicio: 'mensualidad',
        estado: 'pagado',
        horaIngreso: new Date(),
        valorTotal,
        fechaPago: new Date(),
        metodoPago: 'efectivo',
        codigoQR,
      });

      // Create mensualidad record
      const mensualidad = await Mensualidad.create({
        facturaId: factura.id,
        clienteId: clienteId || vehiculo.clienteId,
        vehiculoId,
        puestoId,
        fechaInicio: fechaInicio.toISOString().split('T')[0],
        fechaFin: fechaFin.toISOString().split('T')[0],
        estado: 'activo',
      });

      // Mark spot as occupied
      puesto.estado = 'ocupado';
      await puesto.save();

      const io = req.app.get('io');
      if (io) {
        io.emit('puesto_actualizado', puesto);
        io.emit('nueva_factura', factura);
      }

      // Fetch complete data
      const mensualidadCompleta = await Mensualidad.findByPk(mensualidad.id, {
        include: [
          { model: Factura, as: 'factura' },
          { model: Vehiculo, as: 'vehiculo', include: [{ model: Cliente, as: 'cliente' }] },
          { model: Puesto, as: 'puesto' },
          { model: Cliente, as: 'cliente' },
        ],
      });

      // WhatsApp de confirmación al cliente
      enviarConfirmacionWhatsapp(mensualidad, vehiculo, puesto, valorTotal, 'crear');

      res.status(201).json({ mensualidad: mensualidadCompleta, factura });
    } catch (error) {
      console.error('Error registrando mensualidad:', error);
      res.status(500).json({ error: 'Error al registrar mensualidad' });
    }
  },

  // POST /api/mensualidades/renovar/:id — Renew monthly subscription
  async renovar(req, res) {
    try {
      const { id } = req.params;
      const cajeroId = req.user.id;

      const mensualidadAnterior = await Mensualidad.findByPk(id, {
        include: [
          { model: Vehiculo, as: 'vehiculo', include: [{ model: Cliente, as: 'cliente' }] },
          { model: Puesto, as: 'puesto' },
        ],
      });

      if (!mensualidadAnterior) {
        return res.status(404).json({ error: 'Mensualidad no encontrada' });
      }

      // Get rate
      const tipoTarifa = mensualidadAnterior.vehiculo.tipo === 'moto' ? 'mensualidad_moto' : 'mensualidad_carro';
      const tarifa = await Tarifa.findOne({ where: { tipo: tipoTarifa } });
      const valorTotal = tarifa ? parseFloat(tarifa.valor) : 0;

      // New dates: start from previous end date if not expired, otherwise from today
      let fechaInicio;
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const finAnterior = new Date(mensualidadAnterior.fechaFin);

      if (finAnterior >= hoy) {
        // Renewing before expiration: continue from previous end
        fechaInicio = finAnterior;
      } else {
        // Expired: start from today
        fechaInicio = hoy;
      }

      const fechaFin = new Date(fechaInicio);
      fechaFin.setMonth(fechaFin.getMonth() + 1);
      if (fechaFin.getDate() !== fechaInicio.getDate()) {
        fechaFin.setDate(0);
      }

      // Mark old subscription as renewed
      mensualidadAnterior.estado = 'renovado';
      await mensualidadAnterior.save();

      // Generate new invoice
      const codigo = await generarCodigoFactura('mensualidad');
      const codigoQR = await generateQR(codigo);

      const factura = await Factura.create({
        codigo,
        vehiculoId: mensualidadAnterior.vehiculoId,
        puestoId: mensualidadAnterior.puestoId,
        clienteId: mensualidadAnterior.clienteId,
        cajeroId,
        tipoServicio: 'mensualidad',
        estado: 'pagado',
        horaIngreso: new Date(),
        valorTotal,
        fechaPago: new Date(),
        metodoPago: 'efectivo',
        codigoQR,
      });

      const mensualidad = await Mensualidad.create({
        facturaId: factura.id,
        clienteId: mensualidadAnterior.clienteId,
        vehiculoId: mensualidadAnterior.vehiculoId,
        puestoId: mensualidadAnterior.puestoId,
        fechaInicio: fechaInicio.toISOString().split('T')[0],
        fechaFin: fechaFin.toISOString().split('T')[0],
        estado: 'activo',
      });

      // Keep spot occupied
      const puesto = await Puesto.findByPk(mensualidadAnterior.puestoId);
      if (puesto) {
        puesto.estado = 'ocupado';
        await puesto.save();
        const io = req.app.get('io');
        if (io) io.emit('puesto_actualizado', puesto);
      }

      const mensualidadCompleta = await Mensualidad.findByPk(mensualidad.id, {
        include: [
          { model: Factura, as: 'factura' },
          { model: Vehiculo, as: 'vehiculo', include: [{ model: Cliente, as: 'cliente' }] },
          { model: Puesto, as: 'puesto' },
          { model: Cliente, as: 'cliente' },
        ],
      });

      // WhatsApp de confirmación de renovación
      enviarConfirmacionWhatsapp(mensualidad, mensualidadAnterior.vehiculo, puesto, valorTotal, 'renovar');

      res.status(201).json({ mensualidad: mensualidadCompleta, factura });
    } catch (error) {
      console.error('Error renovando mensualidad:', error);
      res.status(500).json({ error: 'Error al renovar mensualidad' });
    }
  },

  // GET /api/mensualidades/verificar/:placa
  async verificar(req, res) {
    try {
      const { placa } = req.params;
      const vehiculo = await Vehiculo.findOne({
        where: { placa: placa.toUpperCase() },
        include: [{ model: Cliente, as: 'cliente' }],
      });

      if (!vehiculo) {
        return res.status(404).json({ error: 'Vehículo no encontrado', found: false });
      }

      const mensualidadActiva = await Mensualidad.findOne({
        where: {
          vehiculoId: vehiculo.id,
          estado: 'activo',
        },
        include: [
          { model: Puesto, as: 'puesto' },
          { model: Factura, as: 'factura' },
        ],
      });

      if (!mensualidadActiva) {
        return res.json({
          vehiculo,
          mensualidad: null,
          mensaje: 'No tiene mensualidad activa. Se cobrará como parqueo por horas.',
        });
      }

      // Check if expired
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaFin = new Date(mensualidadActiva.fechaFin);

      if (hoy > fechaFin) {
        // Expired
        mensualidadActiva.estado = 'vencido';
        await mensualidadActiva.save();

        // Free the spot
        const puesto = await Puesto.findByPk(mensualidadActiva.puestoId);
        if (puesto) {
          puesto.estado = 'libre';
          await puesto.save();
          const io = req.app.get('io');
          if (io) {
            io.emit('puesto_actualizado', puesto);
            io.emit('mensualidad_vencida', mensualidadActiva);
          }
        }

        return res.json({
          vehiculo,
          mensualidad: mensualidadActiva,
          vencida: true,
          mensaje: `Mensualidad vencida el ${mensualidadActiva.fechaFin}. El puesto ha quedado libre.`,
        });
      }

      // Active
      const diffDias = Math.ceil((fechaFin - hoy) / (1000 * 60 * 60 * 24));
      return res.json({
        vehiculo,
        mensualidad: mensualidadActiva,
        vencida: false,
        diasRestantes: diffDias,
        mensaje: `Mensualidad vigente. Le quedan ${diffDias} días (vence el ${mensualidadActiva.fechaFin})`,
      });
    } catch (error) {
      console.error('Error verificando mensualidad:', error);
      res.status(500).json({ error: 'Error al verificar mensualidad' });
    }
  },

  // GET /api/mensualidades
  async listar(req, res) {
    try {
      const mensualidades = await Mensualidad.findAll({
        include: [
          { model: Vehiculo, as: 'vehiculo', include: [{ model: Cliente, as: 'cliente' }] },
          { model: Puesto, as: 'puesto' },
          { model: Factura, as: 'factura' },
          { model: Cliente, as: 'cliente' },
        ],
        order: [['createdAt', 'DESC']],
      });
      res.json(mensualidades);
    } catch (error) {
      res.status(500).json({ error: 'Error al listar mensualidades' });
    }
  },
};

module.exports = mensualidadesController;
