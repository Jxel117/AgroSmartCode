import { randomBytes } from 'node:crypto';
import { query } from '../../db/pool.js';

const HORAS_VALIDEZ = 1;

/**
 * Crea un token nuevo para un usuario. Si habia tokens anteriores no usados,
 * los invalida (pone usado=true) para que solo el ultimo funcione.
 */
export async function crearToken(usuarioId) {
  await query(
    `UPDATE token_recuperacion SET usado = true
     WHERE usuario_id = $1 AND usado = false`,
    [usuarioId]
  );

  const tokenPlano = randomBytes(32).toString('hex');
  const expiracion = new Date(Date.now() + HORAS_VALIDEZ * 60 * 60 * 1000);

  const { rows } = await query(
    `INSERT INTO token_recuperacion (usuario_id, token, fecha_expiracion)
     VALUES ($1, $2, $3)
     RETURNING token, fecha_expiracion`,
    [usuarioId, tokenPlano, expiracion]
  );

  return rows[0];
}

/**
 * Busca un token y verifica que sea valido (no usado y no expirado).
 * Devuelve la fila del token y datos del usuario, o null si no sirve.
 */
export async function buscarTokenValido(tokenPlano) {
  const { rows } = await query(
    `SELECT tr.id_token, tr.usuario_id, tr.token, tr.fecha_expiracion, tr.usado,
            u.id_usuario, u.nombre, u.apellido, u.correo, u.correo_validacion,
            u.empresa_identificador, u.estado
     FROM token_recuperacion tr
     JOIN usuario u ON u.id_usuario = tr.usuario_id
     WHERE tr.token = $1`,
    [tokenPlano]
  );
  const fila = rows[0];
  if (!fila) return null;
  if (fila.usado) return { fila, motivo: 'YA_USADO' };
  if (new Date(fila.fecha_expiracion) < new Date()) return { fila, motivo: 'EXPIRADO' };
  return { fila, motivo: null };
}

export async function marcarUsado(idToken) {
  await query(`UPDATE token_recuperacion SET usado = true WHERE id_token = $1`, [idToken]);
}