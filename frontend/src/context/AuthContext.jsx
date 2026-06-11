import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/endpoints.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const guardado = sessionStorage.getItem('agrosmart_usuario');
    if (guardado) setUsuario(JSON.parse(guardado));
    setCargando(false);
  }, []);

  // Refuerzo: al cerrar/recargar la pestaña, la sesión no persiste.
  // sessionStorage ya lo hace, esto es un seguro adicional.
  useEffect(() => {
    function alCerrar() {
      // No borramos aquí porque sessionStorage ya se limpia solo al cerrar pestaña.
      // Este hook queda como punto de extensión si se quisiera notificar al backend.
    }

    window.addEventListener('beforeunload', alCerrar);

    return () => window.removeEventListener('beforeunload', alCerrar);
  }, []);

  async function login(correo, contra, captchaToken) {
    const { data } = await authApi.login(correo, contra, captchaToken);
    sessionStorage.setItem('agrosmart_token', data.token);
    sessionStorage.setItem('agrosmart_usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data.usuario;
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      /* ignorar */
    }

    sessionStorage.removeItem('agrosmart_token');
    sessionStorage.removeItem('agrosmart_usuario');
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

  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return ctx;
}