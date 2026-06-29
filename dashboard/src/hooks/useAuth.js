import { useState, useEffect, useCallback } from 'react';

function decodeJWT(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Verificar expiración
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }
    return {
      id: payload.sub,
      correo: payload.correo,
      rol: payload.rol,
      empresa: payload.empresa,
    };
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Intentar leer token de query params (vino desde AgroSmart)
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');

    if (tokenParam) {
      const decoded = decodeJWT(tokenParam);
      if (decoded && decoded.rol === 'ADMINISTRADOR') {
        localStorage.setItem('audit_token', tokenParam);
        setUser(decoded);
        // Limpiar URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    } else {
      // 2. Intentar leer de localStorage
      const stored = localStorage.getItem('audit_token');
      if (stored) {
        const decoded = decodeJWT(stored);
        if (decoded && decoded.rol === 'ADMINISTRADOR') {
          setUser(decoded);
        } else {
          localStorage.removeItem('audit_token');
        }
      }
    }

    setLoading(false);
  }, []);

  const login = useCallback((token) => {
    const decoded = decodeJWT(token);
    if (decoded && decoded.rol === 'ADMINISTRADOR') {
      localStorage.setItem('audit_token', token);
      setUser(decoded);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('audit_token');
    setUser(null);
  }, []);

  return { user, loading, login, logout };
}
