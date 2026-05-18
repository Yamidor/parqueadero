import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Puestos() {
  const [puestos, setPuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ numero: '', tipo: 'mixto', descripcion: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    try {
      const res = await api.get('/puestos');
      setPuestos(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const abrirModal = (puesto = null) => {
    setEditando(puesto);
    setForm(puesto ? { numero: puesto.numero, tipo: puesto.tipo, descripcion: puesto.descripcion || '' } : { numero: '', tipo: 'mixto', descripcion: '' });
    setError('');
    setShowModal(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editando) {
        await api.put(`/puestos/${editando.id}`, form);
      } else {
        await api.post('/puestos', form);
      }
      setShowModal(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este puesto?')) return;
    try {
      await api.delete(`/puestos/${id}`);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  return (
    <div className="page-content">
      <div className="section-header">
        <div>
          <h1 className="section-title">🅿️ Gestión de Puestos</h1>
          <p className="section-subtitle">{puestos.length} puestos configurados</p>
        </div>
        <button className="btn btn-primary" onClick={() => abrirModal()}>+ Nuevo Puesto</button>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Número</th><th>Tipo</th><th>Estado</th><th>Descripción</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {puestos.map((p) => (
                  <tr key={p.id}>
                    <td><span className="mono" style={{ fontSize: '1.1rem', fontWeight: 800 }}>#{p.numero}</span></td>
                    <td><span>{p.tipo === 'moto' ? '🏍️ Moto' : p.tipo === 'carro' ? '🚗 Carro' : '🔄 Mixto'}</span></td>
                    <td>
                      <span className={`badge badge-${p.estado}`}>{p.estado}</span>
                    </td>
                    <td>{p.descripcion || '-'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => abrirModal(p)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => eliminar(p.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {puestos.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    No hay puestos configurados
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">{editando ? 'Editar Puesto' : 'Nuevo Puesto'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={guardar}>
              <div className="form-group">
                <label>Número del Puesto</label>
                <input className="form-control mono" type="number" value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })} required min="1" />
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select className="form-control" value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                  <option value="moto">🏍️ Moto</option>
                  <option value="carro">🚗 Carro</option>
                  <option value="mixto">🔄 Mixto</option>
                </select>
              </div>
              <div className="form-group">
                <label>Descripción (opcional)</label>
                <input className="form-control" value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editando ? 'Actualizar' : 'Crear Puesto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
