import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Configuracion() {
  const [config, setConfig] = useState({ nombreNegocio: '', nit: '', direccion: '', telefono: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/configuracion').then((res) => setConfig(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put('/configuracion', config);
      setSuccess('Configuración guardada correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="section-header">
        <div>
          <h1 className="section-title">⚙️ Configuración del Negocio</h1>
          <p className="section-subtitle">Datos que aparecerán en todos los recibos</p>
        </div>
      </div>

      {success && <div className="alert alert-success">✅ {success}</div>}
      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <div className="glass-card" style={{ padding: 28, maxWidth: 600 }}>
        <form onSubmit={guardar}>
          {[
            ['Nombre del Negocio *', 'nombreNegocio', 'text', true, 'ParkPro Parqueadero'],
            ['NIT / RUT', 'nit', 'text', false, '900.123.456-7'],
            ['Dirección', 'direccion', 'text', false, 'Calle 1 # 2-3'],
            ['Teléfono', 'telefono', 'text', false, '300 123 4567'],
          ].map(([label, key, type, req, placeholder]) => (
            <div className="form-group" key={key}>
              <label>{label}</label>
              <input
                className="form-control"
                type={type}
                value={config[key] || ''}
                placeholder={placeholder}
                onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                required={req}
              />
            </div>
          ))}

          <div className="form-group">
            <label>⏰ Hora del aviso de mensualidad (WhatsApp 1 día antes)</label>
            <select
              className="form-control"
              value={config.horaAvisoMensualidad ?? 9}
              onChange={(e) => setConfig({ ...config, horaAvisoMensualidad: parseInt(e.target.value, 10) })}
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}:00 {h < 12 ? 'AM' : 'PM'}</option>
              ))}
            </select>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              A esta hora se envía cada día el aviso "tu mensualidad vence mañana" a los clientes con vencimiento al día siguiente. A las 6:00 PM se libera automáticamente el puesto de los que vencieron sin renovar.
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              {saving ? 'Guardando...' : '💾 Guardar Configuración'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>Vista previa en recibos:</div>
          <div style={{ fontFamily: 'var(--font-mono)', lineHeight: 2 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{config.nombreNegocio || 'Nombre del negocio'}</div>
            {config.nit && <div>NIT: {config.nit}</div>}
            {config.direccion && <div>{config.direccion}</div>}
            {config.telefono && <div>Tel: {config.telefono}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
