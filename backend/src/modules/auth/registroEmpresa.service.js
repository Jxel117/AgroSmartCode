import { randomBytes } from 'node:crypto';
import * as usuarioRepo from '../usuarios/usuario.repository.js';
import * as tokenRepo from './tokenRecuperacion.repository.js';
import { hashPassword } from '../../utils/password.js';
import { enviarEmail, plantillaEmail } from '../../services/email.service.js';
import { generarCorreoInstitucional } from '../../utils/correoInstitucional.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { query } from '../../db/pool.js';
import { emitir } from '../../audit/audit.emitter.js';

/**
 * Registra una empresa nueva: crea el admin "pendiente" y le envia un email
 * con un enlace para definir su contrasena inicial.
 *
 * El admin queda bloqueado hasta que define su contrasena via el enlace.
 */
export async function registrarEmpresa(datos) {
  // Validacion 1: el Gmail no debe estar ya registrado
  const correoExistente = await usuarioRepo.findByCorreoValidacion(datos.correoValidacion);
  if (correoExistente) {
    throw AppError.conflict('Este correo ya está registrado en el sistema');
  }

  // Validacion 2: el identificador de empresa debe ser unico
  const empresaExistente = await query(
    `SELECT 1 FROM usuario WHERE empresa_identificador = $1 LIMIT 1`,
    [datos.empresaIdentificador]
  );
  if (empresaExistente.rows.length > 0) {
    throw AppError.conflict('Ya existe una empresa registrada con ese identificador. Si es tu empresa y olvidaste tu contraseña, usa la opción de recuperación.');
  }

  // Generar correo institucional unico
  const correoInstitucional = await generarCorreoInstitucional(datos.nombre, datos.apellido);

  // Contrasena aleatoria temporal (nadie la sabra). El usuario debera definir
  // la suya via el enlace de email.
  const passwordTemporal = randomBytes(32).toString('hex');
  const contraHash = await hashPassword(passwordTemporal);

  // Crear el usuario admin de la nueva empresa
  const usuario = await usuarioRepo.create({
    nombre: datos.nombre,
    apellido: datos.apellido,
    correo: correoInstitucional,
    correoValidacion: datos.correoValidacion,
    contraHash,
    rol: 'ADMINISTRADOR',
    empresaIdentificador: datos.empresaIdentificador,
  });

  // Bloquear el usuario hasta que defina su contrasena
  await usuarioRepo.bloquear(usuario.id_usuario);

  // Generar token de recuperacion (reutilizamos el mismo mecanismo)
  const { token } = await tokenRepo.crearToken(usuario.id_usuario);

  // Construir enlace
  const enlace = `${env.appUrlFrontend}/activar/${token}`;

  // Enviar email
  const html = plantillaEmail({
    titulo: 'Bienvenido a AgroSmart',
    saludo: `Buen día ${datos.nombre}`,
    mensaje: `Tu empresa <strong>${datos.empresaIdentificador}</strong> ha sido registrada en AgroSmart. Para activar tu cuenta de administrador y definir tu contraseña inicial, haz clic en el botón de abajo. El enlace es válido durante 1 hora.<br><br>Una vez actives tu cuenta, podrás iniciar sesión con tu correo institucional: <strong>${correoInstitucional}</strong>`,
    botonTexto: 'Activar mi cuenta',
    botonUrl: enlace,
    despedida: 'Si no solicitaste este registro, puedes ignorar este correo. La cuenta no podrá usarse hasta que el enlace sea utilizado.',
  });

  await enviarEmail({
    destino: datos.correoValidacion,
    asunto: 'AgroSmart - Activa tu cuenta de administrador',
    html,
    texto: `Activa tu cuenta abriendo este enlace: ${enlace} (válido por 1 hora). Tu correo de acceso será ${correoInstitucional}.`,
  });

  emitir({
    categoria: 'AUTENTICACION', accion: 'EMPRESA_REGISTRADA',
    actor: { usuario_id: usuario.id_usuario, correo: correoInstitucional, rol: 'ADMINISTRADOR', empresa_id: datos.empresaIdentificador },
    recurso: { entidad_tipo: 'empresa', entidad_id: datos.empresaIdentificador, entidad_nombre: datos.empresaIdentificador },
    metadatos: { correo_validacion: datos.correoValidacion },
  });

  return {
    correoInstitucional,
    correoValidacion: datos.correoValidacion,
    empresa: datos.empresaIdentificador,
  };
}