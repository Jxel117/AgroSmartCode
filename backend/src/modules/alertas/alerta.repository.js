import { query } from '../../db/pool.js';

const COLS = `id_alerta, parcela_id, nodo_id, tipo_alerta, severidad, mensaje,
  valor_disparador, fecha_generacion, fecha_lectura, estado`;

export async function create(d) {
  const { rows } = await query(
    `INSERT INTO alerta (parcela_id, nodo_id, tipo_alerta, severidad, mensaje, valor_disparador)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING ${COLS}`,
    [d.parcelaId, d.nodoId, d.tipoAlerta, d.severidad, d.mensaje, d.valorDisparador]
  );
  return rows[0];
}

export async function findAll(estado) {
  const cond = estado ? `WHERE estado = $1` : '';
  const params = estado ? [estado] : [];
  const { rows } = await query(
    `SELECT ${COLS} FROM alerta ${cond} ORDER BY fecha_generacion DESC LIMIT 200`,
    params
  );
  return rows;
}

export async function marcarLeida(id) {
  const { rows } = await query(
    `UPDATE alerta SET estado = 'LEIDA', fecha_lectura = now()
     WHERE id_alerta = $1 AND estado = 'ACTIVA' RETURNING ${COLS}`,
    [id]
  );
  return rows[0] ?? null;
}

export async function marcarResuelta(id) {
  const { rows } = await query(
    `UPDATE alerta SET estado = 'RESUELTA' WHERE id_alerta = $1 RETURNING ${COLS}`,
    [id]
  );
  return rows[0] ?? null;
}