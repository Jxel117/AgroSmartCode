import { useState } from 'react';
import { alertasApi } from '../api/endpoints.js';
import { useFetch } from '../hooks/useFetch.js';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import { fechaHora, claseBadgeEstado } from '../utils/formato.js';

const FILTROS = [
  { valor: '', label: 'Todas' },
  { valor: 'ACTIVA', label: 'Activas' },
  { valor: 'LEIDA', label: 'Leidas' },
  { valor: 'RESUELTA', label: 'Resueltas' },
];

export default function Alertas() {
  const [filtro, setFiltro] = useState('');
  const { datos, cargando, recargar } = useFetch(
    () => alertasApi.listar(filtro || undefined).then((r) => r.data.alertas),
    [filtro]
  );

  async function leida(id) { await alertasApi.marcarLeida(id); recargar(); }
  async function resuelta(id) { await alertasApi.marcarResuelta(id); recargar(); }

  return (
    <>
      <EncabezadoPagina 
      titulo="Alertas"
      descripcion="Eventos críticos detectados por el sistema (humedad crítica, temperatura excesiva, fallos de sensores) que requieren tu atención." />
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {FILTROS.map((f) => (
          <button key={f.valor}
            className={`btn ${filtro === f.valor ? 'btn-primario' : 'btn-secundario'}`}
            onClick={() => setFiltro(f.valor)}>
            {f.label}
          </button>
        ))}
      </div>

      {cargando ? <div className="spinner" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {datos?.length === 0 && (
            <div className="tarjeta" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--gris-500)' }}>
              No hay alertas en esta categoria.
            </div>
          )}
          {datos?.map((a) => (
            <div key={a.id_alerta} className="tarjeta" style={{ padding: '1.1rem 1.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className={`badge ${claseBadgeEstado(a.severidad)}`}>{a.severidad}</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{a.mensaje}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gris-500)' }}>{a.tipo_alerta} · {fechaHora(a.fecha_generacion)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <span className={`badge ${claseBadgeEstado(a.estado)}`}>{a.estado}</span>
                {a.estado === 'ACTIVA' && <button className="btn btn-secundario" style={{ padding: '0.4rem 0.7rem' }} onClick={() => leida(a.id_alerta)}>Marcar leida</button>}
                {a.estado !== 'RESUELTA' && <button className="btn btn-primario" style={{ padding: '0.4rem 0.7rem' }} onClick={() => resuelta(a.id_alerta)}>Resolver</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}