import { query } from '../../db/pool.js';

const COLS = `id_usuario, nombre, apellido, correo, correo_validacion, rol, estado,
  empresa_identificador, bloqueado, fecha_creacion, fecha_modificacion`;

export async function findByCorreo(correo) {
  const { rows } = await query(
    `SELECT id_usuario, nombre, apellido, correo, correo_validacion, contra_hash,
            rol, estado, empresa_identificador, intentos_fallidos, bloqueado
     FROM usuario WHERE correo = $1`,
    [correo]
  );
  return rows[0] ?? null;
}

export async function findByCorreoValidacion(correoValidacion) {
  const { rows } = await query(
    `SELECT id_usuario, correo, correo_validacion FROM usuario WHERE correo_validacion = $1`,
    [correoValidacion]
  );
  return rows[0] ?? null;
}

export async function findByGoogleId(googleId) {
  const { rows } = await query(
    `SELECT id_usuario, nombre, apellido, correo, correo_validacion, rol, estado,
            empresa_identificador, bloqueado
     FROM usuario WHERE google_id = $1`,
    [googleId]
  );
  return rows[0] ?? null;
}

export async function findById(id) {
  const { rows } = await query(`SELECT ${COLS} FROM usuario WHERE id_usuario = $1`, [id]);
  return rows[0] ?? null;
}

export async function findByIdConHash(id) {
  const { rows } = await query(
    `SELECT id_usuario, contra_hash FROM usuario WHERE id_usuario = $1`, [id]
  );
  return rows[0] ?? null;
}

// Multi-tenant: si se pasa empresa, filtra; si no (admin sin empresa / bootstrap), trae todos
export async function findAll(empresaIdentificador = null) {
  if (empresaIdentificador) {
    const { rows } = await query(
      `SELECT ${COLS} FROM usuario WHERE empresa_identificador = $1 ORDER BY fecha_creacion DESC`,
      [empresaIdentificador]
    );
    return rows;
  }
  const { rows } = await query(`SELECT ${COLS} FROM usuario ORDER BY fecha_creacion DESC`);
  return rows;
}

export async function create(d) {
  const { rows } = await query(
    `INSERT INTO usuario (nombre, apellido, correo, correo_validacion, contra_hash, rol, empresa_identificador)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING ${COLS}`,
    [d.nombre, d.apellido, d.correo, d.correoValidacion, d.contraHash, d.rol, d.empresaIdentificador]
  );
  return rows[0];
}

export async function update(id, { nombre, apellido }) {
  const { rows } = await query(
    `UPDATE usuario SET nombre = $2, apellido = $3, fecha_modificacion = now()
     WHERE id_usuario = $1 RETURNING ${COLS}`,
    [id, nombre, apellido]
  );
  return rows[0] ?? null;
}

export async function updateEstado(id, estado) {
  const { rows } = await query(
    `UPDATE usuario SET estado = $2, fecha_modificacion = now()
     WHERE id_usuario = $1 RETURNING ${COLS}`,
    [id, estado]
  );
  return rows[0] ?? null;
}

export async function remove(id) {
  const { rowCount } = await query(`DELETE FROM usuario WHERE id_usuario = $1`, [id]);
  return rowCount > 0;
}

export async function existeAlgunAdmin() {
  const { rows } = await query(
    `SELECT 1 FROM usuario WHERE rol = 'ADMINISTRADOR' AND estado = 'ACTIVA' LIMIT 1`
  );
  return rows.length > 0;
}

export async function actualizarPassword(id, contraHash) {
  await query(
    `UPDATE usuario SET contra_hash = $2, fecha_modificacion = now() WHERE id_usuario = $1`,
    [id, contraHash]
  );
}

// ----- Control de intentos fallidos y bloqueo -----

export async function incrementarIntentosFallidos(id) {
  const { rows } = await query(
    `UPDATE usuario SET intentos_fallidos = intentos_fallidos + 1
     WHERE id_usuario = $1
     RETURNING intentos_fallidos`,
    [id]
  );
  return rows[0]?.intentos_fallidos ?? 0;
}

export async function bloquear(id) {
  await query(
    `UPDATE usuario SET bloqueado = true, fecha_bloqueo = now() WHERE id_usuario = $1`,
    [id]
  );
}

export async function desbloquear(id) {
  await query(
    `UPDATE usuario SET bloqueado = false, fecha_bloqueo = NULL, intentos_fallidos = 0
     WHERE id_usuario = $1`,
    [id]
  );
}

export async function resetearIntentos(id) {
  await query(`UPDATE usuario SET intentos_fallidos = 0 WHERE id_usuario = $1`, [id]);
}

export async function findAgricultores(empresa = null) {
  if (empresa) {
    const { rows } = await query(
      `SELECT id_usuario, nombre, apellido, correo, correo_validacion
       FROM usuario
       WHERE rol = 'AGRICULTOR' AND estado = 'ACTIVA' AND empresa_identificador = $1
       ORDER BY apellido, nombre`,
      [empresa]
    );
    return rows;
  }
  const { rows } = await query(
    `SELECT id_usuario, nombre, apellido, correo, correo_validacion
     FROM usuario
     WHERE rol = 'AGRICULTOR' AND estado = 'ACTIVA'
     ORDER BY apellido, nombre`
  );
  return rows;
}