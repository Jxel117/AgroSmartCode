import { query } from '../../db/pool.js';

const COLS = `id_perfil, tipo_suelo, tipo_cultivo, umin_recomendado, umax_recomendado,
  umin_critico_recomendado, t_maximo_recomendado, tmin_recomendado,
  descripcion_agronomica, fuente_referencia, estado, fecha_creacion, fecha_modificacion`;

export async function findAll() {
  const { rows } = await query(`SELECT ${COLS} FROM perfil_agronomico ORDER BY tipo_suelo, tipo_cultivo`);
  return rows;
}

export async function findById(id) {
  const { rows } = await query(`SELECT ${COLS} FROM perfil_agronomico WHERE id_perfil = $1`, [id]);
  return rows[0] ?? null;
}

export async function create(d) {
  const { rows } = await query(
    `INSERT INTO perfil_agronomico
       (tipo_suelo, tipo_cultivo, umin_recomendado, umax_recomendado,
        umin_critico_recomendado, t_maximo_recomendado, tmin_recomendado,
        descripcion_agronomica, fuente_referencia)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING ${COLS}`,
    [d.tipoSuelo, d.tipoCultivo, d.uminRecomendado, d.umaxRecomendado,
     d.uminCriticoRecomendado, d.tMaximoRecomendado, d.tminRecomendado,
     d.descripcionAgronomica, d.fuenteReferencia]
  );
  return rows[0];
}

export async function update(id, d) {
  const { rows } = await query(
    `UPDATE perfil_agronomico SET
       tipo_suelo=$2, tipo_cultivo=$3, umin_recomendado=$4, umax_recomendado=$5,
       umin_critico_recomendado=$6, t_maximo_recomendado=$7, tmin_recomendado=$8,
       descripcion_agronomica=$9, fuente_referencia=$10, estado=$11,
       fecha_modificacion=now()
     WHERE id_perfil=$1
     RETURNING ${COLS}`,
    [id, d.tipoSuelo, d.tipoCultivo, d.uminRecomendado, d.umaxRecomendado,
     d.uminCriticoRecomendado, d.tMaximoRecomendado, d.tminRecomendado,
     d.descripcionAgronomica, d.fuenteReferencia, d.estado]
  );
  return rows[0] ?? null;
}

export async function remove(id) {
  const { rowCount } = await query(`DELETE FROM perfil_agronomico WHERE id_perfil = $1`, [id]);
  return rowCount > 0;
}