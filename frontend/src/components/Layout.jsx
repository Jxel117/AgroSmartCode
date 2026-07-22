import { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket, useEventoSocket } from '../context/SocketContext.jsx';
import { alertasApi } from '../api/endpoints.js';
import useCerrarSesionAlUsarHistorial from '../hooks/useCerrarSesionAlUsarHistorial.js';
import {
  LayoutDashboard, Cpu, Map, SlidersHorizontal,
  Bell, Users, LogOut, User, ChevronDown, ShieldCheck,
} from 'lucide-react';
import './Layout.css';
import Avatar from './Avatar.jsx';
import { AnimatePresence } from 'framer-motion';
import TransicionPagina from './TransicionPagina.jsx';
import ModalAvatar from './ModalAvatar.jsx';

const navItems = [
  { to: '/', label: 'Inicio', Icono: LayoutDashboard, tambienActivoEn: ['/eventos'] },
    { to: '/alertas', label: 'Alertas', Icono: Bell, conContador: true },
  { to: '/nodos', label: 'Dispositivos', Icono: Cpu },
  { to: '/parcelas', label: 'Terrenos', Icono: Map },
  { to: '/perfiles', label: 'Configuraciones de riego', Icono: SlidersHorizontal, soloAdmin: true },
  { to: '/usuarios', label: 'Usuarios', Icono: Users, soloAdmin: true },
];

export default function Layout() {
  const { usuario, logout, esAdmin, esAuditor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { conectado } = useSocket();
  useCerrarSesionAlUsarHistorial();
  const [alertasNoLeidas, setAlertasNoLeidas] = useState(0);
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const [modalAvatarAbierto, setModalAvatarAbierto] = useState(false);
  const menuPerfilRef = useRef(null);

  const refrescarContadorAlertas = useCallback(() => {
    return alertasApi.contar()
      .then(({ data }) => setAlertasNoLeidas(data.total))
      .catch(() => { });
  }, []);

  // Cargar contador inicial de alertas
  useEffect(() => {
    refrescarContadorAlertas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refrescar contador al cambiar de pagina (cubre el caso de marcar leidas y luego navegar)
  useEffect(() => {
    refrescarContadorAlertas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // WebSocket: nueva alerta incrementa contador
  const onAlertaNueva = useCallback(() => {
    setAlertasNoLeidas((n) => n + 1);
  }, []);
  useEventoSocket('alerta_nueva', onAlertaNueva);

  // Cerrar menu de perfil al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuPerfilRef.current && !menuPerfilRef.current.contains(e.target)) {
        setMenuPerfilAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function salir() {
    setMenuPerfilAbierto(false);
    await logout();
    navigate('/login');
  }

  function abrirModalAvatar() {
    setMenuPerfilAbierto(false);
    setModalAvatarAbierto(true);
  }

  return (
    <div className="layout-app">
      {/* ===== HEADER HORIZONTAL ===== */}
      <header className="header-principal">
        <div className="header-contenido">
          {/* Marca: logo + nombre */}
          <div className="header-marca">
            <img src="/logo_agrosmart_planta.svg" alt="AgroSmart" className="header-logo" />
            <div className="header-marca-texto">
              <span className="header-titulo">AgroSmart</span>
              <span className="header-subtitulo">Riego inteligente</span>
            </div>
          </div>

          {/* Navegacion principal */}
          <nav className="header-nav">
            {esAuditor ? (
              <NavLink to="/" end className={({ isActive }) => `header-nav-item ${isActive ? 'activo' : ''}`}>
                <LayoutDashboard size={17} strokeWidth={1.8} />
                <span>Inicio</span>
              </NavLink>
            ) : (
              navItems
                .filter((item) => !item.soloAdmin || esAdmin)
                .map(({ to, label, Icono, conContador, tambienActivoEn }) => {
                  const activoExtra = tambienActivoEn?.includes(location.pathname);
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === '/'}
                      className={({ isActive }) => `header-nav-item ${isActive || activoExtra ? 'activo' : ''}`}
                    >
                      <Icono size={17} strokeWidth={1.8} />
                      <span>{label}</span>
                      {conContador && alertasNoLeidas > 0 && (
                        <span className="header-badge">
                          {alertasNoLeidas > 99 ? '99+' : alertasNoLeidas}
                        </span>
                      )}
                    </NavLink>
                  );
                })
            )}
            {(esAdmin || esAuditor) && (
              <a
                href={`http://3.93.100.166:8081?token=${sessionStorage.getItem('agrosmart_token')}`}
                //Para trabajar en local, descomentar la siguiente linea y comentar la anterior
                //href={`${window.location.protocol}//${window.location.hostname}:8081?token=${sessionStorage.getItem('agrosmart_token')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="header-nav-item"
                title="Panel de auditoría (microservicio externo)"
              >
                <ShieldCheck size={17} strokeWidth={1.8} />
                <span>Auditoría</span>
              </a>
            )}
          </nav>

          {/* Estado de sincronizacion + Avatar */}
          <div className="header-acciones">
            <div className="header-sync">
              <span
                className="header-sync-dot"
                style={{
                  background: conectado ? 'var(--verde-500)' : 'var(--gris-300)',
                  boxShadow: conectado ? '0 0 8px var(--verde-400)' : 'none',
                }}
              />
              <span className="header-sync-texto">
                {conectado ? 'Sincronizado' : 'Sin conexión'}
              </span>
            </div>

            {/* Menu de perfil */}
            <div className="header-perfil" ref={menuPerfilRef}>
              <button
                className="header-perfil-boton"
                onClick={() => setMenuPerfilAbierto(!menuPerfilAbierto)}
              >
                <Avatar usuario={usuario} tamano="md" />
                <ChevronDown size={14} strokeWidth={2} className={`header-perfil-chevron ${menuPerfilAbierto ? 'abierto' : ''}`} />
              </button>

              {menuPerfilAbierto && (
                <div className="header-perfil-menu">
                  <div className="header-perfil-info">
                    <div className="header-perfil-nombre">
                      {usuario?.nombre} {usuario?.apellido}
                    </div>
                    <div className="header-perfil-correo">{usuario?.correo}</div>
                    {usuario?.empresaIdentificador && (
                      <div className="header-perfil-empresa">{usuario.empresaIdentificador}</div>
                    )}
                    <div className="header-perfil-rol">
                      {esAuditor ? 'Auditor' : esAdmin ? 'Administrador' : 'Agricultor'}
                    </div>
                  </div>
                  <div className="header-perfil-separador" />
                  {!esAuditor && (
                    <button className="header-perfil-opcion" onClick={abrirModalAvatar}>
                      <User size={15} strokeWidth={1.8} />
                      Cambiar avatar
                    </button>
                  )}
                  <button className="header-perfil-opcion header-perfil-salir" onClick={salir}>
                    <LogOut size={15} strokeWidth={1.8} />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== CONTENIDO ===== */}
      <main className="area-contenido">
        <div className="area-contenido-interno">
          <AnimatePresence mode="wait">
            <TransicionPagina key={location.pathname}>
              <Outlet context={{ refrescarContadorAlertas }} />
            </TransicionPagina>
          </AnimatePresence>
        </div>
      </main>
      <ModalAvatar
        abierto={modalAvatarAbierto}
        alCerrar={() => setModalAvatarAbierto(false)}
      />
    </div>
  );
}