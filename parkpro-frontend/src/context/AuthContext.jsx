import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import socket from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ nombreNegocio: 'ParkPro' });

  useEffect(() => {
    api.get('/configuracion').then(res => setConfig(res.data)).catch(() => {});
    
    const token = localStorage.getItem('parkpro_token');
    const savedUser = localStorage.getItem('parkpro_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      socket.connect();
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, usuario } = res.data;
    localStorage.setItem('parkpro_token', token);
    localStorage.setItem('parkpro_user', JSON.stringify(usuario));
    setUser(usuario);
    socket.connect();
    return usuario;
  };

  const logout = () => {
    localStorage.removeItem('parkpro_token');
    localStorage.removeItem('parkpro_user');
    setUser(null);
    socket.disconnect();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, config, setConfig }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
