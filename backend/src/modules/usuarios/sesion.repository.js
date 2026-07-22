import { query } from '../../db/pool.js';

export async function crearSesion({ usuarioId, token, fechaExpiracion }) {
  const { rows } = await query(
    `INSERT INTO sesion_usuario (usuario_id, token_jwt, fecha_expiracion)
     VALUES ($1, $2, $3) RETURNING id_sesion`,
    [usuarioId, token, fechaExpiracion]
  );
  return rows[0];
}

export async function revocarPorToken(token) {
  await query(
    `UPDATE sesion_usuario SET estado = 'CERRADA_MANUALMENTE'
     WHERE token_jwt = $1 AND estado = 'ACTIVA'`,
    [token]
  );
}

// Usado por el middleware de autenticacion en cada peticion: un JWT
// con firma valida no basta, la sesion tambien debe seguir ACTIVA
// (no cerrada por logout) y dentro de su fecha_expiracion.
export async function estaActiva(token) {
  const { rows } = await query(
    `SELECT 1 FROM sesion_usuario
     WHERE token_jwt = $1 AND estado = 'ACTIVA' AND fecha_expiracion > now()`,
    [token]
  );
  return rows.length > 0;
}