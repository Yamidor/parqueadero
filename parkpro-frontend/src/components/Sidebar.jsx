import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/puestos', label: 'Puestos', icon: '🅿️' },
  { to: '/admin/clientes', label: 'Clientes', icon: '👥' },
  { to: '/admin/trabajadores', label: 'Trabajadores', icon: '👤' },
  { to: '/admin/tarifas', label: 'Tarifas', icon: '💰' },
  { to: '/admin/facturas', label: 'Facturas', icon: '🧾' },
  { to: '/admin/reportes', label: 'Reportes', icon: '📈' },
  { to: '/admin/gastos', label: 'Gastos', icon: '💸' },
  { to: '/admin/nomina', label: 'Nómina', icon: '📋' },
  { to: '/admin/whatsapp', label: 'WhatsApp', icon: '💬' },
  { to: '/admin/configuracion', label: 'Configuración', icon: '⚙️' },
];

const cajeroLinks = [
  { to: '/cajero', label: 'Panel de Puestos', icon: '🅿️', end: true },
  { to: '/cajero/historial', label: 'Historial del Día', icon: '📋' },
];

export default function Sidebar() {
  const { user, logout, config } = useAuth();
  const navigate = useNavigate();
  const links = user?.rol === 'admin' ? adminLinks : cajeroLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🅿</div>
        <div>
          <div className="logo-name">{config?.nombreNegocio || 'ParkPro'}</div>
          <div className="logo-role">{user?.rol === 'admin' ? 'Administrador' : 'Cajero'}</div>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{user?.nombre?.charAt(0).toUpperCase()}</div>
        <div className="user-info">
          <div className="user-name">{user?.nombre}</div>
          <div className="user-email">{user?.email}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{link.icon}</span>
            <span className="nav-label">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="sidebar-logout" onClick={handleLogout}>
        <span>🚪</span>
        <span>Cerrar Sesión</span>
      </button>
    </aside>
  );
}
