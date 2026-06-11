import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Envuelve rutas que solo deben verse SIN sesion (como el login).
// Si ya hay sesion, redirige al dashboard.
export default function RutaPublica({ children }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (usuario) return <Navigate to="/" replace />;

  return children;
}