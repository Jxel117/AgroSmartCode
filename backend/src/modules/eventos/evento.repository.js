import { query } from '../../db/pool.js';

/**
 * Inserta un batch de eventos en la tabla log_evento.
 * Usa ON CONFLICT para deduplicación (si RabbitMQ reenvía un mensaje).
 */
export async function insertBatch(eventos) {
  if (eventos.length === 0) return 0;

  const values = [];
  const params = [];
  let paramIndex = 1;

  for (const e of eventos) {
    const actor = e.actor ?? {};
    const recurso = e.recurso ?? {};
    const contexto = e.contexto ?? {};

    values.push(`(
      $${paramIndex++}, $${paramIndex++}, $${paramIndex++},
      $${paramIndex++}, $${paramIndex++}, $${paramIndex++},
      $${paramIndex++}, $${paramIndex++}, $${paramIndex++},
      $${paramIndex++}, $${paramIndex++}, $${paramIndex++},
      $${paramIndex++}, $${paramIndex++}, $${paramIndex++}
    )`);

    params.push(
      e.evento_id ?? null,
      e.timestamp ? new Date(e.timestamp) : new Date(),
      actor.usuario_id ?? null,
      actor.correo ?? null,
      actor.rol ?? null,
      contexto.ip ?? null,
      contexto.user_agent ?? null,
      actor.empresa_id ?? null,
      e.categoria,
      e.accion,
      e.resultado ?? 'EXITO',
      recurso.entidad_tipo ?? null,
      recurso.entidad_id ?? null,
      recurso.entidad_nombre ?? null,
      JSON.stringify(e.metadatos ?? {})
    );
  }

  const sql = `
    INSERT INTO log_evento (
      evento_id, timestamp_utc, usuario_id, correo_usuario, rol_usuario,
      ip_origen, user_agent, empresa_id, categoria, accion, resultado,
      entidad_tipo, entidad_id, entidad_nombre, metadatos
    ) VALUES ${values.join(', ')}
    ON CONFLICT (evento_id, timestamp_utc) DO NOTHING
  `;

  const result = await query(sql, params);
  return result.rowCount;
}

/**
 * Busca eventos con filtros, paginación por cursor.
 */
export async function findEventos({
  empresaId,
  categoria,
  resultado,
  usuarioId,
  correo,
  entidadTipo,
  fechaDesde,
  fechaHasta,
  cursor,
  limite = 50,
}) {
  const conditions = [];
  const params = [];
  let i = 1;

  if (empresaId) {
    conditions.push(`empresa_id = $${i++}`);
    params.push(empresaId);
  }
  if (categoria) {
    conditions.push(`categoria = $${i++}`);
    params.push(categoria);
  }
  if (resultado) {
    conditions.push(`resultado = $${i++}`);
    params.push(resultado);
  }
  if (usuarioId) {
    conditions.push(`usuario_id = $${i++}`);
    params.push(usuarioId);
  }
  if (correo) {
    conditions.push(`correo_usuario ILIKE $${i++}`);
    params.push(`%${correo}%`);
  }
  if (entidadTipo) {
    conditions.push(`entidad_tipo = $${i++}`);
    params.push(entidadTipo);
  }
  if (fechaDesde) {
    conditions.push(`timestamp_utc >= $${i++}`);
    params.push(new Date(fechaDesde));
  }
  if (fechaHasta) {
    conditions.push(`timestamp_utc <= $${i++}`);
    params.push(new Date(fechaHasta));
  }
  if (cursor) {
    conditions.push(`timestamp_utc < $${i++}`);
    params.push(new Date(cursor));
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(Math.min(limite, 100));

  const sql = `
    SELECT id, evento_id, timestamp_utc, correo_usuario, rol_usuario,
           categoria, accion, resultado, entidad_tipo, entidad_id,
           entidad_nombre, ip_origen, empresa_id, descripcion, metadatos
    FROM log_evento
    ${where}
    ORDER BY timestamp_utc DESC
    LIMIT $${i}
  `;

  const { rows } = await query(sql, params);
  return rows;
}

/**
 * Estadísticas diarias para gráficas.
 */
export async function getStatsDiarias(empresaId, dias = 30) {
  const sql = `
    SELECT
      date_trunc('day', timestamp_utc)::DATE AS dia,
      categoria,
      resultado,
      COUNT(*)::INTEGER AS total
    FROM log_evento
    WHERE timestamp_utc > now() - ($1 || ' days')::INTERVAL
      ${empresaId ? 'AND empresa_id = $2' : ''}
    GROUP BY 1, 2, 3
    ORDER BY 1 DESC
  `;

  const params = [dias.toString()];
  if (empresaId) params.push(empresaId);

  const { rows } = await query(sql, params);
  return rows;
}

/**
 * Resumen general por categoría.
 */
export async function getStatsCategorias(empresaId) {
  const sql = `
    SELECT
      categoria,
      COUNT(*)::INTEGER AS total,
      COUNT(*) FILTER (WHERE resultado = 'EXITO')::INTEGER AS exitosos,
      COUNT(*) FILTER (WHERE resultado = 'FALLO')::INTEGER AS fallidos,
      MAX(timestamp_utc) AS ultimo_evento
    FROM log_evento
    WHERE timestamp_utc > now() - INTERVAL '30 days'
      ${empresaId ? 'AND empresa_id = $1' : ''}
    GROUP BY 1
    ORDER BY total DESC
  `;

  const params = empresaId ? [empresaId] : [];
  const { rows } = await query(sql, params);
  return rows;
}

/**
 * Resumen rápido (tarjetas del dashboard).
 */
export async function getResumen(empresaId) {
  const base = empresaId ? 'AND empresa_id = $1' : '';
  const params = empresaId ? [empresaId] : [];

  const [totalHoy, fallosAuth, usuariosActivos] = await Promise.all([
    query(
      `SELECT COUNT(*)::INTEGER AS total FROM log_evento
       WHERE timestamp_utc > CURRENT_DATE ${base}`,
      params
    ),
    query(
      `SELECT COUNT(*)::INTEGER AS total FROM log_evento
       WHERE categoria = 'AUTENTICACION' AND resultado = 'FALLO'
       AND timestamp_utc > now() - INTERVAL '1 hour' ${base}`,
      params
    ),
    query(
      `SELECT COUNT(DISTINCT usuario_id)::INTEGER AS total FROM log_evento
       WHERE timestamp_utc > CURRENT_DATE AND usuario_id IS NOT NULL ${base}`,
      params
    ),
  ]);

  return {
    eventosHoy: totalHoy.rows[0]?.total ?? 0,
    fallosAuthUltimaHora: fallosAuth.rows[0]?.total ?? 0,
    usuariosActivosHoy: usuariosActivos.rows[0]?.total ?? 0,
  };
}

/**
 * Exportar eventos como JSON (para descarga).
 */
export async function exportar({
  empresaId,
  categoria,
  fechaDesde,
  fechaHasta,
  limite = 10000,
}) {
  const conditions = [];
  const params = [];
  let i = 1;

  if (empresaId) {
    conditions.push(`empresa_id = $${i++}`);
    params.push(empresaId);
  }
  if (categoria) {
    conditions.push(`categoria = $${i++}`);
    params.push(categoria);
  }
  if (fechaDesde) {
    conditions.push(`timestamp_utc >= $${i++}`);
    params.push(new Date(fechaDesde));
  }
  if (fechaHasta) {
    conditions.push(`timestamp_utc <= $${i++}`);
    params.push(new Date(fechaHasta));
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(Math.min(limite, 50000));

  const sql = `
    SELECT evento_id, timestamp_utc, correo_usuario, rol_usuario,
           categoria, accion, resultado, entidad_tipo, entidad_id,
           entidad_nombre, ip_origen, empresa_id, descripcion, metadatos
    FROM log_evento
    ${where}
    ORDER BY timestamp_utc DESC
    LIMIT $${i}
  `;

  const { rows } = await query(sql, params);
  return rows;
}
