import { useState, useEffect } from 'react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';

const LABELS = {
  hora_moto: '🏍️ Valor Hora Moto',
  hora_carro: '🚗 Valor Hora Carro',
  mensualidad_moto: '📅 Mensualidad Moto',
  mensualidad_carro: '📅 Mensualidad Carro',
  lavado_moto_normal: '🚿 Lavado Moto - Normal',
  lavado_moto_full: '✨ Lavado Moto - Full',
  lavado_carro_normal: '🚿 Lavado Carro - Normal',
  lavado_carro_full: '✨ Lavado Carro - Full',
};

const TIPOS_OCULTOS = ['lavado_moto', 'lavado_carro'];

export default function Tarifas() {
  const [tarifas, setTarifas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [valores, setValores] = useState({});
  const [success, setSuccess] = useState('');
  const [modoCobro, setModoCobro] = useState('hora_completa');
  const [savingModo, setSavingModo] = useState(false);

  const cargar = async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        api.get('/tarifas'),
        api.get('/configuracion'),
      ]);
      setTarifas(tRes.data);
      const v = {};
      tRes.data.forEach((t) => { v[t.id] = t.valor; });
      setValores(v);
      setModoCobro(cRes.data?.modoCobro || 'hora_completa');
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const actualizarModoCobro = async (nuevo) => {
    setSavingModo(true);
    try {
      await api.put('/configuracion', { modoCobro: nuevo });
      setModoCobro(nuevo);
      setSuccess(`Modo de cobro actualizado a "${nuevo === 'fraccion' ? 'Por fracción' : 'Hora completa'}"`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) { alert('Error al actualizar el modo de cobro'); }
    finally { setSavingModo(false); }
  };

  const actualizar = async (tarifa) => {
    setSaving(tarifa.id);
    try {
      await api.put(`/tarifas/${tarifa.id}`, { valor: valores[tarifa.id] });
      setSuccess(`Tarifa "${LABELS[tarifa.tipo]}" actualizada`);
      setTimeout(() => setSuccess(''), 3000);
      cargar();
    } catch (e) { alert('Error al actualizar'); }
    finally { setSaving(null); }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="section-header">
        <div>
          <h1 className="section-title">💰 Configuración de Tarifas</h1>
          <p className="section-subtitle">Define el valor de cada servicio</p>
        </div>
      </div>

      {success && <div className="alert alert-success">✅ {success}</div>}

      <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          ⏱ Modo de Cobro de Horas
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>
          Define cómo se calcula el valor cuando un vehículo permanece menos de una hora completa.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          <button
            type="button"
            disabled={savingModo}
            onClick={() => modoCobro !== 'hora_completa' && actualizarModoCobro('hora_completa')}
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              border: modoCobro === 'hora_completa' ? '2px solid var(--neon-orange)' : '1px solid var(--border)',
              background: modoCobro === 'hora_completa' ? 'rgba(255,107,0,0.12)' : 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              cursor: savingModo ? 'wait' : 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>🕐 Hora completa</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Cobra cada hora iniciada. Ej: 30 min con tarifa $3.000/h = $3.000.
            </div>
          </button>
          <button
            type="button"
            disabled={savingModo}
            onClick={() => modoCobro !== 'fraccion' && actualizarModoCobro('fraccion')}
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              border: modoCobro === 'fraccion' ? '2px solid var(--neon-orange)' : '1px solid var(--border)',
              background: modoCobro === 'fraccion' ? 'rgba(255,107,0,0.12)' : 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              cursor: savingModo ? 'wait' : 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>⏱ Por fracción</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Cobra solo los minutos reales. Ej: 30 min con tarifa $3.000/h = $1.500.
            </div>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {tarifas.filter((t) => !TIPOS_OCULTOS.includes(t.tipo)).map((tarifa) => (
          <div key={tarifa.id} className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              {LABELS[tarifa.tipo] || tarifa.tipo}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              Valor actual: <span style={{ color: 'var(--neon-yellow)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {formatCurrency(tarifa.valor)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 700 }}>$</span>
                <input
                  className="form-control mono"
                  type="number"
                  value={valores[tarifa.id] || ''}
                  onChange={(e) => setValores({ ...valores, [tarifa.id]: e.target.value })}
                  style={{ paddingLeft: 24 }}
                  min="0"
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={() => actualizar(tarifa)}
                disabled={saving === tarifa.id}
              >
                {saving === tarifa.id ? '...' : '💾'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
