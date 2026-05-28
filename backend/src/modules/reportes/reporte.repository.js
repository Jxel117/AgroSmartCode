import { query } from '../../db/pool.js';

// Estadisticas de lecturas en un rango para una parcela
export async function estadisticasLecturas(parcelaId, desde, hasta) {
  const { rows } = await query(
    `SELECT
        MIN(l.humedad) AS humedad_min,
        MAX(l.humedad) AS humedad_max,
        AVG(l.humedad) AS humedad_promedio,
        MIN(l.temperatura) AS temperatura_min,
        MAX(l.temperatura) AS temperatura_max,
        AVG(l.temperatura) AS temperatura_promedio,
        COUNT(*) AS total_lecturas
     FROM lectura l
     JOIN nodo n ON n.id_nodo = l.nodo_id
     WHERE n.parcela_id = $1
       AND l.estado_lectura = 'VALIDA'
       AND l.timestamp_utc BETWEEN $2 AND $3`,
    [parcelaId, desde, hasta]
  );
  return rows[0];
}

// Activaciones de riego (transiciones a S2_RIEGO_ACTIVO) en el rango
export async function activacionesRiego(parcelaId, desde, hasta) {
  const { rows } = await query(
    `SELECT COUNT(*) AS num_activaciones
     FROM transicion_afd t
     JOIN afd_instancia a ON a.id_afd = t.afd_id
     WHERE a.parcela_id = $1
       AND t.estado_destino = 'S2_RIEGO_ACTIVO'
       AND t.timestamp_utc BETWEEN $2 AND $3`,
    [parcelaId, desde, hasta]
  );
  return parseInt(rows[0].num_activaciones, 10);
}

export async function guardar(d) {
  const { rows } = await query(
    `INSERT INTO reporte
       (parcela_id, tipo_periodo, fecha_inicio, fecha_fin,
        humedad_min, humedad_max, humedad_promedio,
        temperatura_min, temperatura_max, temperatura_promedio,
        num_activaciones_riego, formato_exportacion)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING id_reporte`,
    [d.parcelaId, d.tipoPeriodo, d.fechaInicio, d.fechaFin,
     d.humedadMin, d.humedadMax, d.humedadPromedio,
     d.temperaturaMin, d.temperaturaMax, d.temperaturaPromedio,
     d.numActivaciones, d.formatoExportacion ?? null]
  );
  return rows[0];
}