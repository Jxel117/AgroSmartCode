import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/endpoints.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const guardado = localStorage.getItem('agrosmart_usuario');
    if (guardado) setUsuario(JSON.parse(guardado));
    setCargando(false);
  }, []);

  async function login(correo, contra) {
    const { data } = await authApi.login(correo, contra);
    localStorage.setItem('agrosmart_token', data.token);
    localStorage.setItem('agrosmart_usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data.usuario;
  }

  async function logout() {
    try { await authApi.logout(); } catch { /* ignorar */ }
    localStorage.removeItem('agrosmart_token');
    localStorage.removeItem('agrosmart_usuario');
    setUsuario(null);
  }

  const esAdmin = usuario?.rol === 'ADMINISTRADOR';

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout, esAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}