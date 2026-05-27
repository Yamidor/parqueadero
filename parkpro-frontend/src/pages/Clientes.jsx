import { useState, useEffect } from 'react';
import api from '../services/api';
import { usePaginacion } from '../components/Paginacion';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', email: '', documento: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const { datosPagina, Controles } = usePaginacion(clientes, 10);

  const cargar = async (q = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/clientes${q ? `?buscar=${q}` : ''}`);
      setClientes(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const abrirModal = (c = null) => {
    setEditando(c);
    setForm(c ? { nombre: c.nombre, apellido: c.apellido, telefono: c.telefono || '', email: c.email || '', documento: c.documento || '' } : { nombre: '', apellido: '', telefono: '', email: '', documento: '' });
    setError('');
    setShowModal(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editando) await api.put(`/clientes/${editando.id}`, form);
      else await api.post('/clientes', form);
      setShowModal(false);
      cargar(buscar);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const verHistorial = async (c) => {
    try {
      const res = await api.get(`/clientes/${c.id}/historial`);
      setHistorial(res.data);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="page-content">
      <div className="section-header">
        <div>
          <h1 className="section-title">👥 Clientes</h1>
          <p className="section-subtitle">{clientes.length} clientes registrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => abrirModal()}>+ Nuevo Cliente</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input className="form-control" placeholder="🔍 Buscar por nombre, documento, teléfono..."
          value={buscar} onChange={(e) => { setBuscar(e.target.value); cargar(e.target.value); }}
          style={{ maxWidth: 400 }} />
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Nombre</th><th>Documento</th><th>Teléfono</th><th>Vehículos</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {datosPagina.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nombre} {c.apellido}</td>
                    <td className="mono">{c.documento || '-'}</td>
                    <td>{c.telefono || '-'}</td>
                    <td>{c.vehiculos?.length || 0} vehículo(s)</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => verHistorial(c)}>📋 Historial</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => abrirModal(c)}>✏️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {clientes.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No hay clientes</td></tr>}
              </tbody>
            </table>
          </div>
          <Controles />
        </div>
      )}

      {/* Client form modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">{editando ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={guardar}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[['Nombre *', 'nombre', 'text', true], ['Apellido *', 'apellido', 'text', true],
                  ['Documento', 'documento', 'text', false], ['Teléfono', 'telefono', 'text', false],
                  ['Email', 'email', 'email', false]].map(([label, key, type, req]) => (
                  <div className="form-group" key={key} style={key === 'email' ? { gridColumn: '1/-1' } : {}}>
                    <label>{label}</label>
                    <input className="form-control" type={type} value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={req} />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History modal */}
      {historial && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setHistorial(null)}>
          <div className="modal-box modal-lg">
            <div className="modal-header">
              <h3 className="modal-title">📋 Historial: {historial.nombre} {historial.apellido}</h3>
              <button className="modal-close" onClick={() => setHistorial(null)}>✕</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: 8 }}>Vehículos</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {historial.vehiculos?.map((v) => (
                  <div key={v.id} style={{ padding: '6px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                    <span className="mono">{v.placa}</span> — {v.tipo}
                  </div>
                ))}
              </div>
            </div>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: 8 }}>Últimas Facturas</h4>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Código</th><th>Servicio</th><th>Estado</th><th>Total</th></tr></thead>
                <tbody>
                  {historial.facturas?.slice(0, 10).map((f) => (
                    <tr key={f.id}>
                      <td className="mono">{f.codigo}</td>
                      <td>{f.tipoServicio}</td>
                      <td><span className={`badge badge-${f.estado}`}>{f.estado}</span></td>
                      <td className="mono">${Number(f.valorTotal).toLocaleString('es-CO')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
