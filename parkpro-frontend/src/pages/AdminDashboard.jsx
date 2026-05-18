import { useState, useEffect } from 'react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
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

  useEffect(() => {
    const hoy = new Date().toISOString().split('T')[0];
    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - 7);
    const inicioMes = new Date();
    inicioMes.setDate(1);

    Promise.all([
      api.get(`/reportes?fechaInicio=${hoy}&fechaFin=${hoy}`),
      api.get(`/reportes?fechaInicio=${inicioSemana.toISOString().split('T')[0]}&fechaFin=${hoy}`),
      api.get(`/reportes?fechaInicio=${inicioMes.toISOString().split('T')[0]}&fechaFin=${hoy}`),
    ]).then(([diaRes, semRes, mesRes]) => {
      setStats({
        dia: diaRes.data,
        semana: semRes.data,
        mes: mesRes.data,
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

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

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <MetricCard icon="📅" label="Ingresos Hoy" value={formatCurrency(stats?.dia?.totalIngresos || 0)} color="var(--neon-yellow)" />
        <MetricCard icon="📈" label="Ingresos Semana" value={formatCurrency(stats?.semana?.totalIngresos || 0)} color="var(--neon-orange)" />
        <MetricCard icon="💰" label="Ingresos Mes" value={formatCurrency(stats?.mes?.totalIngresos || 0)} color="var(--free-color)" />
        <MetricCard icon="🚗" label="Vehículos Hoy" value={stats?.dia?.vehiculosAtendidos || 0} />
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
