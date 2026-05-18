import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import api from '../services/api';
import FormCliente from './FormCliente';
import ReciboTermico from './ReciboTermico';
import { formatCurrency } from '../utils/formatCurrency';

export default function ModalMensualidad({ onClose }) {
  const [step, setStep] = useState('placa');
  const [placa, setPlaca] = useState('');
  const [vehiculo, setVehiculo] = useState(null);
  const [tarifa, setTarifa] = useState(0);
  const [puestos, setPuestos] = useState([]);
  const [puestoSeleccionado, setPuestoSeleccionado] = useState(null);
  const [mensualidadInfo, setMensualidadInfo] = useState(null);
  const [nuevoCliente, setNuevoCliente] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const reciboRef = useRef(null);

  const handlePrint = useReactToPrint({ contentRef: reciboRef });

  const printReceipt = () => {
    let retries = 0;
    const trigger = () => {
      if (reciboRef.current) {
        handlePrint();
      } else if (retries < 15) {
        retries++;
        setTimeout(trigger, 100);
      } else {
        console.error('El recibo no se cargó a tiempo en el DOM.');
      }
    };
    trigger();
  };

  const buscarPlaca = async () => {
    if (!placa.trim()) return;
    setLoading(true);
    setError('');
    try {
      // Check if there's an active subscription
      const mRes = await api.get(`/mensualidades/verificar/${placa.trim()}`);
      const { vehiculo: veh, mensualidad, vencida, mensaje, diasRestantes } = mRes.data;
      setVehiculo(veh);

      if (mensualidad && !vencida) {
        // Active subscription
        setMensualidadInfo({ mensualidad, diasRestantes, mensaje });
        setStep('mensualidadActiva');
      } else if (mensualidad && vencida) {
        // Expired - offer renewal
        setMensualidadInfo({ mensualidad, vencida: true, mensaje });
        const tipoTarifa = veh.tipo === 'moto' ? 'mensualidad_moto' : 'mensualidad_carro';
        const tRes = await api.get('/tarifas');
        setTarifa(tRes.data.find((t) => t.tipo === tipoTarifa)?.valor || 0);
        const pRes = await api.get('/puestos');
        setPuestos(pRes.data.filter((p) => p.estado === 'libre'));
        setStep('vencida');
      } else {
        // No subscription - register new
        const tipoTarifa = veh.tipo === 'moto' ? 'mensualidad_moto' : 'mensualidad_carro';
        const tRes = await api.get('/tarifas');
        setTarifa(tRes.data.find((t) => t.tipo === tipoTarifa)?.valor || 0);
        const pRes = await api.get('/puestos');
        setPuestos(pRes.data.filter((p) => p.estado === 'libre'));
        setStep('seleccionPuesto');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setNuevoCliente(true);
        setStep('nuevoCliente');
      } else {
        setError(err.response?.data?.error || 'Error buscando vehículo');
      }
    } finally {
      setLoading(false);
    }
  };

  const registrarMensualidad = async (renovar = false) => {
    if (!puestoSeleccionado && !renovar) { setError('Selecciona un puesto'); return; }
    setLoading(true);
    setError('');
    try {
      let res;
      if (renovar && mensualidadInfo?.mensualidad?.id) {
        res = await api.post(`/mensualidades/renovar/${mensualidadInfo.mensualidad.id}`);
      } else {
        res = await api.post('/mensualidades', {
          vehiculoId: vehiculo.id,
          puestoId: puestoSeleccionado.id,
          clienteId: vehiculo.clienteId,
        });
      }
      setResultado(res.data);
      setStep('confirmado');
      printReceipt();
    } catch (err) {
      setError(err.response?.data?.error || 'Error registrando mensualidad');
    } finally {
      setLoading(false);
    }
  };

  const handleVehiculoCreado = async (veh) => {
    setVehiculo(veh);
    setNuevoCliente(false);
    const tipoTarifa = veh.tipo === 'moto' ? 'mensualidad_moto' : 'mensualidad_carro';
    const tRes = await api.get('/tarifas');
    setTarifa(tRes.data.find((t) => t.tipo === tipoTarifa)?.valor || 0);
    const pRes = await api.get('/puestos');
    setPuestos(pRes.data.filter((p) => p.estado === 'libre'));
    setStep('seleccionPuesto');
  };

  const PuestoSelector = () => (
    <>
      <p style={{ color: 'var(--text-muted)', marginBottom: 10, fontSize: '0.85rem' }}>
        Selecciona el puesto asignado:
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px,1fr))', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
        {puestos.map((p) => (
          <button key={p.id}
            onClick={() => setPuestoSeleccionado(p)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '10px 6px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              fontFamily: 'var(--font-main)', fontWeight: 600, fontSize: '0.85rem',
              background: puestoSeleccionado?.id === p.id ? 'rgba(255,107,0,0.15)' : 'var(--bg-elevated)',
              border: `2px solid ${puestoSeleccionado?.id === p.id ? 'var(--neon-orange)' : 'var(--border)'}`,
              color: 'var(--text-primary)',
            }}
          >
            <span>{p.tipo === 'moto' ? '🏍️' : '🚗'}</span>
            <span>#{p.numero}</span>
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3 className="modal-title">📅 Mensualidad</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {step === 'placa' && (
          <div>
            <div className="form-group">
              <label>Placa del vehículo</label>
              <input className="form-control mono" placeholder="ABC-123" value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && buscarPlaca()}
                style={{ fontSize: '1.2rem', textAlign: 'center', letterSpacing: '3px' }} autoFocus />
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={buscarPlaca} disabled={loading}>
              {loading ? 'Buscando...' : '🔍 Verificar Mensualidad'}
            </button>
          </div>
        )}

        {step === 'nuevoCliente' && (
          <FormCliente onCreated={handleVehiculoCreado} onCancel={onClose} />
        )}

        {step === 'mensualidadActiva' && mensualidadInfo && (
          <div>
            <div className="alert alert-success">{mensualidadInfo.mensaje}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Puesto asignado</span>
                <span>#{mensualidadInfo.mensualidad.puesto?.numero}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vence</span>
                <span>{mensualidadInfo.mensualidad.fechaFin}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
              <button className="btn btn-primary" onClick={() => {
                setMensualidadInfo({ ...mensualidadInfo, renovar: true });
                setStep('seleccionPuesto');
              }}>🔄 Renovar Ahora</button>
            </div>
          </div>
        )}

        {step === 'vencida' && (
          <div>
            <div className="alert alert-warning">⚠️ {mensualidadInfo?.mensaje}</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
              ¿Desea renovar la mensualidad?
            </p>
            <div style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.3)', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--neon-orange)', fontWeight: 700 }}>💰 Valor Mensualidad</span>
                <span style={{ color: 'var(--neon-yellow)', fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '1.2rem' }}>{formatCurrency(tarifa)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={onClose}>No renovar</button>
              <button className="btn btn-primary" onClick={() => registrarMensualidad(true)} disabled={loading}>
                {loading ? 'Renovando...' : '✅ Renovar Mensualidad'}
              </button>
            </div>
          </div>
        )}

        {step === 'seleccionPuesto' && (
          <div>
            {vehiculo && (
              <div className="alert alert-info" style={{ marginBottom: 12 }}>
                🚗 {vehiculo.placa} — {vehiculo.cliente?.nombre} {vehiculo.cliente?.apellido}
              </div>
            )}
            <div style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.3)', borderRadius: 'var(--radius-lg)', padding: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--neon-orange)', fontWeight: 700 }}>💰 Valor</span>
                <span style={{ color: 'var(--neon-yellow)', fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '1.1rem' }}>{formatCurrency(tarifa)}</span>
              </div>
            </div>
            <PuestoSelector />
            <div className="flex gap-2 mt-4">
              <button className="btn btn-secondary" onClick={() => setStep('placa')}>← Atrás</button>
              <button className="btn btn-primary" onClick={() => registrarMensualidad(false)} disabled={!puestoSeleccionado || loading}>
                {loading ? 'Registrando...' : `✅ Confirmar ${formatCurrency(tarifa)}`}
              </button>
            </div>
          </div>
        )}

        {step === 'confirmado' && resultado && (
          <div className="text-center">
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
            <h3 style={{ color: 'var(--free-color)', marginBottom: 8 }}>¡Mensualidad Registrada!</h3>
            <p className="mono" style={{ color: 'var(--neon-orange)', fontSize: '1rem' }}>
              {resultado.factura?.codigo}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '8px 0' }}>
              Desde: {resultado.mensualidad?.fechaInicio} — Hasta: {resultado.mensualidad?.fechaFin}
            </p>
            <p style={{ color: 'var(--neon-yellow)', fontWeight: 800, fontSize: '1.3rem' }}>
              {formatCurrency(resultado.factura?.valorTotal)}
            </p>
            <div className="flex gap-2 mt-4 justify-between">
              <button className="btn btn-secondary" onClick={() => handlePrint()}>🖨️ Reimprimir</button>
              <button className="btn btn-primary" onClick={onClose}>Cerrar</button>
            </div>
          </div>
        )}

        {resultado && (
          <div style={{ display: 'none' }}>
            <ReciboTermico
              ref={reciboRef}
              tipo="mensualidad"
              factura={resultado.factura}
              mensualidad={resultado.mensualidad}
            />
          </div>
        )}
      </div>
    </div>
  );
}
