/**
 * Script puntual: crea (o actualiza la contrasena de) la cuenta unica del
 * super usuario AUDITOR. No se ejecuta con migraciones ni se expone via API
 * a proposito: un ADMINISTRADOR normal no debe poder crear cuentas AUDITOR
 * desde el panel de Usuarios.
 *
 * Uso: node src/db/crearAuditor.js
 */
import { pool, query } from './pool.js';
import { hashPassword } from '../utils/password.js';

const CORREO = 'super.admin@agrosmart.ec';
const CORREO_VALIDACION = 'auditoria.agrosmart@gmail.com';
const PASSWORD_PLANO = 'Administrador10!';

async function run() {
  const contraHash = await hashPassword(PASSWORD_PLANO);

  const existente = await query('SELECT id_usuario FROM usuario WHERE correo = $1', [CORREO]);

  if (existente.rows.length > 0) {
    await query(
      `UPDATE usuario SET contra_hash = $2, rol = 'AUDITOR', estado = 'ACTIVA',
              bloqueado = false, intentos_fallidos = 0, empresa_identificador = NULL,
              fecha_modificacion = now()
       WHERE correo = $1`,
      [CORREO, contraHash]
    );
    console.log('Cuenta AUDITOR ya existia: contrasena restablecida.');
  } else {
    await query(
      `INSERT INTO usuario
         (nombre, apellido, correo, correo_validacion, contra_hash, rol, estado, empresa_identificador)
       VALUES ($1,$2,$3,$4,$5,'AUDITOR','ACTIVA',NULL)`,
      ['Super', 'Admin', CORREO, CORREO_VALIDACION, contraHash]
    );
    console.log('Cuenta AUDITOR creada.');
  }

  console.log('');
  console.log('=================================================');
  console.log(' Credenciales del super usuario:');
  console.log(` Correo:      ${CORREO}`);
  console.log(` Contrasena:  ${PASSWORD_PLANO}`);
  console.log('=================================================');
}

run()
  .catch((err) => {
    console.error('Error creando la cuenta AUDITOR:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
