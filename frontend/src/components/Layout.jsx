import { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket, useEventoSocket } from '../context/SocketContext.jsx';
import { alertasApi } from '../api/endpoints.js';
import {
  LayoutDashboard, Cpu, Map, SlidersHorizontal,
  Bell, Users, LogOut,
} from 'lucide-react';
import './Layout.css';

const navItems = [
  { to: '/', label: 'Dashboard', Icono: LayoutDashboard },
  { to: '/nodos', label: 'Dispositivos', Icono: Cpu },
  { to: '/parcelas', label: 'Terrenos', Icono: Map },
  { to: '/perfiles', label: 'Parámetros de Riego', Icono: SlidersHorizontal, soloAdmin: true },
  { to: '/alertas', label: 'Alertas', Icono: Bell, conContador: true },
  { to: '/usuarios', label: 'Usuarios', Icono: Users, soloAdmin: true },
];

export default function Layout() {
  const { usuario, logout, esAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { conectado } = useSocket();
  const [alertasNoLeidas, setAlertasNoLeidas] = useState(0);

  // Cargar contador inicial al montar
  useEffect(() => {
    alertasApi.contar()
      .then(({ data }) => setAlertasNoLeidas(data.total))
      .catch(() => setAlertasNoLeidas(0));
  }, []);

  // Cuando estamos en /alertas, refrescar el contador al cambiar de pestania
  // (porque el usuario probablemente las marco como leidas alli)
  useEffect(() => {
    if (location.pathname !== '/alertas') {
      alertasApi.contar()
        .then(({ data }) => setAlertasNoLeidas(data.total))
        .catch(() => {});
    }
  }, [location.pathname]);

  // Suscribirse a nuevas alertas por WebSocket: incrementar contador
  const onAlertaNueva = useCallback(() => {
    setAlertasNoLeidas((n) => n + 1);
  }, []);
  useEventoSocket('alerta_nueva', onAlertaNueva);

  async function salir() {
    await logout();
    navigate('/login');
  }

  const iniciales = `${usuario?.nombre?.[0] ?? ''}${usuario?.apellido?.[0] ?? ''}`;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-marca">
          <div className="sidebar-logo">
            <img src="/agrsmart1.svg" alt="AgroSmart" />
          </div>
          <div>
            <div className="sidebar-titulo">AgroSmart</div>
            <div className="sidebar-subtitulo">Riego inteligente</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems
            .filter((item) => !item.soloAdmin || esAdmin)
            .map(({ to, label, Icono, conContador }) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'activo' : ''}`}>
                <Icono size={19} strokeWidth={1.8} />
                <span style={{ flex: 1 }}>{label}</span>
                {conContador && alertasNoLeidas > 0 && (
                  <span className="sidebar-badge">
                    {alertasNoLeidas > 99 ? '99+' : alertasNoLeidas}
                  </span>
                )}
              </NavLink>
            ))}
        </nav>

        <div className="sidebar-pie">
          <div className="sidebar-rol">{esAdmin ? 'Administrador' : 'Agricultor'}</div>
        </div>
      </aside>

      <div className="contenido-principal">
        <header className="barra-superior">
          <div className="barra-usuario">
            <div className="avatar">{iniciales.toUpperCase()}</div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>
                {usuario?.nombre} {usuario?.apellido}
              </strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--gris-500)' }}>
                {usuario?.correo}
              </span>
              {usuario?.empresaIdentificador && (
                <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--verde-600)', fontWeight: 600, marginTop: '0.15rem' }}>
                  {usuario.empresaIdentificador}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '2rem' }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: conectado ? 'var(--verde-500)' : 'var(--gris-300)',
                boxShadow: conectado ? '0 0 8px var(--verde-400)' : 'none',
                transition: 'all var(--transicion-rapida)',
              }}
            />
            <span style={{ fontSize: '0.78rem', color: 'var(--gris-500)', fontWeight: 500 }}>
              {conectado ? 'Sincronizado' : 'Sin conexión'}
            </span>
          </div>

          <button className="btn btn-secundario" onClick={salir}>
            <LogOut size={16} strokeWidth={2} />
            Cerrar sesión
          </button>
        </header>

        <main className="area-contenido">
          <Outlet />
        </main>
      </div>
    </div>
  );
}