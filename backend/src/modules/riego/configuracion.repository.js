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

// Historial completo de aplicaciones de configuracion para una parcela
export async function findHistorial(parcelaId, limite = 50) {
  const { rows } = await query(
    `SELECT
       c.id_configuracion, c.parcela_id, c.umin, c.umax, c.umin_critico,
       c.t_maximo, c.tmin, c.n_intentos_fallidos_max,
       c.modalidad_configuracion, c.perfil_id, c.fecha_aplicacion,
       p.tipo_suelo AS perfil_tipo_suelo,
       p.tipo_cultivo AS perfil_tipo_cultivo,
       p.descripcion_agronomica AS perfil_descripcion
     FROM configuracion_riego c
     LEFT JOIN perfil_agronomico p ON p.id_perfil = c.perfil_id
     WHERE c.parcela_id = $1
     ORDER BY c.fecha_aplicacion DESC
     LIMIT $2`,
    [parcelaId, limite]
  );
  return rows;
}

// Devuelve la configuracion vigente de TODAS las parcelas de una empresa
// (la mas reciente por cada parcela)
export async function findVigentesPorEmpresa(empresa) {
  const { rows } = await query(
    `SELECT DISTINCT ON (c.parcela_id)
       c.id_configuracion, c.parcela_id, c.umin, c.umax, c.umin_critico,
       c.t_maximo, c.tmin, c.n_intentos_fallidos_max,
       c.modalidad_configuracion, c.perfil_id, c.fecha_aplicacion
     FROM configuracion_riego c
     JOIN parcela p ON p.id_parcela = c.parcela_id
     WHERE p.empresa_identificador = $1
     ORDER BY c.parcela_id, c.fecha_aplicacion DESC`,
    [empresa]
  );
  return rows;
}