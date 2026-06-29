import { useState, useEffect, useCallback } from 'react';
import { fetchEventos } from '../api/auditApi';

const CATEGORIAS = [
  '', 'AUTENTICACION', 'GESTION_USUARIO', 'GESTION_PARCELA',
  'GESTION_NODO', 'CONFIGURACION_RIEGO', 'OPERACION_AFD',
  'SISTEMA_IOT', 'REPORTE',
];

const RESULTADOS = ['', 'EXITO', 'FALLO', 'PARCIAL'];

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('es-EC', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function ResultBadge({ resultado }) {
  const cls = resultado === 'EXITO' ? 'badge-exito'
    : resultado === 'FALLO' ? 'badge-fallo' : 'badge-parcial';
  return <span className={`badge ${cls}`}>{resultado}</span>;
}

export default function LogEventos() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cursors, setCursors] = useState([]); // stack de cursores para paginación
  const [nextCursor, setNextCursor] = useState(null);

  const [filtros, setFiltros] = useState({
    categoria: '',
    resultado: '',
    correo: '',
    fechaDesde: '',
    fechaHasta: '',
  });

  const cargar = useCallback(async (cursor = null) => {
    setLoading(true);
    setError('');
    try {
      const params = { ...filtros, limite: '30' };
      if (cursor) params.cursor = cursor;

      // Limpiar vacíos
      Object.keys(params).forEach((k) => {
        if (!params[k]) delete params[k];
      });

      const data = await fetchEventos(params);
      setEventos(data.eventos ?? []);
      setNextCursor(data.nextCursor ?? null);
    } catch (err) {
      setError(err.message);
      setEventos([]);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    setCursors([]);
    cargar();
  }, [cargar]);

  const handleFilter = (key, value) => {
    setFiltros((prev) => ({ ...prev, [key]: value }));
  };

  const irSiguiente = () => {
    if (!nextCursor) return;
    setCursors((prev) => [...prev, nextCursor]);
    cargar(nextCursor);
  };

  const irAnterior = () => {
    const prev = [...cursors];
    prev.pop(); // quitar el cursor actual
    const cursorAnterior = prev.length > 0 ? prev[prev.length - 1] : null;
    setCursors(prev);
    cargar(cursorAnterior);
  };

  return (
    <div>
      {/* Filtros */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="filters">
          <div className="filter-group">
            <label>Categoría</label>
            <select value={filtros.categoria} onChange={(e) => handleFilter('categoria', e.target.value)}>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c || 'Todas'}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Resultado</label>
            <select value={filtros.resultado} onChange={(e) => handleFilter('resultado', e.target.value)}>
              {RESULTADOS.map((r) => (
                <option key={r} value={r}>{r || 'Todos'}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Correo</label>
            <input
              type="text"
              placeholder="admin@..."
              value={filtros.correo}
              onChange={(e) => handleFilter('correo', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Desde</label>
            <input
              type="datetime-local"
              value={filtros.fechaDesde}
              onChange={(e) => {
                const val = e.target.value;
                handleFilter('fechaDesde', val ? new Date(val).toISOString() : '');
              }}
            />
          </div>

          <div className="filter-group">
            <label>Hasta</label>
            <input
              type="datetime-local"
              value={filtros.fechaHasta}
              onChange={(e) => {
                const val = e.target.value;
                handleFilter('fechaHasta', val ? new Date(val).toISOString() : '');
              }}
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        {error && (
          <p style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>Error: {error}</p>
        )}

        {loading ? (
          <div className="loading">Cargando eventos</div>
        ) : eventos.length === 0 ? (
          <div className="empty">No se encontraron eventos con los filtros aplicados.</div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Usuario</th>
                    <th>Categoría</th>
                    <th>Acción</th>
                    <th>Resultado</th>
                    <th>Entidad</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {eventos.map((e) => (
                    <tr key={e.evento_id || e.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(e.timestamp_utc)}</td>
                      <td>{e.correo_usuario ?? '—'}</td>
                      <td><span className="badge badge-cat">{e.categoria}</span></td>
                      <td>{e.accion}</td>
                      <td><ResultBadge resultado={e.resultado} /></td>
                      <td>
                        {e.entidad_nombre || e.entidad_tipo
                          ? `${e.entidad_tipo ?? ''} ${e.entidad_nombre ? `(${e.entidad_nombre})` : ''}`
                          : '—'}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {e.ip_origen ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              <button
                className="btn"
                onClick={irAnterior}
                disabled={cursors.length === 0}
              >
                ← Anterior
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', alignSelf: 'center' }}>
                {eventos.length} resultados
              </span>
              <button
                className="btn"
                onClick={irSiguiente}
                disabled={!nextCursor || eventos.length < 30}
              >
                Siguiente →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
