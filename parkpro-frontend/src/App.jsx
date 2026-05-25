import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import CajeroDashboard from './pages/CajeroDashboard';
import Puestos from './pages/Puestos';
import Clientes from './pages/Clientes';
import Trabajadores from './pages/Trabajadores';
import Tarifas from './pages/Tarifas';
import Reportes from './pages/Reportes';
import Gastos from './pages/Gastos';
import Nomina from './pages/Nomina';
import Configuracion from './pages/Configuracion';
import Whatsapp from './pages/Whatsapp';

// Layout with sidebar for authenticated pages
function AdminLayout({ children }) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div className="main-with-sidebar" style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

function CajeroLayout({ children }) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div className="main-with-sidebar" style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Admin routes */}
          <Route path="/admin" element={
            <PrivateRoute role="admin">
              <AdminLayout><AdminDashboard /></AdminLayout>
            </PrivateRoute>
          } />
          <Route path="/admin/puestos" element={
            <PrivateRoute role="admin">
              <AdminLayout><Puestos /></AdminLayout>
            </PrivateRoute>
          } />
          <Route path="/admin/clientes" element={
            <PrivateRoute role="admin">
              <AdminLayout><Clientes /></AdminLayout>
            </PrivateRoute>
          } />
          <Route path="/admin/trabajadores" element={
            <PrivateRoute role="admin">
              <AdminLayout><Trabajadores /></AdminLayout>
            </PrivateRoute>
          } />
          <Route path="/admin/tarifas" element={
            <PrivateRoute role="admin">
              <AdminLayout><Tarifas /></AdminLayout>
            </PrivateRoute>
          } />
          <Route path="/admin/reportes" element={
            <PrivateRoute role="admin">
              <AdminLayout><Reportes /></AdminLayout>
            </PrivateRoute>
          } />
          <Route path="/admin/gastos" element={
            <PrivateRoute role="admin">
              <AdminLayout><Gastos /></AdminLayout>
            </PrivateRoute>
          } />
          <Route path="/admin/nomina" element={
            <PrivateRoute role="admin">
              <AdminLayout><Nomina /></AdminLayout>
            </PrivateRoute>
          } />
          <Route path="/admin/configuracion" element={
            <PrivateRoute role="admin">
              <AdminLayout><Configuracion /></AdminLayout>
            </PrivateRoute>
          } />
          <Route path="/admin/whatsapp" element={
            <PrivateRoute role="admin">
              <AdminLayout><Whatsapp /></AdminLayout>
            </PrivateRoute>
          } />

          {/* Cajero routes */}
          <Route path="/cajero" element={
            <PrivateRoute role="cajero">
              <CajeroLayout><CajeroDashboard /></CajeroLayout>
            </PrivateRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
