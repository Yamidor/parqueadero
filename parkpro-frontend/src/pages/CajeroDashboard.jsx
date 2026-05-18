import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PanelPuestos from '../components/PanelPuestos';
import ModalEntrada from '../components/ModalEntrada';
import ModalSalida from '../components/ModalSalida';
import ModalLavado from '../components/ModalLavado';
import ModalMensualidad from '../components/ModalMensualidad';
import '../styles/CajeroDashboard.css';

export default function CajeroDashboard() {
  const { user } = useAuth();
  const [modal, setModal] = useState(null); // 'entrada'|'salida'|'lavado'|'mensualidad'

  return (
    <div className="cajero-layout">
      {/* Action sidebar */}
      <aside className="cajero-actions">
        <div className="cajero-welcome">
          <div className="welcome-icon">👷</div>
          <div>
            <div className="welcome-name">{user?.nombre}</div>
            <div className="welcome-role">Cajero en turno</div>
          </div>
        </div>

        <div className="actions-title">Acciones Rápidas</div>

        <button className="action-btn action-entrada" onClick={() => setModal('entrada')}>
          <span className="action-icon">🚗</span>
          <div>
            <div className="action-name">Registrar Entrada</div>
            <div className="action-desc">Parqueo por horas</div>
          </div>
        </button>

        <button className="action-btn action-salida" onClick={() => setModal('salida')}>
          <span className="action-icon">🏁</span>
          <div>
            <div className="action-name">Registrar Salida</div>
            <div className="action-desc">Escanear QR o manual</div>
          </div>
        </button>

        <button className="action-btn action-lavado" onClick={() => setModal('lavado')}>
          <span className="action-icon">🚿</span>
          <div>
            <div className="action-name">Servicio de Lavado</div>
            <div className="action-desc">Cobro inmediato</div>
          </div>
        </button>

        <button className="action-btn action-mensualidad" onClick={() => setModal('mensualidad')}>
          <span className="action-icon">📅</span>
          <div>
            <div className="action-name">Mensualidad</div>
            <div className="action-desc">Registrar / Renovar</div>
          </div>
        </button>

        <div className="actions-divider" />

        <div className="live-indicator">
          <span className="socket-dot" />
          <span>Panel actualizado en vivo</span>
        </div>
      </aside>

      {/* Main panel */}
      <main className="cajero-main">
        <div className="cajero-header">
          <div>
            <h1 className="section-title">🅿️ Panel de Puestos</h1>
            <p className="section-subtitle">Haz clic en un puesto para más detalles</p>
          </div>
          <div className="cajero-date">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <PanelPuestos />
      </main>

      {/* Modals */}
      {modal === 'entrada' && <ModalEntrada onClose={() => setModal(null)} />}
      {modal === 'salida' && <ModalSalida onClose={() => setModal(null)} />}
      {modal === 'lavado' && <ModalLavado onClose={() => setModal(null)} />}
      {modal === 'mensualidad' && <ModalMensualidad onClose={() => setModal(null)} />}
    </div>
  );
}
