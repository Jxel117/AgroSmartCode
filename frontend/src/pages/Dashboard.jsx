import { useState, useEffect } from 'react';
import { Building2, Users, MapPin } from 'lucide-react';

import { useAuth } from '../context/AuthContext.jsx';
import { adminApi } from '../api/endpoints.js';
import { claseBadgeEstado } from '../utils/formato.js';
import { iniciales } from '../utils/avatar.js';

import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import IoTDashboard from './IoTDashboard.jsx';

import './Dashboard.css';

function AuditorDashboard() {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    adminApi.dashboard()
      .then(({ data: d }) => setData(d))
      .catch(() => setData(null))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return (
      <div className="audit-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="tarjeta audit-error">
        No se pudieron cargar los datos del dashboard.
      </div>
    );
  }

  const cards = [
    { titulo: 'Empresas', valor: data.resumen.totalEmpresas, Icono: Building2, color: 'var(--verde-600)', fondo: 'var(--verde-50)' },
    { titulo: 'Usuarios', valor: data.resumen.totalUsuarios, Icono: Users, color: 'var(--azul)', fondo: 'var(--azul-50)' },
    { titulo: 'Activos', valor: data.resumen.activos, Icono: Users, color: 'var(--verde-500)', fondo: 'var(--verde-100)' },
    { titulo: 'Suspendidos', valor: data.resumen.suspendidos, Icono: Users, color: 'var(--rojo)', fondo: 'var(--rojo-50)' },
  ];

  return (
    <div className="audit-pagina">
      <EncabezadoPagina
        titulo="Inicio"
        descripcion="Vista de auditoría de solo lectura: empresas, usuarios y accesos registrados en el sistema."
      />

      <div className="audit-fullscreen">
        <div className="audit-metricas-row">
          {cards.map((c) => (
            <div key={c.titulo} className="tarjeta audit-metrica">
              <div className="audit-metrica-icono" style={{ color: c.color, background: c.fondo }}>
                <c.Icono size={20} strokeWidth={1.75} />
              </div>
              <div className="audit-metrica-cuerpo">
                <span className="audit-metrica-valor" style={{ color: c.color }}>{c.valor}</span>
                <span className="audit-metrica-titulo">{c.titulo}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="audit-tablas-row">
          <div className="tarjeta audit-seccion audit-seccion-empresas">
            <div className="audit-seccion-header">
              <Building2 size={16} strokeWidth={1.5} style={{ color: 'var(--verde-600)' }} />
              <span>Fincas disponibles</span>
            </div>
            <div className="audit-seccion-body audit-lista-empresas">
              {data.empresas.map((e) => (
                <div key={e.nombre} className="audit-empresa-item">
                  <div className="audit-empresa-icono">
                    <Building2 size={18} strokeWidth={1.75} />
                  </div>
                  <div className="audit-empresa-nombre">{e.nombre}</div>
                  <div className="audit-empresa-stats">
                    <span className="badge badge-azul" title="Usuarios">
                      <Users size={11} strokeWidth={2} /> {e.totalUsuarios}
                    </span>
                    <span className="badge badge-verde" title="Terrenos">
                      <MapPin size={11} strokeWidth={2} /> {e.totalFincas}
                    </span>
                  </div>
                </div>
              ))}
              {data.empresas.length === 0 && (
                <div className="audit-empty">No hay empresas registradas.</div>
              )}
            </div>
          </div>

          <div className="tarjeta audit-seccion audit-seccion-usuarios">
            <div className="audit-seccion-header">
              <Users size={16} strokeWidth={1.5} style={{ color: 'var(--azul)' }} />
              <span>Usuarios del sistema</span>
            </div>
            <div className="audit-seccion-body">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Empresa</th>
                    <th>Rol</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.usuarios.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="audit-usuario-nombre">
                          <span className="audit-usuario-avatar">{iniciales(u)}</span>
                          {u.nombre} {u.apellido}
                        </div>
                      </td>
                      <td className="audit-celda-correo">
                        <span className="audit-correo-principal">{u.correo}</span>
                        {u.correoValidacion && (
                          <span className="audit-correo-secundario">{u.correoValidacion}</span>
                        )}
                      </td>
                      <td className="audit-nowrap">{u.empresaIdentificador || '—'}</td>
                      <td>
                        <span className={`badge ${u.rol === 'ADMINISTRADOR' ? 'badge-ambar' : u.rol === 'AUDITOR' ? 'badge-azul' : 'badge-gris'}`}>
                          {u.rol}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${claseBadgeEstado(u.estado)}`}>
                          {u.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {data.usuarios.length === 0 && (
                    <tr>
                      <td colSpan={5} className="audit-empty">
                        No hay usuarios registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { esAuditor } = useAuth();
  
  if (esAuditor) {
    return <AuditorDashboard />;
  }
  
  return <IoTDashboard />;
}