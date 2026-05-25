const { Factura, Vehiculo, Cliente, Puesto, Tarifa, Mensualidad, Configuracion } = require('../models');
const { generarCodigoFactura } = require('../utils/codigoFactura');
const { generateQR } = require('../utils/qrGenerator');
const { calcularValorParqueo } = require('../utils/calculoTarifa');
const whatsappService = require('../services/whatsapp.service');
const { Op } = require('sequelize');

async function getModoCobro() {
  const config = await Configuracion.findOne();
  return config?.modoCobro || 'hora_completa';
}

const facturasController = {
  // POST /api/facturas/entrada — Register vehicle entry (hourly parking)
  async registrarEntrada(req, res) {
    try {
      const { vehiculoId, puestoId, clienteId } = req.body;
      const cajeroId = req.user.id;

      // Validate vehicle
      const vehiculo = await Vehiculo.findByPk(vehiculoId, {
        include: [{ model: Cliente, as: 'cliente' }],
      });
      if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' });

      // Validate parking spot
      const puesto = await Puesto.findByPk(puestoId);
      if (!puesto) return res.status(404).json({ error: 'Puesto no encontrado' });
      if (puesto.estado === 'ocupado') {
        return res.status(400).json({ error: 'El puesto ya está ocupado' });
      }

      // Check if vehicle already has an active (pending) invoice
      const facturaActiva = await Factura.findOne({
        where: {
          vehiculoId,
          tipoServicio: 'parqueo',
          estado: 'pendiente',
        },
      });
      if (facturaActiva) {
        return res.status(400).json({
          error: 'Este vehículo ya tiene un parqueo activo',
          factura: facturaActiva,
        });
      }

      // Get hourly rate
      const tipoTarifa = vehiculo.tipo === 'moto' ? 'hora_moto' : 'hora_carro';
      const tarifa = await Tarifa.findOne({ where: { tipo: tipoTarifa } });

      // Generate invoice code and QR
      const codigo = await generarCodigoFactura('parqueo');
      const codigoQR = await generateQR(codigo);

      // Create invoice
      const factura = await Factura.create({
        codigo,
        vehiculoId,
        puestoId,
        clienteId: clienteId || vehiculo.clienteId,
        cajeroId,
        tipoServicio: 'parqueo',
        estado: 'pendiente',
        horaIngreso: new Date(),
        valorTotal: 0,
        codigoQR,
      });

      // Mark spot as occupied
      puesto.estado = 'ocupado';
      await puesto.save();

      // Emit WebSocket events
      const io = req.app.get('io');
      if (io) {
        io.emit('puesto_actualizado', puesto);
        io.emit('nueva_factura', factura);
      }

      // Fetch complete invoice with associations
      const facturaCompleta = await Factura.findByPk(factura.id, {
        include: [
          { model: Vehiculo, as: 'vehiculo', include: [{ model: Cliente, as: 'cliente' }] },
          { model: Puesto, as: 'puesto' },
          { model: Cliente, as: 'cliente' },
        ],
      });

      // Mensaje de bienvenida por WhatsApp (no bloqueante)
      if (whatsappService.isReady() && vehiculo.cliente?.telefono) {
        const config = await Configuracion.findOne();
        const nombreNegocio = config?.nombreNegocio || 'ParkPro';
        const horaTxt = new Date(factura.horaIngreso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        const mensaje =
          `🅿️ *${nombreNegocio}*\n` +
          `Hola ${vehiculo.cliente.nombre}, gracias por elegirnos.\n` +
          `Tu vehículo *${vehiculo.placa}* ingresó a las ${horaTxt}.\n\n` +
          `Para consultar tu cuenta actual envía tu placa a este chat.`;
        whatsappService.sendMessage(vehiculo.cliente.telefono, mensaje).catch((e) =>
          console.error('Error enviando bienvenida WhatsApp:', e.message)
        );
      }

      res.status(201).json({
        factura: facturaCompleta,
        tarifa: tarifa ? parseFloat(tarifa.valor) : 0,
      });
    } catch (error) {
      console.error('Error registrando entrada:', error);
      res.status(500).json({ error: 'Error al registrar entrada' });
    }
  },

  // POST /api/facturas/salida — Register vehicle exit (payment)
  async registrarSalida(req, res) {
    try {
      const { facturaId, metodoPago } = req.body;

      const factura = await Factura.findByPk(facturaId, {
        include: [
          { model: Vehiculo, as: 'vehiculo', include: [{ model: Cliente, as: 'cliente' }] },
          { model: Puesto, as: 'puesto' },
          { model: Cliente, as: 'cliente' },
        ],
      });

      if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
      if (factura.estado === 'pagado') {
        return res.status(400).json({
          error: 'Este recibo ya fue cancelado',
          fechaPago: factura.fechaPago,
        });
      }

      // Calculate hours and total
      const ahora = new Date();
      const ingreso = new Date(factura.horaIngreso);
      const diffMs = ahora - ingreso;
      const diffHoras = diffMs / (1000 * 60 * 60);

      // Get rate + billing mode
      const tipoTarifa = factura.vehiculo.tipo === 'moto' ? 'hora_moto' : 'hora_carro';
      const tarifa = await Tarifa.findOne({ where: { tipo: tipoTarifa } });
      const valorHora = tarifa ? parseFloat(tarifa.valor) : 0;
      const modoCobro = await getModoCobro();
      const { horasACobrar: horasRedondeadas, valorTotal } = calcularValorParqueo(diffMs, valorHora, modoCobro);

      // Update invoice
      factura.horaSalida = ahora;
      factura.totalHoras = parseFloat(diffHoras.toFixed(2));
      factura.valorTotal = valorTotal;
      factura.estado = 'pagado';
      factura.fechaPago = ahora;
      factura.metodoPago = metodoPago || 'efectivo';
      await factura.save();

      // Free up parking spot
      if (factura.puesto) {
        // Check if spot has an active monthly subscription
        const mensualidadActiva = await Mensualidad.findOne({
          where: {
            puestoId: factura.puestoId,
            estado: 'activo',
            vehiculoId: { [Op.ne]: factura.vehiculoId },
          },
        });
        if (!mensualidadActiva) {
          factura.puesto.estado = 'libre';
          await factura.puesto.save();
          const io = req.app.get('io');
          if (io) {
            io.emit('puesto_actualizado', factura.puesto);
            io.emit('factura_pagada', factura);
          }
        }
      }

      // Reload with associations
      await factura.reload({
        include: [
          { model: Vehiculo, as: 'vehiculo', include: [{ model: Cliente, as: 'cliente' }] },
          { model: Puesto, as: 'puesto' },
          { model: Cliente, as: 'cliente' },
        ],
      });

      res.json({
        factura,
        horasCalculadas: horasRedondeadas,
        valorHora,
      });
    } catch (error) {
      console.error('Error registrando salida:', error);
      res.status(500).json({ error: 'Error al registrar salida' });
    }
  },

  // POST /api/facturas/lavado — Register wash service
  async registrarLavado(req, res) {
    try {
      const { vehiculoId, clienteId, subtipo } = req.body;
      const cajeroId = req.user.id;

      if (!subtipo || !['normal', 'full'].includes(subtipo)) {
        return res.status(400).json({ error: 'Debe indicar el tipo de lavado (normal o full)' });
      }

      const vehiculo = await Vehiculo.findByPk(vehiculoId, {
        include: [{ model: Cliente, as: 'cliente' }],
      });
      if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' });

      // Get wash rate
      const tipoTarifa = `lavado_${vehiculo.tipo}_${subtipo}`;
      const tarifa = await Tarifa.findOne({ where: { tipo: tipoTarifa } });
      const valorTotal = tarifa ? parseFloat(tarifa.valor) : 0;

      // Generate code and QR
      const codigo = await generarCodigoFactura('lavado');
      const codigoQR = await generateQR(codigo);

      const factura = await Factura.create({
        codigo,
        vehiculoId,
        puestoId: null,
        clienteId: clienteId || vehiculo.clienteId,
        cajeroId,
        tipoServicio: 'lavado',
        subtipoLavado: subtipo,
        estado: 'pagado',
        horaIngreso: new Date(),
        horaSalida: new Date(),
        valorTotal,
        fechaPago: new Date(),
        metodoPago: 'efectivo',
        codigoQR,
      });

      const facturaCompleta = await Factura.findByPk(factura.id, {
        include: [
          { model: Vehiculo, as: 'vehiculo', include: [{ model: Cliente, as: 'cliente' }] },
          { model: Cliente, as: 'cliente' },
        ],
      });

      const io = req.app.get('io');
      if (io) io.emit('nueva_factura', facturaCompleta);

      res.status(201).json({ factura: facturaCompleta });
    } catch (error) {
      console.error('Error registrando lavado:', error);
      res.status(500).json({ error: 'Error al registrar lavado' });
    }
  },

  // GET /api/facturas/buscar?codigo=X&placa=Y
  async buscar(req, res) {
    try {
      const { codigo, placa } = req.query;
      let factura = null;

      if (codigo) {
        factura = await Factura.findOne({
          where: { codigo },
          include: [
            { model: Vehiculo, as: 'vehiculo', include: [{ model: Cliente, as: 'cliente' }] },
            { model: Puesto, as: 'puesto' },
            { model: Cliente, as: 'cliente' },
          ],
        });
      } else if (placa) {
        const vehiculo = await Vehiculo.findOne({ where: { placa: placa.toUpperCase() } });
        if (vehiculo) {
          factura = await Factura.findOne({
            where: {
              vehiculoId: vehiculo.id,
              tipoServicio: 'parqueo',
              estado: 'pendiente',
            },
            include: [
              { model: Vehiculo, as: 'vehiculo', include: [{ model: Cliente, as: 'cliente' }] },
              { model: Puesto, as: 'puesto' },
              { model: Cliente, as: 'cliente' },
            ],
          });
        }
      }

      if (!factura) {
        return res.status(404).json({ error: 'Factura no encontrada' });
      }

      // If pending, calculate current charges
      if (factura.estado === 'pendiente' && factura.tipoServicio === 'parqueo') {
        const ahora = new Date();
        const ingreso = new Date(factura.horaIngreso);
        const diffMs = ahora - ingreso;
        const diffHoras = diffMs / (1000 * 60 * 60);

        const tipoTarifa = factura.vehiculo.tipo === 'moto' ? 'hora_moto' : 'hora_carro';
        const tarifa = await Tarifa.findOne({ where: { tipo: tipoTarifa } });
        const valorHora = tarifa ? parseFloat(tarifa.valor) : 0;
        const modoCobro = await getModoCobro();
        const { horasACobrar, valorTotal } = calcularValorParqueo(diffMs, valorHora, modoCobro);

        return res.json({
          factura,
          horasTranscurridas: parseFloat(diffHoras.toFixed(2)),
          horasACobrar,
          valorHora,
          valorEstimado: valorTotal,
          modoCobro,
        });
      }

      res.json({ factura });
    } catch (error) {
      console.error('Error buscando factura:', error);
      res.status(500).json({ error: 'Error al buscar factura' });
    }
  },

  // GET /api/facturas — List invoices
  async listar(req, res) {
    try {
      const { fecha, estado, tipoServicio, cajeroId } = req.query;
      let where = {};

      if (fecha) {
        const inicio = new Date(fecha);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(fecha);
        fin.setHours(23, 59, 59, 999);
        where.createdAt = { [Op.between]: [inicio, fin] };
      }
      if (estado) where.estado = estado;
      if (tipoServicio) where.tipoServicio = tipoServicio;
      if (cajeroId) where.cajeroId = cajeroId;

      const facturas = await Factura.findAll({
        where,
        include: [
          { model: Vehiculo, as: 'vehiculo' },
          { model: Puesto, as: 'puesto' },
          { model: Cliente, as: 'cliente' },
        ],
        order: [['createdAt', 'DESC']],
        limit: 100,
      });
      res.json(facturas);
    } catch (error) {
      res.status(500).json({ error: 'Error al listar facturas' });
    }
  },

  // GET /api/facturas/:id
  async obtener(req, res) {
    try {
      const factura = await Factura.findByPk(req.params.id, {
        include: [
          { model: Vehiculo, as: 'vehiculo', include: [{ model: Cliente, as: 'cliente' }] },
          { model: Puesto, as: 'puesto' },
          { model: Cliente, as: 'cliente' },
        ],
      });
      if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
      res.json(factura);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener factura' });
    }
  },
};

module.exports = facturasController;
