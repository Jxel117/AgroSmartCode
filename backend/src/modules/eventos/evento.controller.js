import * as service from './evento.service.js';
import { filtrosSchema, exportSchema } from './evento.schemas.js';

export async function listar(req, res) {
  const filtros = filtrosSchema.parse(req.query);
  // Multi-tenant: forzar empresa del usuario logueado
  filtros.empresaId = req.user.empresa;

  const eventos = await service.listarEventos(filtros);

  const nextCursor =
    eventos.length > 0
      ? eventos[eventos.length - 1].timestamp_utc.toISOString()
      : null;

  res.json({ eventos, nextCursor, total: eventos.length });
}

export async function stats(req, res) {
  const estadisticas = await service.obtenerStats(req.user.empresa);
  res.json(estadisticas);
}

export async function exportar(req, res) {
  const filtros = exportSchema.parse(req.query);
  filtros.empresaId = req.user.empresa;

  const eventos = await service.exportarEventos(filtros);

  const formato = req.query.formato ?? 'json';

  if (formato === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="auditoria_${Date.now()}.csv"`
    );

    // Cabecera CSV
    const headers = [
      'timestamp', 'correo', 'rol', 'categoria', 'accion',
      'resultado', 'entidad_tipo', 'entidad_nombre', 'ip', 'descripcion',
    ];
    res.write(headers.join(',') + '\n');

    for (const e of eventos) {
      const row = [
        e.timestamp_utc?.toISOString() ?? '',
        e.correo_usuario ?? '',
        e.rol_usuario ?? '',
        e.categoria,
        e.accion,
        e.resultado,
        e.entidad_tipo ?? '',
        `"${(e.entidad_nombre ?? '').replace(/"/g, '""')}"`,
        e.ip_origen ?? '',
        `"${(e.descripcion ?? '').replace(/"/g, '""')}"`,
      ];
      res.write(row.join(',') + '\n');
    }
    return res.end();
  }

  // JSON por defecto
  res.json({ eventos, total: eventos.length });
}
