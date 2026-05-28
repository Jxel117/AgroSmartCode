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