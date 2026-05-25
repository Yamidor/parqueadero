const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createDatabaseIfNotExists, sequelize } = require('./config/database');
const { PORT, DEFAULT_ADMIN, DEFAULT_TARIFAS, DEFAULT_CONFIG } = require('./config/config');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], methods: ['GET', 'POST'] },
});

// Make io accessible in controllers
app.set('io', io);

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/puestos', require('./routes/puestos'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/vehiculos', require('./routes/vehiculos'));
app.use('/api/facturas', require('./routes/facturas'));
app.use('/api/mensualidades', require('./routes/mensualidades'));
app.use('/api/tarifas', require('./routes/tarifas'));
app.use('/api/gastos', require('./routes/gastos'));
app.use('/api/nomina', require('./routes/nomina'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/configuracion', require('./routes/configuracion'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/whatsapp', require('./routes/whatsapp'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

// Notify mensualidades that will expire soon via WhatsApp (3 and 2 days before)
async function checkMensualidadesPorVencer() {
  try {
    const { Mensualidad, Cliente, Vehiculo, NotificacionEnviada, Configuracion } = require('./models');
    const whatsappService = require('./services/whatsapp.service');
    if (!whatsappService.isReady()) return;

    const config = await Configuracion.findOne();
    const nombreNegocio = config?.nombreNegocio || 'el parqueadero';

    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const targets = [
      { dias: 3, tipo: 'vence_3d' },
      { dias: 2, tipo: 'vence_2d' },
    ];

    for (const t of targets) {
      const fechaObjetivo = new Date(hoy);
      fechaObjetivo.setDate(fechaObjetivo.getDate() + t.dias);
      const fechaStr = fechaObjetivo.toISOString().split('T')[0];

      const mensualidades = await Mensualidad.findAll({
        where: { estado: 'activo', fechaFin: fechaStr },
        include: [
          { model: Cliente, as: 'cliente' },
          { model: Vehiculo, as: 'vehiculo' },
        ],
      });

      for (const m of mensualidades) {
        const yaEnviado = await NotificacionEnviada.findOne({
          where: { mensualidadId: m.id, tipo: t.tipo },
        });
        if (yaEnviado) continue;

        const tel = m.cliente?.telefono;
        if (!tel) continue;

        const msg =
          `🅿️ *${nombreNegocio}*\n` +
          `Hola ${m.cliente.nombre}, te recordamos que tu mensualidad ` +
          `para la placa *${m.vehiculo?.placa}* vence en *${t.dias} día${t.dias === 1 ? '' : 's'}* ` +
          `(${m.fechaFin}).\n\nRenueva con tiempo para no perder el cupo. ¡Gracias!`;

        const ok = await whatsappService.sendMessage(tel, msg);
        if (ok) {
          await NotificacionEnviada.create({ mensualidadId: m.id, tipo: t.tipo });
          console.log(`💬 Aviso ${t.tipo} enviado a ${m.cliente.nombre} (${tel})`);
        }
      }
    }
  } catch (e) {
    console.error('Error notificando mensualidades por vencer:', e.message);
  }
}

// Check expired mensualidades every hour
async function checkMensualidadesVencidas() {
  try {
    const { Mensualidad, Puesto } = require('./models');
    const { Op } = require('sequelize');
    const hoy = new Date().toISOString().split('T')[0];

    const vencidas = await Mensualidad.findAll({
      where: { estado: 'activo', fechaFin: { [Op.lt]: hoy } },
    });

    for (const m of vencidas) {
      m.estado = 'vencido';
      await m.save();
      const puesto = await Puesto.findByPk(m.puestoId);
      if (puesto) {
        // Only free spot if no other active subscription on it
        const otrasActivas = await Mensualidad.count({
          where: { puestoId: m.puestoId, estado: 'activo', id: { [Op.ne]: m.id } },
        });
        if (otrasActivas === 0) {
          puesto.estado = 'libre';
          await puesto.save();
          io.emit('puesto_actualizado', puesto);
        }
      }
      io.emit('mensualidad_vencida', m);
    }

    if (vencidas.length > 0) {
      console.log(`⏰ ${vencidas.length} mensualidad(es) marcada(s) como vencida(s)`);
    }
  } catch (error) {
    console.error('Error verificando mensualidades:', error.message);
  }
}

// Initialize
async function init() {
  try {
    // 1. Create database if not exists
    await createDatabaseIfNotExists();

    // 2. Import models (triggers associations)
    const { Usuario, Tarifa, Configuracion } = require('./models');

    // 3. Sync models — primero intenta con alter para aplicar cambios de columnas;
    //    si falla por una restricción ya inexistente (típico al iterar el schema en MySQL)
    //    cae a un sync simple que al menos crea tablas nuevas.
    try {
      await sequelize.sync({ alter: true });
      console.log('✅ Modelos sincronizados (alter)');
    } catch (e) {
      console.warn('⚠️  sync({ alter: true }) falló:', e.message);
      console.warn('   Reintentando con sync() simple (crea tablas nuevas pero no altera existentes)...');
      await sequelize.sync();
      console.log('✅ Modelos sincronizados (basic)');
    }

    // 4. Seed admin user
    const adminExists = await Usuario.findOne({ where: { email: DEFAULT_ADMIN.email } });
    if (!adminExists) {
      await Usuario.create(DEFAULT_ADMIN);
      console.log(`👤 Admin creado: ${DEFAULT_ADMIN.email} / ${DEFAULT_ADMIN.password}`);
    }

    // 5. Seed tarifas
    for (const t of DEFAULT_TARIFAS) {
      const exists = await Tarifa.findOne({ where: { tipo: t.tipo } });
      if (!exists) await Tarifa.create(t);
    }
    console.log('💰 Tarifas verificadas');

    // 6. Seed config
    const configExists = await Configuracion.findOne();
    if (!configExists) {
      await Configuracion.create(DEFAULT_CONFIG);
      console.log('⚙️  Configuración del negocio creada');
    }

    // 7. Start cron for expired mensualidades
    setInterval(checkMensualidadesVencidas, 60 * 60 * 1000); // Every hour
    checkMensualidadesVencidas(); // Run once on startup

    // 7b. Start cron for upcoming-expiry WhatsApp notices (every hour)
    setInterval(checkMensualidadesPorVencer, 60 * 60 * 1000);

    // 7c. Hook WhatsApp service to Socket.IO and resume saved session
    const whatsappService = require('./services/whatsapp.service');
    whatsappService.setIo(io);
    whatsappService.reanudarSiEstabaVinculado();

    // 8. Start server
    server.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════');
      console.log('  🅿️  ParkPro Backend - Servidor Iniciado');
      console.log('═══════════════════════════════════════════');
      console.log(`  🌐 URL: http://localhost:${PORT}`);
      console.log(`  👤 Admin: ${DEFAULT_ADMIN.email}`);
      console.log(`  🔑 Password: ${DEFAULT_ADMIN.password}`);
      console.log('═══════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error inicializando el servidor:', error);
    process.exit(1);
  }
}

init();
