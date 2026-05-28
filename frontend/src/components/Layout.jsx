import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Layout.css';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
  { to: '/parcelas', label: 'Parcelas', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { to: '/nodos', label: 'Nodos', icon: 'M5 12h14M5 12a2 2 0 100-4 2 2 0 000 4zm14 0a2 2 0 100-4 2 2 0 000 4zM12 19a2 2 0 100-4 2 2 0 000 4z' },
  { to: '/alertas', label: 'Alertas', icon: 'M12 2L1 21h22L12 2zm0 6v6m0 4h.01' },
  { to: '/perfiles', label: 'Perfiles', icon: 'M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z', soloAdmin: true },
  { to: '/usuarios', label: 'Usuarios', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75', soloAdmin: true },
];

export default function Layout() {
  const { usuario, logout, esAdmin } = useAuth();
  const navigate = useNavigate();

  async function salir() {
    await logout();
    navigate('/login');
  }

  const iniciales = `${usuario?.nombre?.[0] ?? ''}${usuario?.apellido?.[0] ?? ''}`;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-marca">
          <div className="sidebar-logo">AS</div>
          <div>
            <div className="sidebar-titulo">AgroSmart</div>
            <div className="sidebar-subtitulo">Riego inteligente</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems
            .filter((item) => !item.soloAdmin || esAdmin)
            .map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'activo' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
                <span>{item.label}</span>
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
              <div className="usuario-nombre">{usuario?.nombre} {usuario?.apellido}</div>
              <div className="usuario-correo">{usuario?.correo}</div>
            </div>
          </div>
          <button className="btn btn-secundario" onClick={salir}>Cerrar sesion</button>
        </header>

        <main className="area-contenido">
          <Outlet />
        </main>
      </div>
    </div>
  );
}