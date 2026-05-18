import { useState, useEffect, useRef } from 'react';
import socket from '../services/socket';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { calcularHoras, formatDuration } from '../utils/calcularHoras';
import '../styles/PanelPuestos.css';

function TooltipPuesto({ puesto, tarifas }) {
  const [tiempoActual, setTiempoActual] = useState('');
  const [valorActual, setValorActual] = useState(0);

  useEffect(() => {
    if (!puesto.facturaActiva || puesto.facturaActiva.tipoServicio !== 'parqueo') return;

    const updateCost = () => {
      const { diffMs, horasACobrar } = calcularHoras(puesto.facturaActiva.horaIngreso);
      setTiempoActual(formatDuration(diffMs));
      const tipoTarifa = puesto.facturaActiva.vehiculo?.tipo === 'moto' ? 'hora_moto' : 'hora_carro';
      const tarifa = tarifas.find((t) => t.tipo === tipoTarifa);
      setValorActual(horasACobrar * (tarifa?.valor || 0));
    };

    updateCost();
    const interval = setInterval(updateCost, 30000);
    return () => clearInterval(interval);
  }, [puesto, tarifas]);

  const factura = puesto.facturaActiva;
  const mensualidad = puesto.mensualidadActiva;

  return (
    <div className="tooltip-puesto">
      {factura ? (
        <>
          <div className="tooltip-header">
            <span className="tooltip-tipo">
              {factura.tipoServicio === 'mensualidad' ? '📅 Mensualidad' : '🕐 Parqueo por Horas'}
            </span>
          </div>
          <div className="tooltip-row">
            <span>👤</span>
            <span>{factura.cliente?.nombre} {factura.cliente?.apellido}</span>
          </div>
          <div className="tooltip-row">
            <span>{factura.vehiculo?.tipo === 'moto' ? '🏍️' : '🚗'}</span>
            <span className="mono">{factura.vehiculo?.placa} — {factura.vehiculo?.tipo}</span>
          </div>
          {factura.tipoServicio === 'parqueo' && (
            <>
              <div className="tooltip-row">
                <span>⏱️</span>
                <span>{tiempoActual || '...'} transcurrido</span>
              </div>
              <div className="tooltip-row highlight">
                <span>💰</span>
                <span>{formatCurrency(valorActual)}</span>
              </div>
            </>
          )}
          {factura.tipoServicio === 'mensualidad' && mensualidad && (
            <>
              <div className="tooltip-row">
                <span>📅</span>
                <span>Vence: {mensualidad.fechaFin}</span>
              </div>
              <div className="tooltip-row highlight">
                <span>✅</span>
                <span>{mensualidad.diasRestantes} días restantes</span>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="tooltip-row"><span>✅ Disponible</span></div>
      )}
    </div>
  );
}

function PuestoCelda({ puesto, tarifas, onClick }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef(null);

  const getEstadoClass = () => {
    if (puesto.estado === 'libre') return 'puesto-libre';
    if (puesto.facturaActiva?.tipoServicio === 'mensualidad') return 'puesto-mensualidad';
    return 'puesto-ocupado';
  };

  return (
    <div
      className={`puesto-celda ${getEstadoClass()}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => onClick && onClick(puesto)}
    >
      <div className="puesto-numero">#{puesto.numero}</div>
      <div className="puesto-icon">
        {puesto.tipo === 'moto' ? '🏍️' : puesto.tipo === 'carro' ? '🚗' : '🔄'}
      </div>
      {puesto.estado === 'ocupado' && puesto.facturaActiva && (
        <div className="puesto-placa mono">
          {puesto.facturaActiva.vehiculo?.placa || '---'}
        </div>
      )}
      {puesto.estado === 'libre' && (
        <div className="puesto-libre-label">LIBRE</div>
      )}

      {showTooltip && (
        <TooltipPuesto puesto={puesto} tarifas={tarifas} />
      )}
    </div>
  );
}

export default function PanelPuestos({ onPuestoClick, showHeader = true }) {
  const [puestos, setPuestos] = useState([]);
  const [tarifas, setTarifas] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarDatos = async () => {
    try {
      const [pRes, tRes, fRes, mRes] = await Promise.all([
        api.get('/puestos'),
        api.get('/tarifas'),
        api.get('/facturas?estado=pendiente&tipoServicio=parqueo'),
        api.get('/mensualidades'),
      ]);

      const facturasPendientes = fRes.data;
      const mensualidadesActivas = mRes.data.filter((m) => m.estado === 'activo');

      const puestosConDatos = pRes.data.map((p) => {
        const facturaActiva = facturasPendientes.find((f) => f.puestoId === p.id)
          || mRes.data.find((m) => m.puestoId === p.id && m.estado === 'activo')?.factura;

        const mensualidadActiva = mensualidadesActivas.find((m) => m.puestoId === p.id);
        if (mensualidadActiva && facturaActiva) {
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);
          const fin = new Date(mensualidadActiva.fechaFin);
          mensualidadActiva.diasRestantes = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
        }

        return { ...p, facturaActiva, mensualidadActiva };
      });

      setPuestos(puestosConDatos);
      setTarifas(tRes.data);
    } catch (err) {
      console.error('Error cargando puestos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();

    socket.on('puesto_actualizado', (puestoActualizado) => {
      cargarDatos(); // Reload full data on update
    });
    socket.on('factura_pagada', () => cargarDatos());
    socket.on('nueva_factura', () => cargarDatos());

    return () => {
      socket.off('puesto_actualizado');
      socket.off('factura_pagada');
      socket.off('nueva_factura');
    };
  }, []);

  const libres = puestos.filter((p) => p.estado === 'libre').length;
  const ocupados = puestos.filter((p) => p.estado === 'ocupado').length;

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <span>Cargando puestos...</span>
      </div>
    );
  }

  return (
    <div className="panel-puestos">
      {showHeader && (
        <div className="puestos-stats">
          <div className="stat-item stat-libre">
            <span className="stat-num">{libres}</span>
            <span className="stat-label">Libres</span>
          </div>
          <div className="stat-item stat-ocupado">
            <span className="stat-num">{ocupados}</span>
            <span className="stat-label">Ocupados</span>
          </div>
          <div className="stat-item">
            <span className="stat-num">{puestos.length}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-socket">
            <span className="socket-dot" />
            <span>Tiempo real</span>
          </div>
        </div>
      )}

      {puestos.length === 0 ? (
        <div className="empty-puestos">
          <div style={{ fontSize: '3rem' }}>🅿️</div>
          <p>No hay puestos configurados</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            El administrador debe crear los puestos del parqueadero
          </p>
        </div>
      ) : (
        <div className="puestos-grid">
          {puestos.map((puesto) => (
            <PuestoCelda
              key={puesto.id}
              puesto={puesto}
              tarifas={tarifas}
              onClick={onPuestoClick}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="puestos-leyenda">
        <span className="leyenda-item">
          <span className="leyenda-dot dot-libre" /> Libre
        </span>
        <span className="leyenda-item">
          <span className="leyenda-dot dot-ocupado" /> Parqueo
        </span>
        <span className="leyenda-item">
          <span className="leyenda-dot dot-mensualidad" /> Mensualidad
        </span>
      </div>
    </div>
  );
}
