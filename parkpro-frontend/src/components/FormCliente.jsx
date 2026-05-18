import { useState } from 'react';
import api from '../services/api';

export default function FormCliente({ onCreated, onCancel }) {
  const [step, setStep] = useState('cliente'); // 'cliente' | 'vehiculo'
  const [clienteData, setClienteData] = useState({
    nombre: '', apellido: '', telefono: '', email: '', documento: '',
  });
  const [vehiculoData, setVehiculoData] = useState({
    placa: '', tipo: 'carro', marca: '', modelo: '', color: '',
  });
  const [clienteCreado, setClienteCreado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCrearCliente = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/clientes', clienteData);
      setClienteCreado(res.data);
      setStep('vehiculo');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearVehiculo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/vehiculos', {
        ...vehiculoData,
        clienteId: clienteCreado.id,
        placa: vehiculoData.placa.toUpperCase(),
      });
      onCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar vehículo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {step === 'cliente' ? (
        <>
          <div className="alert alert-info" style={{ marginBottom: 16 }}>
            📋 El vehículo no está registrado. Complete los datos del cliente primero.
          </div>
          <form onSubmit={handleCrearCliente}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Nombre *</label>
                <input className="form-control" value={clienteData.nombre}
                  onChange={(e) => setClienteData({ ...clienteData, nombre: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Apellido *</label>
                <input className="form-control" value={clienteData.apellido}
                  onChange={(e) => setClienteData({ ...clienteData, apellido: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Documento</label>
                <input className="form-control" value={clienteData.documento}
                  onChange={(e) => setClienteData({ ...clienteData, documento: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input className="form-control" value={clienteData.telefono}
                  onChange={(e) => setClienteData({ ...clienteData, telefono: e.target.value })} />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label>Email</label>
                <input className="form-control" type="email" value={clienteData.email}
                  onChange={(e) => setClienteData({ ...clienteData, email: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Siguiente: Datos del Vehículo →'}
              </button>
            </div>
          </form>
        </>
      ) : (
        <>
          <div className="alert alert-success" style={{ marginBottom: 16 }}>
            ✅ Cliente registrado: {clienteCreado.nombre} {clienteCreado.apellido}
          </div>
          <form onSubmit={handleCrearVehiculo}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Placa *</label>
                <input className="form-control mono" value={vehiculoData.placa}
                  onChange={(e) => setVehiculoData({ ...vehiculoData, placa: e.target.value.toUpperCase() })}
                  placeholder="ABC-123" required style={{ textTransform: 'uppercase' }} />
              </div>
              <div className="form-group">
                <label>Tipo *</label>
                <select className="form-control" value={vehiculoData.tipo}
                  onChange={(e) => setVehiculoData({ ...vehiculoData, tipo: e.target.value })}>
                  <option value="carro">🚗 Carro</option>
                  <option value="moto">🏍️ Moto</option>
                </select>
              </div>
              <div className="form-group">
                <label>Marca</label>
                <input className="form-control" value={vehiculoData.marca}
                  onChange={(e) => setVehiculoData({ ...vehiculoData, marca: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Modelo</label>
                <input className="form-control" value={vehiculoData.modelo}
                  onChange={(e) => setVehiculoData({ ...vehiculoData, modelo: e.target.value })} />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label>Color</label>
                <input className="form-control" value={vehiculoData.color}
                  onChange={(e) => setVehiculoData({ ...vehiculoData, color: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" className="btn btn-secondary" onClick={() => setStep('cliente')}>← Atrás</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Registrando...' : '✅ Registrar Vehículo'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
