import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-center" style={{ height: '100vh' }}>
        <div className="spinner" />
        <span>Cargando ParkPro...</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.rol !== role) {
    return <Navigate to={user.rol === 'admin' ? '/admin' : '/cajero'} replace />;
  }

  return children;
}
