import { query } from '../../db/pool.js';

// Columnas seguras para devolver al cliente (sin el hash de la contrasena)
const COLS = `id_usuario, nombre, apellido, correo, rol, estado, fecha_creacion, fecha_modificacion`;

export async function findByCorreo(correo) {
  const { rows } = await query(
    `SELECT id_usuario, nombre, apellido, correo, contra_hash, rol, estado
     FROM usuario WHERE correo = $1`,
    [correo]
  );
  return rows[0] ?? null;
}

export async function findById(id) {
  const { rows } = await query(`SELECT ${COLS} FROM usuario WHERE id_usuario = $1`, [id]);
  return rows[0] ?? null;
}

export async function findAll() {
  const { rows } = await query(`SELECT ${COLS} FROM usuario ORDER BY fecha_creacion DESC`);
  return rows;
}

export async function create({ nombre, apellido, correo, contraHash, rol }) {
  const { rows } = await query(
    `INSERT INTO usuario (nombre, apellido, correo, contra_hash, rol)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLS}`,
    [nombre, apellido, correo, contraHash, rol]
  );
  return rows[0];
}

export async function updateEstado(id, estado) {
  const { rows } = await query(
    `UPDATE usuario SET estado = $2, fecha_modificacion = now()
     WHERE id_usuario = $1 RETURNING ${COLS}`,
    [id, estado]
  );
  return rows[0] ?? null;
}

export async function update(id, { nombre, apellido, rol }) {
  const { rows } = await query(
    `UPDATE usuario SET nombre = $2, apellido = $3, rol = $4, fecha_modificacion = now()
     WHERE id_usuario = $1 RETURNING ${COLS}`,
    [id, nombre, apellido, rol]
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

export async function findAgricultores() {
  const { rows } = await query(
    `SELECT id_usuario, nombre, apellido, correo
     FROM usuario
     WHERE rol = 'AGRICULTOR' AND estado = 'ACTIVA'
     ORDER BY apellido, nombre`
  );
  return rows;
}