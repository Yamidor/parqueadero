import { useState, useEffect } from 'react';
import api from '../services/api';
import socket from '../services/socket';

const STATUS_LABEL = {
  disconnected: 'No vinculado',
  initializing: 'Iniciando...',
  qr: 'Esperando escaneo del código QR',
  ready: 'Vinculado',
};

const STATUS_COLOR = {
  disconnected: 'var(--text-muted)',
  initializing: 'var(--neon-yellow)',
  qr: 'var(--neon-orange)',
  ready: 'var(--free-color)',
};

export default function Whatsapp() {
  const [status, setStatus] = useState('disconnected');
  const [numero, setNumero] = useState(null);
  const [vinculadoEn, setVinculadoEn] = useState(null);
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cargarEstado = async () => {
    try {
      const res = await api.get('/whatsapp/status');
      setStatus(res.data.status);
      setNumero(res.data.numero);
      setVinculadoEn(res.data.vinculadoEn);
      setQr(res.data.qr);
    } catch (e) {
      console.error('Error obteniendo estado WhatsApp:', e);
    }
  };

  useEffect(() => {
    cargarEstado();

    if (!socket.connected) socket.connect();

    const onQr = ({ qr }) => { setQr(qr); setStatus('qr'); };
    const onReady = ({ numero }) => { setStatus('ready'); setNumero(numero); setQr(null); };
    const onDisconnected = () => { setStatus('disconnected'); setNumero(null); setQr(null); };
    const onStatus = (data) => {
      setStatus(data.status);
      if (data.numero !== undefined) setNumero(data.numero);
      if (data.error) setError(data.error);
    };

    socket.on('whatsapp_qr', onQr);
    socket.on('whatsapp_ready', onReady);
    socket.on('whatsapp_disconnected', onDisconnected);
    socket.on('whatsapp_status', onStatus);

    return () => {
      socket.off('whatsapp_qr', onQr);
      socket.off('whatsapp_ready', onReady);
      socket.off('whatsapp_disconnected', onDisconnected);
      socket.off('whatsapp_status', onStatus);
    };
  }, []);

  const conectar = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/whatsapp/connect');
    } catch (e) {
      setError(e.response?.data?.error || 'Error al iniciar conexión');
    } finally {
      setLoading(false);
    }
  };

  const desconectar = async () => {
    if (!confirm('¿Seguro que quieres desvincular WhatsApp? Tendrás que volver a escanear el QR.')) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/whatsapp/disconnect');
      setStatus('disconnected');
      setNumero(null);
      setQr(null);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al desvincular');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="section-header">
        <div>
          <h1 className="section-title">💬 WhatsApp del Parqueadero</h1>
          <p className="section-subtitle">Vincula un número para enviar bienvenidas y avisos de mensualidad</p>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 14, height: 14, borderRadius: '50%',
            background: STATUS_COLOR[status] || 'var(--text-muted)',
            boxShadow: status === 'ready' ? '0 0 10px var(--free-color)' : 'none',
          }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Estado
            </div>
            <div style={{ fontWeight: 700, color: STATUS_COLOR[status] }}>
              {STATUS_LABEL[status] || status}
            </div>
          </div>
        </div>

        {status === 'ready' && numero && (
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Número vinculado</span>
              <span className="mono" style={{ color: 'var(--neon-orange)', fontWeight: 700 }}>+{numero}</span>
            </div>
            {vinculadoEn && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vinculado el</span>
                <span>{new Date(vinculadoEn).toLocaleString('es-CO')}</span>
              </div>
            )}
            <button className="btn btn-danger" style={{ marginTop: 12 }} disabled={loading} onClick={desconectar}>
              {loading ? '...' : '🔌 Desvincular WhatsApp'}
            </button>
          </div>
        )}

        {status !== 'ready' && status !== 'qr' && status !== 'initializing' && (
          <div>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: '0.88rem' }}>
              Conecta un WhatsApp para enviar el mensaje de bienvenida cuando entren los vehículos,
              responder consultas por placa y avisar a los mensualistas 3 y 2 días antes del vencimiento.
            </p>
            <button className="btn btn-primary btn-lg" disabled={loading} onClick={conectar}>
              {loading ? 'Iniciando...' : '🔗 Vincular WhatsApp'}
            </button>
          </div>
        )}

        {(status === 'initializing' || (status === 'qr' && !qr)) && (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            Generando código QR...
          </div>
        )}

        {status === 'qr' && qr && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#fff', padding: 14, display: 'inline-block', borderRadius: 'var(--radius-md)', marginBottom: 12 }}>
              <img src={qr} alt="QR WhatsApp" style={{ width: 280, height: 280, display: 'block' }} />
            </div>
            <ol style={{ textAlign: 'left', maxWidth: 420, margin: '12px auto', color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.7 }}>
              <li>Abre WhatsApp en tu celular.</li>
              <li>Toca <b>Menú</b> (⋮) o <b>Configuración</b> → <b>Dispositivos vinculados</b>.</li>
              <li>Toca <b>Vincular un dispositivo</b>.</li>
              <li>Escanea este código QR.</li>
            </ol>
            <button className="btn btn-secondary" disabled={loading} onClick={desconectar}>Cancelar</button>
          </div>
        )}
      </div>

      <div className="glass-card" style={{ padding: 18 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>
          ¿Qué hace este WhatsApp?
        </div>
        <ul style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.8, paddingLeft: 20 }}>
          <li>Envía un mensaje de bienvenida automático cuando un vehículo registrado entra.</li>
          <li>Responde a consultas por placa con el tiempo transcurrido y el valor a cobrar (solo si el número del cliente coincide con el registrado).</li>
          <li>Notifica a los mensualistas 3 y 2 días antes del vencimiento.</li>
        </ul>
      </div>
    </div>
  );
}
