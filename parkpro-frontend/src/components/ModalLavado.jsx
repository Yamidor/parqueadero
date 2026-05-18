import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import api from '../services/api';
import ReciboTermico from './ReciboTermico';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDateTime } from '../utils/formatCurrency';

export default function ModalLavado({ onClose }) {
  const [step, setStep] = useState('placa');
  const [placa, setPlaca] = useState('');
  const [vehiculo, setVehiculo] = useState(null);
  const [tarifa, setTarifa] = useState(0);
  const [facturaCreada, setFacturaCreada] = useState(null);
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
      const tipoTarifa = res.data.tipo === 'moto' ? 'lavado_moto' : 'lavado_carro';
      const tRes = await api.get('/tarifas');
      const t = tRes.data.find((t) => t.tipo === tipoTarifa);
      setTarifa(t?.valor || 0);
      setStep('confirmacion');
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Vehículo no registrado. Registre primero al cliente desde "Registrar Entrada".');
      } else {
        setError(err.response?.data?.error || 'Error buscando vehículo');
      }
    } finally {
      setLoading(false);
    }
  };

  const registrarLavado = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/facturas/lavado', {
        vehiculoId: vehiculo.id,
        clienteId: vehiculo.clienteId,
      });
      setFacturaCreada(res.data);
      setStep('confirmado');
      printReceipt();
    } catch (err) {
      setError(err.response?.data?.error || 'Error registrando lavado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3 className="modal-title">🚿 Servicio de Lavado</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

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

        {step === 'confirmacion' && vehiculo && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cliente</span>
                <span>{vehiculo.cliente?.nombre} {vehiculo.cliente?.apellido}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Placa</span>
                <span className="mono">{vehiculo.placa}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tipo</span>
                <span>{vehiculo.tipo === 'moto' ? '🏍️ Moto' : '🚗 Carro'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px', background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--neon-orange)', fontWeight: 700 }}>💰 Valor Lavado</span>
                <span style={{ color: 'var(--neon-yellow)', fontWeight: 800, fontSize: '1.2rem', fontFamily: 'var(--font-mono)' }}>{formatCurrency(tarifa)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={() => setStep('placa')}>← Cambiar</button>
              <button className="btn btn-primary" onClick={registrarLavado} disabled={loading}>
                {loading ? 'Registrando...' : '✅ Confirmar Pago y Registrar'}
              </button>
            </div>
          </div>
        )}

        {step === 'confirmado' && facturaCreada && (
          <div className="text-center">
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
            <h3 style={{ color: 'var(--free-color)', marginBottom: 8 }}>¡Lavado Registrado!</h3>
            <p className="mono" style={{ color: 'var(--neon-orange)', fontSize: '1.1rem' }}>
              {facturaCreada.factura?.codigo}
            </p>
            <p style={{ color: 'var(--neon-yellow)', fontWeight: 700, fontSize: '1.1rem', margin: '8px 0' }}>
              {formatCurrency(facturaCreada.factura?.valorTotal)}
            </p>
            <div className="flex gap-2 mt-4 justify-between">
              <button className="btn btn-secondary" onClick={() => handlePrint()}>🖨️ Reimprimir</button>
              <button className="btn btn-primary" onClick={onClose}>Cerrar</button>
            </div>
          </div>
        )}

        {facturaCreada && (
          <div style={{ display: 'none' }}>
            <ReciboTermico ref={reciboRef} tipo="lavado" factura={facturaCreada.factura} />
          </div>
        )}
      </div>
    </div>
  );
}
