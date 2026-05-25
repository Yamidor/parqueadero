import { forwardRef, useState, useEffect } from 'react';
import api from '../services/api';
import { formatDateTime, formatDate } from '../utils/formatCurrency';
import { formatCurrency } from '../utils/formatCurrency';

const ReciboTermico = forwardRef(function ReciboTermico(
  { tipo, factura, tarifa, horasCalculadas, valorHora, mensualidad, puestoNumero },
  ref
) {
  const [config, setConfig] = useState({ nombreNegocio: 'ParkPro', nit: '', direccion: '', telefono: '' });

  useEffect(() => {
    api.get('/configuracion').then((res) => setConfig(res.data)).catch(() => {});
  }, []);

  if (!factura) return null;

  const cliente = factura.cliente;
  const vehiculo = factura.vehiculo;
  const puesto = factura.puesto;

  return (
    <div ref={ref} className="thermal-receipt">
      <style>{`
        .thermal-receipt {
          max-width: 280px;
          margin: 0 auto;
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          color: #000;
          background: #fff;
          padding: 12px 8px;
          line-height: 1.5;
        }
        .tr-center { text-align: center; }
        .tr-bold { font-weight: bold; }
        .tr-big { font-size: 14px; }
        .tr-huge { font-size: 16px; font-weight: bold; }
        .tr-divider {
          border-top: 1px dashed #000;
          margin: 6px 0;
        }
        .tr-row {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }
        .tr-total {
          font-size: 14px;
          font-weight: bold;
          border-top: 2px solid #000;
          padding-top: 6px;
          margin-top: 4px;
        }
        .tr-qr {
          text-align: center;
          margin: 8px 0;
        }
        .tr-qr img {
          width: 120px;
          height: 120px;
          display: block;
          margin: 0 auto;
        }
        .tr-footer {
          text-align: center;
          font-size: 10px;
          margin-top: 6px;
        }
      `}</style>

      {/* Header */}
      <div className="tr-center tr-bold tr-big">{config.nombreNegocio}</div>
      {config.nit && <div className="tr-center">NIT: {config.nit}</div>}
      {config.direccion && <div className="tr-center">{config.direccion}</div>}
      {config.telefono && <div className="tr-center">Tel: {config.telefono}</div>}

      <div className="tr-divider" />

      {/* Invoice type */}
      <div className="tr-center tr-bold">
        {tipo === 'entrada' && 'RECIBO DE ENTRADA'}
        {tipo === 'salida' && 'FACTURA DE VENTA'}
        {tipo === 'lavado' && 'SERVICIO DE LAVADO'}
        {tipo === 'mensualidad' && 'MENSUALIDAD'}
      </div>
      <div className="tr-center tr-bold">No: {factura.codigo}</div>

      <div className="tr-divider" />

      {/* Client info */}
      <div className="tr-row">
        <span>Cliente:</span>
        <span>{cliente?.nombre} {cliente?.apellido}</span>
      </div>
      {vehiculo && (
        <>
          <div className="tr-row">
            <span>Placa:</span>
            <span>{vehiculo.placa}</span>
          </div>
          <div className="tr-row">
            <span>Tipo:</span>
            <span>{vehiculo.tipo === 'moto' ? 'Moto' : 'Carro'}</span>
          </div>
        </>
      )}
      {(puesto || puestoNumero) && (
        <div className="tr-row">
          <span>Puesto:</span>
          <span>#{puesto?.numero || puestoNumero}</span>
        </div>
      )}

      <div className="tr-divider" />

      {/* Entry receipt */}
      {tipo === 'entrada' && (
        <>
          <div className="tr-row">
            <span>Ingreso:</span>
            <span>{formatDateTime(factura.horaIngreso)}</span>
          </div>
          {tarifa > 0 && (
            <div className="tr-row">
              <span>Valor/hora:</span>
              <span>{formatCurrency(tarifa)}</span>
            </div>
          )}
          <div className="tr-divider" />
          {factura.codigoQR && (
            <div className="tr-qr">
              <img src={factura.codigoQR} alt="QR Code" />
            </div>
          )}
          <div className="tr-footer">Conserve este recibo para su salida</div>
        </>
      )}

      {/* Exit receipt */}
      {tipo === 'salida' && (
        <>
          <div className="tr-row">
            <span>Ingreso:</span>
            <span>{formatDateTime(factura.horaIngreso)}</span>
          </div>
          <div className="tr-row">
            <span>Salida:</span>
            <span>{formatDateTime(factura.horaSalida)}</span>
          </div>
          {horasCalculadas && (
            <div className="tr-row">
              <span>Horas:</span>
              <span>{horasCalculadas} hrs</span>
            </div>
          )}
          {valorHora && (
            <div className="tr-row">
              <span>Valor/hora:</span>
              <span>{formatCurrency(valorHora)}</span>
            </div>
          )}
          <div className="tr-divider" />
          <div className="tr-row tr-total">
            <span>TOTAL:</span>
            <span>{formatCurrency(factura.valorTotal)}</span>
          </div>
        </>
      )}

      {/* Wash receipt */}
      {tipo === 'lavado' && (
        <>
          <div className="tr-row">
            <span>Servicio:</span>
            <span>
              Lavado {factura.subtipoLavado === 'full' ? 'Full' : 'Normal'} {vehiculo?.tipo === 'moto' ? 'Moto' : 'Carro'}
            </span>
          </div>
          <div className="tr-row">
            <span>Fecha:</span>
            <span>{formatDateTime(factura.createdAt || new Date())}</span>
          </div>
          <div className="tr-divider" />
          <div className="tr-row tr-total">
            <span>TOTAL:</span>
            <span>{formatCurrency(factura.valorTotal)}</span>
          </div>
        </>
      )}

      {/* Monthly receipt */}
      {tipo === 'mensualidad' && mensualidad && (
        <>
          <div className="tr-row">
            <span>Desde:</span>
            <span>{mensualidad.fechaInicio}</span>
          </div>
          <div className="tr-row">
            <span>Hasta:</span>
            <span>{mensualidad.fechaFin}</span>
          </div>
          <div className="tr-divider" />
          <div className="tr-row tr-total">
            <span>VALOR:</span>
            <span>{formatCurrency(factura.valorTotal)}</span>
          </div>
          {factura.codigoQR && (
            <div className="tr-qr">
              <img src={factura.codigoQR} alt="QR Code" />
            </div>
          )}
        </>
      )}

      <div className="tr-divider" />
      <div className="tr-footer">
        <div>Gracias por preferirnos</div>
        <div>{new Date().toLocaleString('es-CO')}</div>
      </div>
    </div>
  );
});

export default ReciboTermico;
