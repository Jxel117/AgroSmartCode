import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import PantallaCarga from './PantallaCarga.jsx';

export default function RutaProtegida({ children, soloAdmin = false }) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return <PantallaCarga />;
  }

  if (!usuario) return <Navigate to="/bienvenida" replace />;
  if (soloAdmin && usuario.rol !== 'ADMINISTRADOR') return <Navigate to="/" replace />;

  // El auditor solo ve el dashboard completo (todo en una pagina)
  if (usuario.rol === 'AUDITOR' && location.pathname !== '/') {
    return <Navigate to="/" replace />;
  }

  return children;
}