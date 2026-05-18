import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Trabajadores() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'cajero' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try { const res = await api.get('/usuarios'); setUsuarios(res.data); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const abrirModal = (u = null) => {
    setEditando(u);
    setForm(u ? { nombre: u.nombre, email: u.email, password: '', rol: u.rol } : { nombre: '', email: '', password: '', rol: 'cajero' });
    setError('');
    setShowModal(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      if (editando) await api.put(`/usuarios/${editando.id}`, data);
      else await api.post('/usuarios', data);
      setShowModal(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const toggleActivo = async (u) => {
    try { await api.put(`/usuarios/${u.id}`, { activo: !u.activo }); cargar(); }
    catch (e) { alert('Error'); }
  };

  return (
    <div className="page-content">
      <div className="section-header">
        <div>
          <h1 className="section-title">👤 Trabajadores</h1>
          <p className="section-subtitle">{usuarios.filter(u => u.rol === 'cajero').length} cajeros activos</p>
        </div>
        <button className="btn btn-primary" onClick={() => abrirModal()}>+ Nuevo Trabajador</button>
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nombre}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{u.email}</td>
                    <td><span className={`badge ${u.rol === 'admin' ? 'badge-mensualidad' : 'badge-pagado'}`}>{u.rol}</span></td>
                    <td><span className={`badge ${u.activo ? 'badge-libre' : 'badge-cancelado'}`}>{u.activo ? 'Activo' : 'Inactivo'}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => abrirModal(u)}>✏️</button>
                        {u.rol !== 'admin' && (
                          <button className={`btn btn-sm ${u.activo ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleActivo(u)}>
                            {u.activo ? '🔒 Desactivar' : '✅ Activar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">{editando ? 'Editar Trabajador' : 'Nuevo Trabajador'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={guardar}>
              {[['Nombre *', 'nombre', 'text', true], ['Email *', 'email', 'email', true],
                [editando ? 'Nueva Contraseña (dejar vacío si no cambia)' : 'Contraseña *', 'password', 'password', !editando]].map(([label, key, type, req]) => (
                <div className="form-group" key={key}>
                  <label>{label}</label>
                  <input className="form-control" type={type} value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={req} />
                </div>
              ))}
              <div className="form-group">
                <label>Rol</label>
                <select className="form-control" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                  <option value="cajero">Cajero</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
