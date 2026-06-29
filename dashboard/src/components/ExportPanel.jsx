import { useState } from 'react';
import { exportarEventos } from '../api/auditApi';

const CATEGORIAS = [
  '', 'AUTENTICACION', 'GESTION_USUARIO', 'GESTION_PARCELA',
  'GESTION_NODO', 'CONFIGURACION_RIEGO', 'OPERACION_AFD',
  'SISTEMA_IOT', 'REPORTE',
];

export default function ExportPanel() {
  const [filtros, setFiltros] = useState({
    categoria: '',
    fechaDesde: '',
    fechaHasta: '',
    formato: 'csv',
  });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const handleChange = (key, value) => {
    setFiltros((prev) => ({ ...prev, [key]: value }));
  };

  const handleExport = async () => {
    setLoading(true);
    setMensaje('');
    try {
      const params = { ...filtros };

      // Convertir datetime-local a ISO
      if (params.fechaDesde) {
        params.fechaDesde = new Date(params.fechaDesde).toISOString();
      }
      if (params.fechaHasta) {
        params.fechaHasta = new Date(params.fechaHasta).toISOString();
      }

      // Limpiar vacíos
      Object.keys(params).forEach((k) => {
        if (!params[k]) delete params[k];
      });

      if (params.formato === 'csv') {
        await exportarEventos(params);
        setMensaje('Archivo CSV descargado correctamente.');
      } else {
        const data = await exportarEventos(params);
        // Descargar como JSON
        const blob = new Blob([JSON.stringify(data.eventos, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `auditoria_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setMensaje(`${data.total} eventos exportados como JSON.`);
      }
    } catch (err) {
      setMensaje(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Exportar eventos de auditoría
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
        Descarga los eventos filtrados como CSV o JSON. Máximo 50,000 registros por exportación.
      </p>

      <div className="filters">
        <div className="filter-group">
          <label>Categoría</label>
          <select value={filtros.categoria} onChange={(e) => handleChange('categoria', e.target.value)}>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>{c || 'Todas'}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Desde</label>
          <input
            type="datetime-local"
            value={filtros.fechaDesde}
            onChange={(e) => handleChange('fechaDesde', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Hasta</label>
          <input
            type="datetime-local"
            value={filtros.fechaHasta}
            onChange={(e) => handleChange('fechaHasta', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Formato</label>
          <select value={filtros.formato} onChange={(e) => handleChange('formato', e.target.value)}>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
        </div>

        <div className="filter-group" style={{ justifyContent: 'flex-end' }}>
          <label>&nbsp;</label>
          <button className="btn btn-primary" onClick={handleExport} disabled={loading}>
            {loading ? 'Exportando...' : `Descargar ${filtros.formato.toUpperCase()}`}
          </button>
        </div>
      </div>

      {mensaje && (
        <p style={{
          marginTop: '1rem',
          fontSize: '0.85rem',
          color: mensaje.startsWith('Error') ? 'var(--color-danger)' : 'var(--color-success)',
        }}>
          {mensaje}
        </p>
      )}
    </div>
  );
}
