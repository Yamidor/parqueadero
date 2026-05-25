import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, config } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const usuario = await login(email, password);
      navigate(usuario.rol === 'admin' ? '/admin' : '/cajero', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated parking lot background */}
      <div className="login-bg">
        <div className="parking-lines">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="parking-line" style={{ animationDelay: `${i * 0.3}s` }} />
          ))}
        </div>
        <div className="car-lights">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="car-light" style={{ animationDelay: `${i * 1.5}s`, top: `${20 + i * 20}%` }} />
          ))}
        </div>
        <div className="bg-glow bg-glow-1" />
        <div className="bg-glow bg-glow-2" />
      </div>

      {/* Login card */}
      <div className="login-container">
        <div className="login-card glass-card">
          {/* Logo */}
          <div className="login-logo">
            <div className="login-logo-icon">🅿</div>
            <div className="login-logo-text">
              <h1 className="login-brand">{config?.nombreNegocio || 'ParkPro'}</h1>
              <p className="login-tagline">Sistema de Parqueadero Profesional</p>
            </div>
          </div>

          <div className="login-divider" />

          <h2 className="login-title">Iniciar Sesión</h2>
          <p className="login-subtitle">Ingresa tus credenciales para continuar</p>

          {error && (
            <div className="alert alert-error">
              <span>⚠️ {error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="admin@parkpro.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? (
                <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Ingresando...</>
              ) : (
                <>🔐 Ingresar al Sistema</>
              )}
            </button>
          </form>
        </div>

        <div className="login-footer">
          <p>{config?.nombreNegocio || 'ParkPro'} &copy; {new Date().getFullYear()} — Sistema de Parqueadero</p>
        </div>
      </div>
    </div>
  );
}
