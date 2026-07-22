import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Si estando autenticado se usan las flechas de atras/adelante del
// navegador, se cierra la sesion de verdad (revoca el token en el
// servidor y limpia sessionStorage) y se manda a login. Asi, "adelante"
// nunca puede devolver al dashboard sin volver a iniciar sesion.
export default function useCerrarSesionAlUsarHistorial() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const disparado = useRef(false);

  useEffect(() => {
    async function alUsarHistorial() {
      if (disparado.current) return;
      disparado.current = true;
      await logout();
      navigate('/login', { replace: true });
    }
    window.addEventListener('popstate', alUsarHistorial);
    return () => window.removeEventListener('popstate', alUsarHistorial);
  }, [logout, navigate]);
}
