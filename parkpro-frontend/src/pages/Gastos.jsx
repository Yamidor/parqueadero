import { useState, useEffect } from 'react';
import api from '../services/api';
import { formatCurrency, fechaLocal } from '../utils/formatCurrency';
import { usePaginacion } from '../components/Paginacion';

export default function Gastos() {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ descripcion: '', monto: '', categoria: 'otros', fecha: fechaLocal() });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { datosPagina, Controles } = usePaginacion(gastos, 10);

  const cargar = async () => {
    setLoading(true);
    try { const res = await api.get('/gastos'); setGastos(res.data); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/gastos', form);
      setShowModal(false);
      setForm({ descripcion: '', monto: '', categoria: 'otros', fecha: fechaLocal() });
      cargar();
    } catch (err) { setError(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar gasto?')) return;
    try { await api.delete(`/gastos/${id}`); cargar(); }
    catch (e) { alert('Error'); }
  };

  const total = gastos.reduce((s, g) => s + Number(g.monto), 0);

  return (
    <div className="page-content">
      <div className="section-header">
        <div>
          <h1 className="section-title">💸 Gastos del Parqueadero</h1>
          <p className="section-subtitle">Total registrado: <span style={{ color: 'var(--busy-color)', fontWeight: 700 }}>{formatCurrency(total)}</span></p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Registrar Gasto</button>
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Descripción</th><th>Categoría</th><th>Fecha</th><th>Monto</th><th>Acciones</th></tr></thead>
              <tbody>
                {datosPagina.map((g) => (
                  <tr key={g.id}>
                    <td>{g.descripcion}</td>
                    <td><span className="badge badge-pendiente">{g.categoria}</span></td>
                    <td className="mono">{g.fecha}</td>
                    <td className="mono" style={{ color: 'var(--busy-color)', fontWeight: 700 }}>{formatCurrency(g.monto)}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => eliminar(g.id)}>🗑️</button></td>
                  </tr>
                ))}
                {gastos.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No hay gastos registrados</td></tr>}
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
              <h3 className="modal-title">💸 Registrar Gasto</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={guardar}>
              <div className="form-group">
                <label>Descripción *</label>
                <input className="form-control" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Monto *</label>
                <input className="form-control mono" type="number" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} required min="0" />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select className="form-control" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                  <option value="servicios">Servicios</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
              <div className="form-group">
                <label>Fecha</label>
                <input className="form-control" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
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
