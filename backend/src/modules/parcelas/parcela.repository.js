import { query } from '../../db/pool.js';

const COLS = `id_parcela, nombre_descriptivo, tipo_suelo, tipo_cultivo,
  ubicacion_descriptiva, latitud, longitud, area_m2, estado,
  empresa_identificador, fecha_creacion, fecha_modificacion`;

// Admin: todas las parcelas de SU empresa
export async function findByEmpresa(empresa) {
  const { rows } = await query(
    `SELECT ${COLS} FROM parcela WHERE empresa_identificador = $1 ORDER BY fecha_creacion DESC`,
    [empresa]
  );
  return rows;
}

// Agricultor: solo sus parcelas asignadas (que ademas son de su empresa)
export async function findByAgricultor(usuarioId) {
  const { rows } = await query(
    `SELECT p.id_parcela, p.nombre_descriptivo, p.tipo_suelo, p.tipo_cultivo,
            p.ubicacion_descriptiva, p.latitud, p.longitud, p.area_m2, p.estado,
            p.empresa_identificador, p.fecha_creacion, p.fecha_modificacion
     FROM parcela p
     JOIN parcela_asignada pa ON pa.parcela_id = p.id_parcela
     WHERE pa.usuario_id = $1
     ORDER BY p.fecha_creacion DESC`,
    [usuarioId]
  );
  return rows;
}

export async function findById(id) {
  const { rows } = await query(`SELECT ${COLS} FROM parcela WHERE id_parcela = $1`, [id]);
  return rows[0] ?? null;
}

export async function create(d) {
  const { rows } = await query(
    `INSERT INTO parcela
       (nombre_descriptivo, tipo_suelo, tipo_cultivo, ubicacion_descriptiva,
        latitud, longitud, area_m2, empresa_identificador)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING ${COLS}`,
    [d.nombreDescriptivo, d.tipoSuelo, d.tipoCultivo, d.ubicacionDescriptiva,
     d.latitud, d.longitud, d.areaM2, d.empresaIdentificador]
  );
  return rows[0];
}

export async function update(id, d) {
  const { rows } = await query(
    `UPDATE parcela SET
       nombre_descriptivo = $2, tipo_suelo = $3, tipo_cultivo = $4,
       ubicacion_descriptiva = $5, latitud = $6, longitud = $7,
       area_m2 = $8, estado = $9, fecha_modificacion = now()
     WHERE id_parcela = $1
     RETURNING ${COLS}`,
    [id, d.nombreDescriptivo, d.tipoSuelo, d.tipoCultivo, d.ubicacionDescriptiva,
     d.latitud, d.longitud, d.areaM2, d.estado]
  );
  return rows[0] ?? null;
}

export async function remove(id) {
  const { rowCount } = await query(`DELETE FROM parcela WHERE id_parcela = $1`, [id]);
  return rowCount > 0;
}

export async function asignarAgricultor(parcelaId, usuarioId) {
  await query(
    `INSERT INTO parcela_asignada (usuario_id, parcela_id)
     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [usuarioId, parcelaId]
  );
}

export async function desasignarAgricultor(parcelaId, usuarioId) {
  await query(
    `DELETE FROM parcela_asignada WHERE usuario_id = $1 AND parcela_id = $2`,
    [usuarioId, parcelaId]
  );
}

export async function findAgricultoresAsignados(parcelaId) {
  const { rows } = await query(
    `SELECT u.id_usuario, u.nombre, u.apellido, u.correo, u.correo_validacion
     FROM usuario u
     JOIN parcela_asignada pa ON pa.usuario_id = u.id_usuario
     WHERE pa.parcela_id = $1
     ORDER BY u.apellido, u.nombre`,
    [parcelaId]
  );
  return rows;
}