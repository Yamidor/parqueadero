import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import api from '../services/api';
import FormCliente from './FormCliente';
import ReciboTermico from './ReciboTermico';
import { formatCurrency } from '../utils/formatCurrency';

export default function ModalEntrada({ onClose }) {
  const [step, setStep] = useState('placa'); // placa → datos → puesto → confirmado
  const [placa, setPlaca] = useState('');
  const [vehiculo, setVehiculo] = useState(null);
  const [puestos, setPuestos] = useState([]);
  const [puestoSeleccionado, setPuestoSeleccionado] = useState(null);
  const [tarifa, setTarifa] = useState(0);
  const [facturaCreada, setFacturaCreada] = useState(null);
  const [nuevoCliente, setNuevoCliente] = useState(false);
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
      const res = await api.get(`/vehiculos/placa/${placa.trim().toUpperCase()}`);
      setVehiculo(res.data);

      // Get tarifa
      const tipoTarifa = res.data.tipo === 'moto' ? 'hora_moto' : 'hora_carro';
      const tRes = await api.get('/tarifas');
      const t = tRes.data.find((t) => t.tipo === tipoTarifa);
      setTarifa(t?.valor || 0);

      // Load available spots
      const pRes = await api.get('/puestos');
      setPuestos(pRes.data.filter((p) => p.estado === 'libre'));
      setStep('datos');
    } catch (err) {
      if (err.response?.status === 404) {
        setNuevoCliente(true);
        setStep('datos');
      } else {
        setError(err.response?.data?.error || 'Error al buscar vehículo');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVehiculoCreado = async (veh) => {
    setVehiculo(veh);
    setNuevoCliente(false);
    const tipoTarifa = veh.tipo === 'moto' ? 'hora_moto' : 'hora_carro';
    const tRes = await api.get('/tarifas');
    const t = tRes.data.find((t) => t.tipo === tipoTarifa);
    setTarifa(t?.valor || 0);
    const pRes = await api.get('/puestos');
    setPuestos(pRes.data.filter((p) => p.estado === 'libre'));
    setStep('puesto');
  };

  const registrarEntrada = async () => {
    if (!puestoSeleccionado) { setError('Selecciona un puesto'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/facturas/entrada', {
        vehiculoId: vehiculo.id,
        puestoId: puestoSeleccionado.id,
        clienteId: vehiculo.clienteId,
      });
      setFacturaCreada(res.data);
      setStep('confirmado');
      printReceipt();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar entrada');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3 className="modal-title">🚗 Registrar Entrada</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {/* STEP: Buscar placa */}
        {step === 'placa' && (
          <div>
            <div className="form-group">
              <label>Placa del vehículo</label>
              <input
                className="form-control mono"
                placeholder="ABC-123"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && buscarPlaca()}
                style={{ fontSize: '1.2rem', textAlign: 'center', letterSpacing: '3px' }}
                autoFocus
              />
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={buscarPlaca} disabled={loading}>
              {loading ? 'Buscando...' : '🔍 Buscar Vehículo'}
            </button>
          </div>
        )}

        {/* STEP: Datos del vehículo */}
        {step === 'datos' && !nuevoCliente && vehiculo && (
          <div>
            <div className="alert alert-success">✅ Vehículo encontrado</div>
            <div className="info-grid">
              <div className="info-row"><span>Placa</span><span className="mono">{vehiculo.placa}</span></div>
              <div className="info-row"><span>Tipo</span><span>{vehiculo.tipo === 'moto' ? '🏍️ Moto' : '🚗 Carro'}</span></div>
              <div className="info-row"><span>Marca</span><span>{vehiculo.marca || '-'}</span></div>
              <div className="info-row"><span>Cliente</span><span>{vehiculo.cliente?.nombre} {vehiculo.cliente?.apellido}</span></div>
              <div className="info-row"><span>Tarifa/hora</span><span className="neon-text">{formatCurrency(tarifa)}</span></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn btn-secondary" onClick={() => setStep('placa')}>← Cambiar</button>
              <button className="btn btn-primary" onClick={async () => {
                const pRes = await api.get('/puestos');
                setPuestos(pRes.data.filter((p) => p.estado === 'libre'));
                setStep('puesto');
              }}>Seleccionar Puesto →</button>
            </div>
          </div>
        )}

        {/* STEP: Crear cliente nuevo */}
        {step === 'datos' && nuevoCliente && (
          <FormCliente onCreated={handleVehiculoCreado} onCancel={onClose} />
        )}

        {/* STEP: Seleccionar puesto */}
        {step === 'puesto' && (
          <div>
            <p style={{ color: 'var(--text-muted)', marginBottom: 12, fontSize: '0.85rem' }}>
              {puestos.length} puestos disponibles — Selecciona uno:
            </p>
            {puestos.length === 0 ? (
              <div className="alert alert-warning">⚠️ No hay puestos disponibles en este momento.</div>
            ) : (
              <div className="puesto-selector">
                {puestos.map((p) => (
                  <button
                    key={p.id}
                    className={`puesto-btn ${puestoSeleccionado?.id === p.id ? 'selected' : ''}`}
                    onClick={() => setPuestoSeleccionado(p)}
                  >
                    <span style={{ fontSize: '1.3rem' }}>{p.tipo === 'moto' ? '🏍️' : p.tipo === 'carro' ? '🚗' : '🔄'}</span>
                    <span>#{p.numero}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.tipo}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button className="btn btn-secondary" onClick={() => setStep('datos')}>← Atrás</button>
              <button className="btn btn-primary" onClick={registrarEntrada} disabled={!puestoSeleccionado || loading}>
                {loading ? 'Registrando...' : '✅ Confirmar Entrada'}
              </button>
            </div>
          </div>
        )}

        {/* STEP: Confirmado */}
        {step === 'confirmado' && facturaCreada && (
          <div className="text-center">
            <div className="talanquera-wrapper">
              <div className="talanquera-car">{vehiculo?.tipo === 'moto' ? '🏍️' : '🚗'}</div>
              <div className="talanquera-base"><div className="talanquera-light"></div></div>
              <div className="talanquera-arm"></div>
            </div>
            <h3 style={{ color: 'var(--free-color)', marginBottom: 8, marginTop: -10 }}>¡Entrada Registrada!</h3>
            <p className="mono" style={{ color: 'var(--neon-orange)', fontSize: '1.1rem' }}>
              {facturaCreada.factura?.codigo}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '8px 0 20px' }}>
              Puesto #{puestoSeleccionado?.numero} — El recibo se está imprimiendo
            </p>
            <div className="flex gap-2 justify-between">
              <button className="btn btn-secondary" onClick={() => handlePrint()}>🖨️ Reimprimir</button>
              <button className="btn btn-primary" onClick={onClose}>Cerrar</button>
            </div>
          </div>
        )}

        {/* Hidden receipt for printing */}
        {facturaCreada && (
          <div style={{ display: 'none' }}>
            <ReciboTermico
              ref={reciboRef}
              tipo="entrada"
              factura={facturaCreada.factura}
              tarifa={tarifa}
              puestoNumero={puestoSeleccionado?.numero}
            />
          </div>
        )}
      </div>

      <style>{`
        .info-grid { display: flex; flex-direction: column; gap: 8px; }
        .info-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--bg-elevated); border-radius: var(--radius-md); font-size: 0.9rem; }
        .info-row span:first-child { color: var(--text-muted); }
        .neon-text { color: var(--neon-orange); font-weight: 700; font-family: var(--font-mono); }
        .puesto-selector { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px; max-height: 250px; overflow-y: auto; padding: 4px; }
        .puesto-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 6px; background: var(--bg-elevated); border: 2px solid var(--border); border-radius: var(--radius-md); cursor: pointer; color: var(--text-primary); font-size: 0.85rem; font-family: var(--font-main); font-weight: 600; transition: all 0.2s; }
        .puesto-btn:hover { border-color: var(--neon-orange); background: rgba(255,107,0,0.08); }
        .puesto-btn.selected { border-color: var(--neon-orange); background: rgba(255,107,0,0.15); box-shadow: 0 0 12px var(--neon-orange-glow); }
      `}</style>
    </div>
  );
}
