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
  useEffect(() => {
    function alCerrar() {
      // sessionStorage se limpia solo al cerrar pestana.
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

  /**
   * Actualiza datos del usuario en memoria y en sessionStorage.
   * Usado por la pagina de Perfil tras cambiar datos.
   */
  function actualizarUsuario(parcial) {
    setUsuario((prev) => {
      if (!prev) return prev;
      const actualizado = { ...prev, ...parcial };
      sessionStorage.setItem('agrosmart_usuario', JSON.stringify(actualizado));
      return actualizado;
    });
  }

  const esAdmin = usuario?.rol === 'ADMINISTRADOR';
  const esAuditor = usuario?.rol === 'AUDITOR';

  return (
    <AuthContext.Provider value={{
      usuario,
      cargando,
      login,
      logout,
      esAdmin,
      esAuditor,
      setUsuario,
      actualizarUsuario,
    }}>
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