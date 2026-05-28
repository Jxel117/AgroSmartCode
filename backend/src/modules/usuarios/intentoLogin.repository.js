import { query } from '../../db/pool.js';

export async function registrar({ correo, ip, exitoso, motivoFallo = null }) {
  await query(
    `INSERT INTO intento_login (correo_intentado, ip_origen, exitoso, motivo_fallo)
     VALUES ($1, $2, $3, $4)`,
    [correo, ip, exitoso, motivoFallo]
  );
}