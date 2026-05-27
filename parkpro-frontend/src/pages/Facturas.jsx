import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import api from '../services/api';
import { formatCurrency, formatDateTime, fechaLocal } from '../utils/formatCurrency';
import ReciboTermico from '../components/ReciboTermico';
import { usePaginacion } from '../components/Paginacion';

const TIPOS_LABEL = { parqueo: '🅿️ Parqueo', lavado: '🚿 Lavado', mensualidad: '📅 Mensualidad' };
const ESTADO_COLOR = {
  pagado: 'var(--free-color)',
  pendiente: 'var(--neon-yellow)',
  cancelado: 'var(--busy-color)',
};

function tipoReciboParaImprimir(tipoServicio, estado) {
  if (tipoServicio === 'lavado') return 'lavado';
  if (tipoServicio === 'mensualidad') return 'mensualidad';
  if (estado === 'pagado') return 'salida';
  return 'entrada';
}

export default function Facturas() {
  const hoy = fechaLocal();
  const inicioMes = new Date(); inicioMes.setDate(1);
  const [filtros, setFiltros] = useState({
    fechaInicio: fechaLocal(inicioMes),
    fechaFin: hoy,
    tipoServicio: '',
    tipoVehiculo: '',
    estado: '',
  });
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seleccionada, setSeleccionada] = useState(null);
  const [aviso, setAviso] = useState('');
  const reciboRef = useRef(null);

  const handlePrint = useReactToPrint({ contentRef: reciboRef });

  const cargar = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([k, v]) => { if (v) params.append(k, v); });
      const res = await api.get(`/facturas?${params.toString()}`);
      setFacturas(res.data);
    } catch (e) {
      setAviso('Error cargando facturas');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const reimprimir = (factura) => {
    setSeleccionada(factura);
    setTimeout(() => handlePrint?.(), 200);
  };

  const cancelar = async (factura) => {
    if (!confirm(`¿Cancelar la factura ${factura.codigo}? No se podrá deshacer y no contará en los ingresos.`)) return;
    try {
      await api.post(`/facturas/${factura.id}/cancelar`);
      setAviso(`Factura ${factura.codigo} cancelada`);
      setTimeout(() => setAviso(''), 3000);
      cargar();
    } catch (e) {
      alert(e.response?.data?.error || 'Error cancelando factura');
    }
  };

  const totales = facturas.reduce((acc, f) => {
    if (f.estado === 'pagado') acc.ingresos += parseFloat(f.valorTotal || 0);
    if (f.estado === 'pendiente') acc.pendientes++;
    if (f.estado === 'cancelado') acc.canceladas++;
    return acc;
  }, { ingresos: 0, pendientes: 0, canceladas: 0 });

  const { datosPagina: facturasPagina, Controles } = usePaginacion(facturas, 10);

  return (
    <div className="page-content">
      <div className="section-header">
        <div>
          <h1 className="section-title">🧾 Facturas</h1>
          <p className="section-subtitle">Todas las operaciones del parqueadero. Filtra por fecha, tipo y vehículo.</p>
        </div>
      </div>

      {aviso && <div className="alert alert-success">✅ {aviso}</div>}

      {/* Filtros */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 18, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Desde</label>
          <input className="form-control" type="date" value={filtros.fechaInicio}
            onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Hasta</label>
          <input className="form-control" type="date" value={filtros.fechaFin}
            onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Servicio</label>
          <select className="form-control" value={filtros.tipoServicio}
            onChange={(e) => setFiltros({ ...filtros, tipoServicio: e.target.value })}>
            <option value="">Todos</option>
            <option value="parqueo">Parqueo</option>
            <option value="lavado">Lavado</option>
            <option value="mensualidad">Mensualidad</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Vehículo</label>
          <select className="form-control" value={filtros.tipoVehiculo}
            onChange={(e) => setFiltros({ ...filtros, tipoVehiculo: e.target.value })}>
            <option value="">Todos</option>
            <option value="moto">Moto</option>
            <option value="carro">Carro</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Estado</label>
          <select className="form-control" value={filtros.estado}
            onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
            <option value="">Todos</option>
            <option value="pagado">Pagado</option>
            <option value="pendiente">Pendiente</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={cargar} disabled={loading}>
          {loading ? '...' : '🔍 Buscar'}
        </button>
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div className="metric-card"><div className="metric-icon">🧾</div><div className="metric-value">{facturas.length}</div><div className="metric-label">Facturas mostradas</div></div>
        <div className="metric-card"><div className="metric-icon">💰</div><div className="metric-value" style={{ color: 'var(--free-color)' }}>{formatCurrency(totales.ingresos)}</div><div className="metric-label">Ingresos (pagadas)</div></div>
        <div className="metric-card"><div className="metric-icon">⏳</div><div className="metric-value" style={{ color: 'var(--neon-yellow)' }}>{totales.pendientes}</div><div className="metric-label">Pendientes</div></div>
        <div className="metric-card"><div className="metric-icon">❌</div><div className="metric-value" style={{ color: 'var(--busy-color)' }}>{totales.canceladas}</div><div className="metric-label">Canceladas</div></div>
      </div>

      {/* Tabla */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                {['Código', 'Fecha', 'Servicio', 'Placa', 'Tipo', 'Cliente', 'Puesto', 'Valor', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {facturas.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No hay facturas en este rango.</td></tr>
              )}
              {facturasPagina.map((f) => (
                <tr key={f.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="mono" style={{ padding: '10px 12px', color: 'var(--neon-orange)' }}>{f.codigo}</td>
                  <td style={{ padding: '10px 12px' }}>{formatDateTime(f.createdAt)}</td>
                  <td style={{ padding: '10px 12px' }}>{TIPOS_LABEL[f.tipoServicio] || f.tipoServicio}{f.subtipoLavado ? ` (${f.subtipoLavado})` : ''}</td>
                  <td className="mono" style={{ padding: '10px 12px' }}>{f.vehiculo?.placa || '-'}</td>
                  <td style={{ padding: '10px 12px' }}>{f.vehiculo?.tipo === 'moto' ? '🏍️' : '🚗'} {f.vehiculo?.tipo || '-'}</td>
                  <td style={{ padding: '10px 12px' }}>{f.cliente?.nombre} {f.cliente?.apellido}</td>
                  <td style={{ padding: '10px 12px' }}>{f.puesto?.numero ? `#${f.puesto.numero}` : '-'}</td>
                  <td className="mono" style={{ padding: '10px 12px', fontWeight: 700 }}>{formatCurrency(f.valorTotal)}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ color: ESTADO_COLOR[f.estado], fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>{f.estado}</span>
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem', marginRight: 4 }} onClick={() => setSeleccionada(f)} title="Ver detalle">👁</button>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem', marginRight: 4 }} onClick={() => reimprimir(f)} title="Reimprimir">🖨</button>
                    {f.estado !== 'cancelado' && (
                      <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => cancelar(f)} title="Cancelar">❌</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Controles />
      </div>

      {/* Modal de detalle */}
      {seleccionada && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSeleccionada(null)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">🧾 Factura {seleccionada.codigo}</h3>
              <button className="modal-close" onClick={() => setSeleccionada(null)}>✕</button>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                ['Servicio', `${TIPOS_LABEL[seleccionada.tipoServicio] || seleccionada.tipoServicio}${seleccionada.subtipoLavado ? ' - ' + seleccionada.subtipoLavado : ''}`],
                ['Estado', seleccionada.estado],
                ['Cliente', `${seleccionada.cliente?.nombre || ''} ${seleccionada.cliente?.apellido || ''}`.trim() || '-'],
                ['Placa', seleccionada.vehiculo?.placa || '-'],
                ['Tipo vehículo', seleccionada.vehiculo?.tipo || '-'],
                ['Puesto', seleccionada.puesto?.numero ? `#${seleccionada.puesto.numero}` : '-'],
                ['Ingreso', seleccionada.horaIngreso ? formatDateTime(seleccionada.horaIngreso) : '-'],
                ['Salida', seleccionada.horaSalida ? formatDateTime(seleccionada.horaSalida) : '-'],
                ['Fecha pago', seleccionada.fechaPago ? formatDateTime(seleccionada.fechaPago) : '-'],
                ['Método pago', seleccionada.metodoPago || '-'],
                ['Valor', formatCurrency(seleccionada.valorTotal)],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4 justify-between">
              <button className="btn btn-secondary" onClick={() => reimprimir(seleccionada)}>🖨️ Reimprimir recibo</button>
              <button className="btn btn-primary" onClick={() => setSeleccionada(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Recibo oculto para imprimir */}
      {seleccionada && (
        <div style={{ display: 'none' }}>
          <ReciboTermico
            ref={reciboRef}
            tipo={tipoReciboParaImprimir(seleccionada.tipoServicio, seleccionada.estado)}
            factura={seleccionada}
            valorHora={null}
            horasCalculadas={seleccionada.totalHoras}
          />
        </div>
      )}
    </div>
  );
}
