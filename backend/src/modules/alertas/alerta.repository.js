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

// Cuenta alertas no leidas (estado ACTIVA) de la empresa
export async function contarNoLeidas(empresa) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS total
     FROM alerta a
     JOIN parcela p ON p.id_parcela = a.parcela_id
     WHERE p.empresa_identificador = $1
       AND a.estado = 'ACTIVA'`,
    [empresa]
  );
  return rows[0].total;
}

// Marca todas las alertas ACTIVAS de la empresa como LEIDAS
export async function marcarTodasLeidas(empresa) {
  const { rowCount } = await query(
    `UPDATE alerta
     SET estado = 'LEIDA'
     FROM parcela p
     WHERE alerta.parcela_id = p.id_parcela
       AND p.empresa_identificador = $1
       AND alerta.estado = 'ACTIVA'`,
    [empresa]
  );
  return rowCount;
}