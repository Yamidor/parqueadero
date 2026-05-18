import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';

const tipoLabels = { parqueo: 'Parqueo', lavado: 'Lavado', mensualidad: 'Mensualidad' };

export default function Reportes() {
  const hoy = new Date().toISOString().split('T')[0];
  const inicioMes = new Date(); inicioMes.setDate(1);
  const [fechaInicio, setFechaInicio] = useState(inicioMes.toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reportes?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
      setReporte(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const chartData = reporte?.ingresosDiarios?.map((d) => ({
    fecha: d.fecha?.split('-').slice(1).join('/') || d.fecha,
    ingresos: parseFloat(d.total || 0),
  })) || [];

  return (
    <div className="page-content">
      <div className="section-header">
        <div>
          <h1 className="section-title">📈 Reportes de Ingresos</h1>
          <p className="section-subtitle">Análisis financiero del parqueadero</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Fecha Inicio</label>
          <input className="form-control" type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Fecha Fin</label>
          <input className="form-control" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={cargar} disabled={loading}>
          {loading ? '...' : '🔍 Generar Reporte'}
        </button>
      </div>

      {reporte && (
        <>
          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
            {[
              { icon: '💰', label: 'Total Ingresos', value: formatCurrency(reporte.totalIngresos), color: 'var(--neon-yellow)' },
              { icon: '🚗', label: 'Vehículos Atendidos', value: reporte.vehiculosAtendidos, color: 'var(--text-primary)' },
              { icon: '💸', label: 'Total Gastos', value: formatCurrency(reporte.totalGastos), color: 'var(--busy-color)' },
              { icon: '📋', label: 'Total Nómina', value: formatCurrency(reporte.totalNomina), color: 'var(--monthly-color)' },
              { icon: '⚖️', label: 'Balance', value: formatCurrency(reporte.balance), color: reporte.balance >= 0 ? 'var(--free-color)' : 'var(--busy-color)' },
            ].map((m) => (
              <div key={m.label} className="metric-card">
                <div className="metric-icon">{m.icon}</div>
                <div className="metric-value" style={{ color: m.color, fontSize: '1.3rem' }}>{m.value}</div>
                <div className="metric-label">{m.label}</div>
              </div>
            ))}
          </div>

          {/* By service type */}
          {reporte.ingresosPorTipo?.length > 0 && (
            <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
              <h3 style={{ marginBottom: 14, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ingresos por Tipo de Servicio</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {reporte.ingresosPorTipo.map((t) => (
                  <div key={t.tipoServicio} style={{ flex: '1 1 180px', padding: '14px 18px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>{tipoLabels[t.tipoServicio] || t.tipoServicio}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--neon-orange)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(t.total)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{t.cantidad} operaciones</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily chart */}
          {chartData.length > 0 && (
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ marginBottom: 16, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ingresos Diarios</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="fecha" tick={{ fill: '#9090b0', fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#9090b0', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#13131f', border: '1px solid rgba(255,107,0,0.3)', borderRadius: 8, color: '#f0f0ff' }}
                    formatter={(v) => [formatCurrency(v), 'Ingresos']}
                  />
                  <Bar dataKey="ingresos" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff6b00" />
                      <stop offset="100%" stopColor="#ff9100" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
