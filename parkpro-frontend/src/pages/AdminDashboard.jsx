import { useState, useEffect } from 'react';
import api from '../services/api';
import { formatCurrency, fechaLocal } from '../utils/formatCurrency';
import PanelPuestos from '../components/PanelPuestos';

function MetricCard({ icon, label, value, color }) {
  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <div className="metric-value" style={{ color: color || 'var(--text-primary)' }}>{value}</div>
      <div className="metric-label">{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [red, setRed] = useState(null);
  const [copiado, setCopiado] = useState('');

  useEffect(() => {
    // Usar zona horaria LOCAL (no UTC). De noche en Colombia (UTC-5)
    // toISOString() daba la fecha del dia siguiente y nada cuadraba.
    const hoy = fechaLocal();
    const semanaIni = new Date(); semanaIni.setDate(semanaIni.getDate() - 7);
    const mesIni = new Date(); mesIni.setDate(1);

    Promise.all([
      api.get(`/reportes?fechaInicio=${hoy}&fechaFin=${hoy}`),
      api.get(`/reportes?fechaInicio=${fechaLocal(semanaIni)}&fechaFin=${hoy}`),
      api.get(`/reportes?fechaInicio=${fechaLocal(mesIni)}&fechaFin=${hoy}`),
    ]).then(([diaRes, semRes, mesRes]) => {
      setStats({
        dia: diaRes.data,
        semana: semRes.data,
        mes: mesRes.data,
      });
    }).catch(console.error).finally(() => setLoading(false));

    api.get('/red').then((res) => setRed(res.data)).catch(() => {});
  }, []);

  const copiar = (texto) => {
    navigator.clipboard?.writeText(texto).then(() => {
      setCopiado(texto);
      setTimeout(() => setCopiado(''), 2000);
    }).catch(() => {});
  };

  if (loading) {
    return <div className="loading-center"><div className="spinner" /><span>Cargando métricas...</span></div>;
  }

  return (
    <div className="page-content">
      <div className="section-header">
        <div>
          <h1 className="section-title">📊 Dashboard Administrador</h1>
          <p className="section-subtitle">Resumen general del parqueadero</p>
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Tarjeta: URL para conectar otros dispositivos */}
      {red && red.urls && red.urls.length > 0 && (
        <div className="glass-card" style={{ padding: 20, marginBottom: 24, border: '1px solid rgba(255,107,0,0.35)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: '1.3rem' }}>📶</span>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Conectar celulares y otros equipos
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14 }}>
            Conecta el dispositivo a la misma red WiFi y abre esta dirección en el navegador:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {red.urls.map((url) => (
              <div key={url} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <code style={{
                  flex: '1 1 240px', fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                  color: 'var(--neon-yellow)', background: 'var(--bg-elevated)', padding: '10px 14px',
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', letterSpacing: '0.5px',
                }}>{url}</code>
                <button className="btn btn-secondary" onClick={() => copiar(url)}>
                  {copiado === url ? '✅ Copiado' : '📋 Copiar'}
                </button>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 12 }}>
            ⚠️ La primera vez el navegador mostrará un aviso de seguridad (certificado propio): toca “Avanzado” → “Continuar”.
            Para que la dirección no cambie, deja una IP fija al PC servidor en el router.
          </p>
        </div>
      )}

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <MetricCard icon="📅" label="Ingresos Hoy" value={formatCurrency(stats?.dia?.totalIngresos || 0)} color="var(--neon-yellow)" />
        <MetricCard icon="📈" label="Ingresos Semana" value={formatCurrency(stats?.semana?.totalIngresos || 0)} color="var(--neon-orange)" />
        <MetricCard icon="💰" label="Ingresos Mes" value={formatCurrency(stats?.mes?.totalIngresos || 0)} color="var(--free-color)" />
        <MetricCard icon="🚗" label="Vehículos Atendidos Hoy" value={stats?.dia?.vehiculosAtendidos || 0} />
        <MetricCard icon="💸" label="Gastos Mes" value={formatCurrency(stats?.mes?.totalGastos || 0)} color="var(--busy-color)" />
        <MetricCard icon="⚖️" label="Balance Mes" value={formatCurrency(stats?.mes?.balance || 0)}
          color={(stats?.mes?.balance || 0) >= 0 ? 'var(--free-color)' : 'var(--busy-color)'} />
      </div>

      {/* Panel de puestos */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
          🅿️ Estado del Parqueadero en Tiempo Real
        </h2>
        <PanelPuestos showHeader={true} />
      </div>
    </div>
  );
}
