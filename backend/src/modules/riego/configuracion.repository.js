import { query } from '../../db/pool.js';

const COLS = `id_configuracion, parcela_id, umin, umax, umin_critico, t_maximo, tmin,
  n_intentos_fallidos_max, modalidad_configuracion, perfil_id, fecha_aplicacion`;

// Devuelve la configuracion vigente (la mas reciente) de una parcela
export async function findVigente(parcelaId) {
  const { rows } = await query(
    `SELECT ${COLS} FROM configuracion_riego
     WHERE parcela_id = $1 ORDER BY fecha_aplicacion DESC LIMIT 1`,
    [parcelaId]
  );
  return rows[0] ?? null;
}

export async function create(d) {
  const { rows } = await query(
    `INSERT INTO configuracion_riego
       (parcela_id, umin, umax, umin_critico, t_maximo, tmin,
        n_intentos_fallidos_max, modalidad_configuracion, perfil_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING ${COLS}`,
    [d.parcelaId, d.umin, d.umax, d.uminCritico, d.tMaximo, d.tmin,
     d.nIntentosFallidosMax, d.modalidadConfiguracion, d.perfilId]
  );
  return rows[0];
}