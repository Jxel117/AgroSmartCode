import { query } from '../../db/pool.js';

const COLS = `id_programacion, parcela_id, dia_semana, hora_inicio,
  duracion_minutos, estado, fecha_creacion`;

export async function findByParcela(parcelaId) {
  const { rows } = await query(
    `SELECT ${COLS} FROM programacion_riego
     WHERE parcela_id = $1 ORDER BY dia_semana, hora_inicio`,
    [parcelaId]
  );
  return rows;
}

export async function create(d) {
  const { rows } = await query(
    `INSERT INTO programacion_riego
       (parcela_id, dia_semana, hora_inicio, duracion_minutos)
     VALUES ($1,$2,$3,$4) RETURNING ${COLS}`,
    [d.parcelaId, d.diaSemana, d.horaInicio, d.duracionMinutos]
  );
  return rows[0];
}

export async function updateEstado(id, estado) {
  const { rows } = await query(
    `UPDATE programacion_riego SET estado = $2 WHERE id_programacion = $1 RETURNING ${COLS}`,
    [id, estado]
  );
  return rows[0] ?? null;
}

export async function remove(id) {
  const { rowCount } = await query(`DELETE FROM programacion_riego WHERE id_programacion = $1`, [id]);
  return rowCount > 0;
}