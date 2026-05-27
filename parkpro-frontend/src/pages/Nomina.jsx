import { useState, useEffect } from 'react';
import api from '../services/api';
import { formatCurrency, fechaLocal } from '../utils/formatCurrency';
import { usePaginacion } from '../components/Paginacion';

export default function Nomina() {
  const [nominas, setNominas] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ trabajadorId: '', monto: '', periodo: 'diario', fecha: fechaLocal(), descripcion: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { datosPagina, Controles } = usePaginacion(nominas, 10);

  const cargar = async () => {
    setLoading(true);
    try {
      const [nRes, uRes] = await Promise.all([api.get('/nomina'), api.get('/usuarios')]);
      setNominas(nRes.data);
      setTrabajadores(uRes.data.filter((u) => u.activo));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/nomina', form);
      setShowModal(false);
      setForm({ trabajadorId: '', monto: '', periodo: 'diario', fecha: fechaLocal(), descripcion: '' });
      cargar();
    } catch (err) { setError(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar registro de nómina?')) return;
    try { await api.delete(`/nomina/${id}`); cargar(); }
    catch (e) { alert('Error'); }
  };

  const total = nominas.reduce((s, n) => s + Number(n.monto), 0);

  return (
    <div className="page-content">
      <div className="section-header">
        <div>
          <h1 className="section-title">📋 Nómina</h1>
          <p className="section-subtitle">Total pagado: <span style={{ color: 'var(--monthly-color)', fontWeight: 700 }}>{formatCurrency(total)}</span></p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Registrar Pago</button>
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Trabajador</th><th>Periodo</th><th>Fecha</th><th>Descripción</th><th>Monto</th><th></th></tr></thead>
              <tbody>
                {datosPagina.map((n) => (
                  <tr key={n.id}>
                    <td>{n.trabajador?.nombre}</td>
                    <td><span className={`badge ${n.periodo === 'diario' ? 'badge-pendiente' : 'badge-mensualidad'}`}>{n.periodo}</span></td>
                    <td className="mono">{n.fecha}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{n.descripcion || '-'}</td>
                    <td className="mono" style={{ color: 'var(--monthly-color)', fontWeight: 700 }}>{formatCurrency(n.monto)}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => eliminar(n.id)}>🗑️</button></td>
                  </tr>
                ))}
                {nominas.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No hay registros de nómina</td></tr>}
              </tbody>
            </table>
          </div>
          <Controles />
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">📋 Registrar Pago de Nómina</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={guardar}>
              <div className="form-group">
                <label>Trabajador *</label>
                <select className="form-control" value={form.trabajadorId} onChange={(e) => setForm({ ...form, trabajadorId: e.target.value })} required>
                  <option value="">Seleccionar trabajador</option>
                  {trabajadores.map((u) => <option key={u.id} value={u.id}>{u.nombre} ({u.rol})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Periodo</label>
                <select className="form-control" value={form.periodo} onChange={(e) => setForm({ ...form, periodo: e.target.value })}>
                  <option value="diario">Diario</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>
              <div className="form-group">
                <label>Monto *</label>
                <input className="form-control mono" type="number" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} required min="0" />
              </div>
              <div className="form-group">
                <label>Fecha</label>
                <input className="form-control" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <input className="form-control" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Registrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
