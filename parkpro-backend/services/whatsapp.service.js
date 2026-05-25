const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const { Op } = require('sequelize');
const { Boom } = require('@hapi/boom');
const pino = require('pino');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');

const { WhatsappConfig, Vehiculo, Cliente, Factura, Mensualidad, Tarifa, Configuracion } = require('../models');
const { calcularValorParqueo } = require('../utils/calculoTarifa');

const STATE = {
  sock: null,
  status: 'disconnected', // disconnected | initializing | qr | ready
  qrDataUrl: null,
  numero: null,
  io: null,
  reconnecting: false,
};

const AUTH_DIR = path.resolve(__dirname, '..', '.baileys_auth');
const logger = pino({ level: 'silent' });

function setIo(io) { STATE.io = io; }

function emit(event, payload) {
  if (STATE.io) STATE.io.emit(event, payload);
}

function normalizarTelefono(tel) {
  if (!tel) return '';
  let s = String(tel).replace(/\D+/g, '');
  if (s.startsWith('57') && s.length === 12) s = s.slice(2);
  if (s.length > 10) s = s.slice(-10);
  return s;
}

function formatearDuracion(diffMs) {
  const totalMin = Math.floor(diffMs / 60000);
  const horas = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  if (horas === 0) return `${min} minutos`;
  if (min === 0) return `${horas} hora${horas === 1 ? '' : 's'}`;
  return `${horas}h ${min}m`;
}

function formatearCOP(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(valor || 0);
}

function extraerTexto(msg) {
  const m = msg.message;
  if (!m) return '';
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    ''
  );
}

async function manejarMensaje(msg) {
  try {
    if (!msg.message || msg.key.fromMe) return;
    const jid = msg.key.remoteJid || '';
    if (jid.endsWith('@g.us') || jid.endsWith('@broadcast') || jid === 'status@broadcast') return;

    const cuerpo = extraerTexto(msg);
    const texto = cuerpo.trim().toUpperCase().replace(/\s+/g, '');
    const placaRegex = /^[A-Z]{3}-?\d{2,3}[A-Z]?$/;
    if (!placaRegex.test(texto)) return;

    const placa = texto.replace(/-/g, '');

    // El JID puede ser @lid (oculto). En Baileys ≥ 7, msg.key.remoteJidAlt trae
    // el JID alterno con @s.whatsapp.net (número real). Caemos a remoteJid si no hay alt.
    const jidReal = msg.key.remoteJidAlt || jid;
    const numeroEntrante = jidReal.endsWith('@s.whatsapp.net')
      ? normalizarTelefono(jidReal.split('@')[0])
      : null;

    const vehiculo = await Vehiculo.findOne({
      where: { placa: { [Op.or]: [placa, `${placa.slice(0, 3)}-${placa.slice(3)}`] } },
      include: [{ model: Cliente, as: 'cliente' }],
    });

    const reply = async (text) => {
      if (STATE.sock) await STATE.sock.sendMessage(jid, { text });
    };

    if (!vehiculo) {
      await reply('No encontré un vehículo con esa placa registrado.');
      return;
    }

    const telCliente = normalizarTelefono(vehiculo.cliente?.telefono);
    if (!telCliente) {
      await reply('Este vehículo no tiene un teléfono registrado para autorizar consultas.');
      return;
    }

    const autorizado = numeroEntrante && numeroEntrante === telCliente;
    if (!autorizado) {
      await reply('No estás autorizado para consultar esta placa.');
      return;
    }

    const facturaActiva = await Factura.findOne({
      where: { vehiculoId: vehiculo.id, tipoServicio: 'parqueo', estado: 'pendiente' },
    });

    if (facturaActiva) {
      const ahora = new Date();
      const diffMs = ahora - new Date(facturaActiva.horaIngreso);
      const tipoTarifa = vehiculo.tipo === 'moto' ? 'hora_moto' : 'hora_carro';
      const tarifa = await Tarifa.findOne({ where: { tipo: tipoTarifa } });
      const valorHora = tarifa ? parseFloat(tarifa.valor) : 0;
      const config = await Configuracion.findOne();
      const modoCobro = config?.modoCobro || 'hora_completa';
      const { horasACobrar, valorTotal } = calcularValorParqueo(diffMs, valorHora, modoCobro);

      const modoTxt = modoCobro === 'fraccion' ? 'por fracción' : 'hora completa';
      await reply(
        `🅿️ *Consulta de parqueo*\n` +
        `Placa: ${vehiculo.placa}\n` +
        `Tiempo transcurrido: ${formatearDuracion(diffMs)}\n` +
        `Tarifa: ${formatearCOP(valorHora)}/h (${modoTxt})\n` +
        `Horas a cobrar: ${horasACobrar}\n` +
        `💰 *Valor actual: ${formatearCOP(valorTotal)}*`
      );
      return;
    }

    const mensualidad = await Mensualidad.findOne({
      where: { vehiculoId: vehiculo.id, estado: 'activo' },
      order: [['fechaFin', 'DESC']],
    });

    if (mensualidad) {
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const fin = new Date(mensualidad.fechaFin);
      const diasRestantes = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
      await reply(
        `📅 *Mensualidad activa*\n` +
        `Placa: ${vehiculo.placa}\n` +
        `Vence: ${mensualidad.fechaFin}\n` +
        `Días restantes: ${diasRestantes}`
      );
      return;
    }

    await reply(`No tienes un parqueo activo ni mensualidad para la placa ${vehiculo.placa}.`);
  } catch (err) {
    console.error('Error procesando mensaje WhatsApp:', err.message);
  }
}

async function connect() {
  if (STATE.status === 'ready' || STATE.status === 'initializing') {
    return { status: STATE.status, qr: STATE.qrDataUrl, numero: STATE.numero };
  }

  STATE.status = 'initializing';
  STATE.qrDataUrl = null;
  emit('whatsapp_status', { status: STATE.status });

  try {
    if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      auth: state,
      version,
      logger,
      printQRInTerminal: false,
      browser: ['ParkPro', 'Chrome', '1.0'],
      syncFullHistory: false,
      markOnlineOnConnect: true,
    });

    STATE.sock = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          console.log('\n──────────────────────────────────────────');
          console.log('💬 ESCANEA ESTE QR CON WHATSAPP DEL CELULAR');
          console.log('──────────────────────────────────────────');
          qrcodeTerminal.generate(qr, { small: true });
          console.log('──────────────────────────────────────────\n');

          STATE.qrDataUrl = await QRCode.toDataURL(qr);
          STATE.status = 'qr';
          emit('whatsapp_qr', { qr: STATE.qrDataUrl });
          emit('whatsapp_status', { status: STATE.status });
        } catch (e) { console.error('Error generando QR:', e); }
      }

      if (connection === 'open') {
        STATE.status = 'ready';
        STATE.qrDataUrl = null;
        STATE.reconnecting = false;
        const id = sock.user?.id || '';
        STATE.numero = id.split(':')[0].split('@')[0] || null;
        let cfg = await WhatsappConfig.findOne();
        if (!cfg) cfg = await WhatsappConfig.create({});
        await cfg.update({ vinculado: true, numero: STATE.numero, vinculadoEn: new Date() });
        emit('whatsapp_ready', { numero: STATE.numero });
        emit('whatsapp_status', { status: STATE.status, numero: STATE.numero });
        console.log(`💬 WhatsApp listo (${STATE.numero})`);
      }

      if (connection === 'close') {
        const code = lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output?.statusCode
          : lastDisconnect?.error?.output?.statusCode;
        const loggedOut = code === DisconnectReason.loggedOut;
        console.log(`💬 WhatsApp cerrado (code=${code}, loggedOut=${loggedOut})`);

        STATE.sock = null;
        STATE.status = 'disconnected';
        STATE.qrDataUrl = null;

        if (loggedOut) {
          STATE.numero = null;
          const cfg = await WhatsappConfig.findOne();
          if (cfg) await cfg.update({ vinculado: false, numero: null });
          try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch (e) { /* ignore */ }
          emit('whatsapp_disconnected', { reason: 'logged_out' });
          emit('whatsapp_status', { status: STATE.status });
        } else {
          // Intento de reconexión automática (a menos que sea un disconnect manual)
          if (!STATE.reconnecting) {
            STATE.reconnecting = true;
            emit('whatsapp_status', { status: STATE.status });
            setTimeout(() => connect().catch((e) => console.error('Reconexión falló:', e.message)), 3000);
          }
        }
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const m of messages || []) {
        await manejarMensaje(m);
      }
    });

    return { status: STATE.status };
  } catch (err) {
    console.error('Error inicializando WhatsApp:', err.message);
    STATE.status = 'disconnected';
    emit('whatsapp_status', { status: STATE.status, error: err.message });
    throw err;
  }
}

async function disconnect() {
  try {
    if (STATE.sock) {
      try { await STATE.sock.logout(); } catch (e) { /* ignore */ }
      try { STATE.sock.end?.(); } catch (e) { /* ignore */ }
    }
  } finally {
    STATE.sock = null;
    STATE.status = 'disconnected';
    STATE.numero = null;
    STATE.qrDataUrl = null;
    STATE.reconnecting = false;
    try {
      if (fs.existsSync(AUTH_DIR)) fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    } catch (e) { console.warn('No se pudo eliminar la sesión local:', e.message); }
    const cfg = await WhatsappConfig.findOne();
    if (cfg) await cfg.update({ vinculado: false, numero: null });
    emit('whatsapp_status', { status: STATE.status });
  }
}

function getStatus() {
  return { status: STATE.status, numero: STATE.numero, qr: STATE.qrDataUrl };
}

function isReady() {
  return STATE.status === 'ready' && !!STATE.sock;
}

async function sendMessage(numeroDestino, texto) {
  if (!isReady()) return false;
  const num = normalizarTelefono(numeroDestino);
  if (!num) return false;
  const jid = `57${num}@s.whatsapp.net`;
  try {
    await STATE.sock.sendMessage(jid, { text: texto });
    return true;
  } catch (err) {
    console.error('Error enviando mensaje WhatsApp:', err.message);
    return false;
  }
}

async function reanudarSiEstabaVinculado() {
  try {
    const cfg = await WhatsappConfig.findOne();
    if (cfg?.vinculado && fs.existsSync(AUTH_DIR)) {
      console.log('💬 Reanudando sesión WhatsApp guardada...');
      await connect();
    }
  } catch (e) { console.warn('No se pudo reanudar WhatsApp:', e.message); }
}

module.exports = {
  setIo,
  connect,
  disconnect,
  getStatus,
  isReady,
  sendMessage,
  reanudarSiEstabaVinculado,
  normalizarTelefono,
};
