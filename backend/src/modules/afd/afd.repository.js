import { query, withTransaction } from '../../db/pool.js';

// Obtiene (o crea) la instancia de AFD de una parcela
// Obtiene (o crea) la instancia de AFD de una parcela.
// Si ya existe, actualiza n_intentos_fallidos_max si cambio en la configuracion.
export async function findOrCreateByParcela(parcelaId, nIntentosMax = 3) {
  const { rows } = await query(
    `SELECT id_afd, parcela_id, estado_actual, contador_intentos_fallidos,
            n_intentos_fallidos_max, fecha_ultimo_cambio_estado
     FROM afd_instancia WHERE parcela_id = $1`,
    [parcelaId]
  );

  if (rows[0]) {
    // Si el limite de reintentos cambio en la configuracion, actualizar el AFD
    if (Number(rows[0].n_intentos_fallidos_max) !== Number(nIntentosMax)) {
      await query(
        `UPDATE afd_instancia SET n_intentos_fallidos_max = $2 WHERE id_afd = $1`,
        [rows[0].id_afd, nIntentosMax]
      );
      rows[0].n_intentos_fallidos_max = nIntentosMax;
    }
    return rows[0];
  }

  const insert = await query(
    `INSERT INTO afd_instancia (parcela_id, n_intentos_fallidos_max)
     VALUES ($1, $2)
     RETURNING id_afd, parcela_id, estado_actual, contador_intentos_fallidos,
               n_intentos_fallidos_max, fecha_ultimo_cambio_estado`,
    [parcelaId, nIntentosMax]
  );
  return insert.rows[0];
}

// Aplica una transicion: actualiza la instancia y registra el historial, atomico
export async function aplicarTransicion(afd, transicion) {
  return withTransaction(async (client) => {
    await client.query(
      `UPDATE afd_instancia SET
         estado_actual = $2,
         contador_intentos_fallidos = $3,
         fecha_ultimo_cambio_estado = now()
       WHERE id_afd = $1`,
      [afd.id_afd, transicion.estadoDestino, transicion.contadorIntentos]
    );

    await client.query(
      `INSERT INTO transicion_afd
         (afd_id, estado_origen, estado_destino, simbolo_disparador,
          humedad_en_transicion, temperatura_en_transicion, causa_transicion)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [afd.id_afd, transicion.estadoOrigen, transicion.estadoDestino,
       transicion.simbolo, transicion.humedad, transicion.temperatura, transicion.causa]
    );
  });
}

export async function resetToMonitoreo(parcelaId) {
  const { rowCount } = await query(
    `UPDATE afd_instancia SET
       estado_actual = 'S0_MONITOREO',
       contador_intentos_fallidos = 0,
       fecha_ultimo_cambio_estado = now()
     WHERE parcela_id = $1`,
    [parcelaId]
  );
  return rowCount > 0;
}

export async function findTransiciones(parcelaId, limite = 50) {
  const { rows } = await query(
    `SELECT t.id_transicion, t.estado_origen, t.estado_destino, t.simbolo_disparador,
            t.humedad_en_transicion, t.temperatura_en_transicion, t.causa_transicion,
            t.timestamp_utc
     FROM transicion_afd t
     JOIN afd_instancia a ON a.id_afd = t.afd_id
     WHERE a.parcela_id = $1
     ORDER BY t.timestamp_utc DESC
     LIMIT $2`,
    [parcelaId, limite]
  );
  return rows;
}