import { query } from '../../db/pool.js';

export async function create(d) {
  const { rows } = await query(
    `INSERT INTO lectura (nodo_id, humedad, temperatura, estado_lectura)
     VALUES ($1,$2,$3,$4)
     RETURNING id_lectura, nodo_id, humedad, temperatura, timestamp_utc, estado_lectura`,
    [d.nodoId, d.humedad, d.temperatura, d.estadoLectura]
  );
  return rows[0];
}

export async function actualizarUltimaLecturaNodo(nodoId) {
  await query(`UPDATE nodo SET fecha_ultima_lectura = now(), estado = 'ACTIVO' WHERE id_nodo = $1`, [nodoId]);
}

// Lecturas recientes de una parcela (unidas a sus nodos), para el dashboard
export async function findRecientesPorParcela(parcelaId, limite = 100) {
  const { rows } = await query(
    `SELECT l.id_lectura, l.nodo_id, l.humedad, l.temperatura, l.timestamp_utc, l.estado_lectura
     FROM lectura l
     JOIN nodo n ON n.id_nodo = l.nodo_id
     WHERE n.parcela_id = $1
     ORDER BY l.timestamp_utc DESC
     LIMIT $2`,
    [parcelaId, limite]
  );
  return rows;
}

// Ultima lectura por nodo (para tarjetas de estado)
export async function findUltimaPorNodo(nodoId) {
  const { rows } = await query(
    `SELECT id_lectura, nodo_id, humedad, temperatura, timestamp_utc, estado_lectura
     FROM lectura WHERE nodo_id = $1 ORDER BY timestamp_utc DESC LIMIT 1`,
    [nodoId]
  );
  return rows[0] ?? null;
}