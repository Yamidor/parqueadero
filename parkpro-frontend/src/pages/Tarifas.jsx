import { useState, useEffect } from 'react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';

const LABELS = {
  hora_moto: '🏍️ Valor Hora Moto',
  hora_carro: '🚗 Valor Hora Carro',
  mensualidad_moto: '📅 Mensualidad Moto',
  mensualidad_carro: '📅 Mensualidad Carro',
  lavado_moto: '🚿 Lavado Moto',
  lavado_carro: '🚿 Lavado Carro',
};

export default function Tarifas() {
  const [tarifas, setTarifas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [valores, setValores] = useState({});
  const [success, setSuccess] = useState('');

  const cargar = async () => {
    try {
      const res = await api.get('/tarifas');
      setTarifas(res.data);
      const v = {};
      res.data.forEach((t) => { v[t.id] = t.valor; });
      setValores(v);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {tarifas.map((tarifa) => (
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
