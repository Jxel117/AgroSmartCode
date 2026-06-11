import { query } from '../db/pool.js';

// Genera un correo institucional unico tipo nombre.apellido@agrosmart.ec
// Si ya existe, agrega un numero (nombre.apellido2@agrosmart.ec, etc.)
export async function generarCorreoInstitucional(nombre, apellido) {
  const normaliza = (s) =>
    s.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita tildes
      .replace(/[^a-z]/g, '');                           // solo letras

  const base = `${normaliza(nombre)}.${normaliza(apellido)}`;
  let candidato = `${base}@agrosmart.ec`;
  let contador = 1;

  // Busca un correo libre
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { rows } = await query('SELECT 1 FROM usuario WHERE correo = $1', [candidato]);
    if (rows.length === 0) return candidato;
    contador += 1;
    candidato = `${base}${contador}@agrosmart.ec`;
  }
}