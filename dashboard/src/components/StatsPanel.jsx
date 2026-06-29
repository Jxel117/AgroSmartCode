import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { fetchStats } from '../api/auditApi';

const COLORES = ['#0f6e56', '#2563eb', '#d97706', '#dc2626', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const COLORES_RESULTADO = {
  EXITO: '#16a34a',
  FALLO: '#dc2626',
  PARCIAL: '#d97706',
};

function formatDia(dia) {
  if (!dia) return '';
  return new Date(dia).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
}

export default function StatsPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchStats()
      .then((data) => setStats(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Cargando estadísticas</div>;
  if (error) return <div className="card"><p style={{ color: 'var(--color-danger)' }}>Error: {error}</p></div>;
  if (!stats) return null;

  const { resumen, diarias, categorias } = stats;

  // Agrupar diarias por día (sumando todas las categorías)
  const eventosPorDia = {};
  for (const row of diarias) {
    if (!eventosPorDia[row.dia]) {
      eventosPorDia[row.dia] = { dia: row.dia, EXITO: 0, FALLO: 0, PARCIAL: 0, total: 0 };
    }
    eventosPorDia[row.dia][row.resultado] += row.total;
    eventosPorDia[row.dia].total += row.total;
  }
  const dataDiaria = Object.values(eventosPorDia)
    .sort((a, b) => a.dia.localeCompare(b.dia))
    .slice(-14); // últimos 14 días

  // Datos para el pie chart
  const dataCategorias = categorias.map((c) => ({
    name: c.categoria,
    value: c.total,
  }));

  return (
    <div>
      {/* Tarjetas resumen */}
      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-value">{resumen.eventosHoy}</div>
          <div className="stat-label">Eventos hoy</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: resumen.fallosAuthUltimaHora > 5 ? 'var(--color-danger)' : undefined }}>
            {resumen.fallosAuthUltimaHora}
          </div>
          <div className="stat-label">Fallos de auth (última hora)</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{resumen.usuariosActivosHoy}</div>
          <div className="stat-label">Usuarios activos hoy</div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Gráfica de barras: eventos por día */}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>
            Eventos por día (últimos 14 días)
          </h3>
          {dataDiaria.length === 0 ? (
            <div className="empty">Sin datos en el período</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dataDiaria} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="dia" tickFormatter={formatDia} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(v) => `Día: ${formatDia(v)}`}
                  contentStyle={{ fontSize: '0.8rem' }}
                />
                <Bar dataKey="EXITO" stackId="a" fill={COLORES_RESULTADO.EXITO} name="Éxito" radius={[0, 0, 0, 0]} />
                <Bar dataKey="FALLO" stackId="a" fill={COLORES_RESULTADO.FALLO} name="Fallo" radius={[2, 2, 0, 0]} />
                <Bar dataKey="PARCIAL" stackId="a" fill={COLORES_RESULTADO.PARCIAL} name="Parcial" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart: distribución por categoría */}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>
            Distribución por categoría
          </h3>
          {dataCategorias.length === 0 ? (
            <div className="empty">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={dataCategorias}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={2}
                  label={({ name, percent }) =>
                    `${name.slice(0, 8)}… ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: '#94a3b8', strokeWidth: 0.5 }}
                  style={{ fontSize: '0.65rem' }}
                >
                  {dataCategorias.map((_, i) => (
                    <Cell key={i} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '0.8rem' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tabla resumen por categoría */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>
          Detalle por categoría (últimos 30 días)
        </h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Total</th>
                <th>Exitosos</th>
                <th>Fallidos</th>
                <th>Tasa de éxito</th>
                <th>Último evento</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((c) => {
                const tasa = c.total > 0 ? ((c.exitosos / c.total) * 100).toFixed(1) : '—';
                return (
                  <tr key={c.categoria}>
                    <td><span className="badge badge-cat">{c.categoria}</span></td>
                    <td style={{ fontWeight: 600 }}>{c.total}</td>
                    <td style={{ color: 'var(--color-success)' }}>{c.exitosos}</td>
                    <td style={{ color: c.fallidos > 0 ? 'var(--color-danger)' : undefined }}>{c.fallidos}</td>
                    <td>{tasa}%</td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {c.ultimo_evento
                        ? new Date(c.ultimo_evento).toLocaleString('es-EC', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
