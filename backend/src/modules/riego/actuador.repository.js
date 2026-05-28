import { query } from '../../db/pool.js';

const COLS = `id_actuador, parcela_id, tipo, estado,
  fecha_ultima_activacion, fecha_ultima_desactivacion`;

export async function findByParcela(parcelaId) {
  const { rows } = await query(`SELECT ${COLS} FROM actuador WHERE parcela_id = $1`, [parcelaId]);
  return rows;
}

export async function create(d) {
  const { rows } = await query(
    `INSERT INTO actuador (parcela_id, tipo) VALUES ($1, $2) RETURNING ${COLS}`,
    [d.parcelaId, d.tipo]
  );
  return rows[0];
}

export async function setEstado(parcelaId, encender) {
  const campoFecha = encender ? 'fecha_ultima_activacion' : 'fecha_ultima_desactivacion';
  const nuevoEstado = encender ? 'ACTIVO' : 'INACTIVO';
  await query(
    `UPDATE actuador SET estado = $2, ${campoFecha} = now() WHERE parcela_id = $1`,
    [parcelaId, nuevoEstado]
  );
}