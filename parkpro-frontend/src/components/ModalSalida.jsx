import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import api from '../services/api';
import ReciboTermico from './ReciboTermico';
import { formatCurrency, formatDateTime } from '../utils/formatCurrency';
import { calcularHoras, formatDuration } from '../utils/calcularHoras';

import { Scanner } from '@yudiel/react-qr-scanner';

export default function ModalSalida({ onClose }) {
  const [step, setStep] = useState('buscar'); // buscar → datos → confirmado
  const [busqueda, setBusqueda] = useState('');
  const [modoQR, setModoQR] = useState(false);
  const [facturaInfo, setFacturaInfo] = useState(null);
  const [facturaPagada, setFacturaPagada] = useState(null);
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

  const buscarFactura = async (valor) => {
    const query = valor || busqueda;
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setModoQR(false);
    try {
      const isPlaca = !query.trim().toUpperCase().startsWith('PK');
      const params = isPlaca ? `placa=${query.trim()}` : `codigo=${query.trim()}`;
      const res = await api.get(`/facturas/buscar?${params}`);

      if (res.data.factura.estado === 'pagado') {
        setError(`Este recibo ya fue cancelado. Fecha de pago: ${formatDateTime(res.data.factura.fechaPago)}`);
        return;
      }

      setFacturaInfo(res.data);
      setStep('datos');
    } catch (err) {
      setError(err.response?.data?.error || 'Factura no encontrada');
    } finally {
      setLoading(false);
    }
  };

  const confirmarPago = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/facturas/salida', {
        facturaId: facturaInfo.factura.id,
        metodoPago: 'efectivo',
      });
      setFacturaPagada(res.data);
      setStep('confirmado');
      printReceipt();
    } catch (err) {
      setError(err.response?.data?.error || 'Error registrando pago');
    } finally {
      setLoading(false);
    }
  };

  const { factura, horasTranscurridas, horasACobrar, valorHora, valorEstimado } = facturaInfo || {};

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box modal-lg">
        <div className="modal-header">
          <h3 className="modal-title">🚗 Registrar Salida</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {step === 'buscar' && (
          <div>
            <div className="flex gap-2 mb-4">
              <button
                className={`btn ${!modoQR ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setModoQR(false)}
              >📋 Manual</button>
              <button
                className={`btn ${modoQR ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setModoQR(true)}
              >📷 Escanear QR</button>
            </div>

            {modoQR ? (
              <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#000', aspectRatio: '1' }}>
                <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  📷 Apunta la cámara al código QR del recibo de entrada
                </p>
                <Scanner 
                  onScan={(results) => {
                    if (results && results.length > 0) {
                      buscarFactura(results[0].rawValue);
                    }
                  }} 
                />
              </div>
            ) : (
              <div>
                <div className="form-group">
                  <label>Código de factura o placa del vehículo</label>
                  <input
                    className="form-control mono"
                    placeholder="PKR-2024-00001 o ABC-123"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && buscarFactura()}
                    style={{ fontSize: '1.1rem', textAlign: 'center', letterSpacing: '2px' }}
                    autoFocus
                  />
                </div>
                <button className="btn btn-primary btn-full btn-lg" onClick={() => buscarFactura()} disabled={loading}>
                  {loading ? 'Buscando...' : '🔍 Buscar Factura'}
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'datos' && facturaInfo && (
          <div>
            <div className="alert alert-info">
              📋 Factura encontrada: <strong className="mono">{factura.codigo}</strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                ['Cliente', `${factura.cliente?.nombre} ${factura.cliente?.apellido}`],
                ['Placa', factura.vehiculo?.placa],
                ['Tipo', factura.vehiculo?.tipo === 'moto' ? '🏍️ Moto' : '🚗 Carro'],
                ['Puesto', `#${factura.puesto?.numero}`],
                ['Ingreso', formatDateTime(factura.horaIngreso)],
                ['Ahora', new Date().toLocaleTimeString('es-CO')],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontWeight: 600, fontFamily: label === 'Placa' || label === 'Ingreso' || label === 'Ahora' ? 'var(--font-mono)' : 'inherit' }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.3)', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Tiempo</span>
                <span>{horasTranscurridas}h transcurridas → {horasACobrar}h a cobrar</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Tarifa/hora</span>
                <span className="mono">{formatCurrency(valorHora)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginTop: 4 }}>
                <span style={{ color: 'var(--neon-orange)', fontWeight: 700, fontSize: '1rem' }}>TOTAL A COBRAR</span>
                <span style={{ color: 'var(--neon-yellow)', fontWeight: 800, fontSize: '1.4rem', fontFamily: 'var(--font-mono)' }}>
                  {formatCurrency(valorEstimado)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={() => setStep('buscar')}>← Atrás</button>
              <button className="btn btn-primary btn-lg" onClick={confirmarPago} disabled={loading}>
                {loading ? 'Procesando...' : `💳 Confirmar Pago ${formatCurrency(valorEstimado)}`}
              </button>
            </div>
          </div>
        )}

        {/* STEP: Confirmado */}
        {step === 'confirmado' && facturaPagada && (
          <div className="text-center">
            <div className="talanquera-wrapper">
              <div className="talanquera-car">{facturaPagada.factura?.vehiculo?.tipo === 'moto' ? '🏍️' : '🚗'}</div>
              <div className="talanquera-base"><div className="talanquera-light"></div></div>
              <div className="talanquera-arm"></div>
            </div>
            <h3 style={{ color: 'var(--free-color)', marginBottom: 8, marginTop: -10 }}>¡Pago Registrado!</h3>
            <p className="mono" style={{ color: 'var(--neon-orange)', fontSize: '1.1rem' }}>
              {facturaPagada.factura?.codigo}
            </p>
            <p style={{ color: 'var(--neon-yellow)', fontWeight: 800, fontSize: '1.5rem', margin: '8px 0' }}>
              {formatCurrency(facturaPagada.factura?.valorTotal)}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
              Puesto liberado — El recibo se está imprimiendo
            </p>
            <div className="flex gap-2 justify-between">
              <button className="btn btn-secondary" onClick={() => handlePrint()}>🖨️ Reimprimir</button>
              <button className="btn btn-primary" onClick={onClose}>Cerrar</button>
            </div>
          </div>
        )}

        {facturaPagada && (
          <div style={{ display: 'none' }}>
            <ReciboTermico
              ref={reciboRef}
              tipo="salida"
              factura={facturaPagada.factura}
              horasCalculadas={facturaPagada.horasCalculadas}
              valorHora={facturaPagada.valorHora}
            />
          </div>
        )}
      </div>
    </div>
  );
}
