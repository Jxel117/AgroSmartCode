import * as usuarioRepo from '../usuarios/usuario.repository.js';
import * as tokenRepo from './tokenRecuperacion.repository.js';
import { hashPassword } from '../../utils/password.js';
import { enviarEmail, plantillaEmail } from '../../services/email.service.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { emitir } from '../../audit/audit.emitter.js';

/**
 * Solicitar recuperacion: el usuario indica su correo de validacion (Gmail).
 * Por seguridad, siempre respondemos "ok" aunque el correo no exista,
 * para no filtrar informacion sobre cuales correos estan registrados.
 */
export async function solicitarRecuperacion(correoValidacion) {
  const usuario = await usuarioRepo.findByCorreoValidacion(correoValidacion);

  if (!usuario) {
    // Al usuario se le responde de forma neutral para no revelar que correos
    // existen, pero el intento SI queda auditado: una racha de solicitudes
    // contra correos inexistentes delata un intento de enumeracion de cuentas.
    emitir({
      categoria: 'AUTENTICACION', accion: 'RECUPERACION_CORREO_DESCONOCIDO', resultado: 'FALLO',
      actor: { correo: correoValidacion },
      metadatos: { motivo: 'El correo no corresponde a ninguna cuenta' },
    });
    return { enviado: false };
  }

  // Crear token y obtenerlo en texto plano
  const { token } = await tokenRepo.crearToken(usuario.id_usuario);

  // Construir el enlace que llegara al email
  const enlace = `${env.appUrlFrontend}/recuperar/${token}`;

  // Enviar email
  const html = plantillaEmail({
    titulo: 'Recuperación de contraseña',
    saludo: `Buen día ${usuario.nombre ?? ''}`,
    mensaje: 'Recibimos una solicitud para restablecer la contraseña de tu cuenta AgroSmart. Si fuiste tú, haz clic en el botón de abajo para definir una nueva contraseña. El enlace es válido durante 1 hora. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.',
    botonTexto: 'Restablecer contraseña',
    botonUrl: enlace,
    despedida: 'Si tienes problemas, contacta al administrador del sistema.',
  });

  await enviarEmail({
    destino: correoValidacion,
    asunto: 'AgroSmart - Restablece tu contraseña',
    html,
    texto: `Para restablecer tu contraseña, abre este enlace: ${enlace} (válido por 1 hora)`,
  });

  emitir({
    categoria: 'AUTENTICACION', accion: 'RECUPERACION_SOLICITADA',
    actor: { usuario_id: usuario.id_usuario, correo: usuario.correo, empresa_id: usuario.empresa_identificador },
    recurso: { entidad_tipo: 'usuario', entidad_id: usuario.id_usuario },
  });

  return { enviado: true };
}

/**
 * Completar recuperacion: el usuario tiene el token (del email) y la nueva contrasena.
 */
export async function completarRecuperacion(tokenPlano, passwordNueva) {
  const resultado = await tokenRepo.buscarTokenValido(tokenPlano);

  if (!resultado) {
    throw AppError.badRequest('El enlace de recuperación no es válido');
  }
  if (resultado.motivo === 'YA_USADO') {
    throw AppError.badRequest('Este enlace de recuperación ya fue usado. Solicita uno nuevo.');
  }
  if (resultado.motivo === 'EXPIRADO') {
    throw AppError.badRequest('El enlace de recuperación expiró. Solicita uno nuevo.');
  }

  const usuario = resultado.fila;

  // Cambiar la contrasena
  const nuevaHash = await hashPassword(passwordNueva);
  await usuarioRepo.actualizarPassword(usuario.id_usuario, nuevaHash);

  // Si la cuenta estaba bloqueada por intentos fallidos, desbloquearla
  const estabaBloqueada = usuario.bloqueado === true;
  await usuarioRepo.desbloquear(usuario.id_usuario);

  // Marcar el token como usado para que no sirva otra vez
  await tokenRepo.marcarUsado(usuario.id_token);

  const actor = {
    usuario_id: usuario.id_usuario,
    correo: usuario.correo,
    rol: usuario.rol,
    empresa_id: usuario.empresa_identificador,
  };

  emitir({
    categoria: 'AUTENTICACION', accion: 'RECUPERACION_COMPLETADA',
    actor,
    recurso: { entidad_tipo: 'usuario', entidad_id: usuario.id_usuario, entidad_nombre: usuario.correo },
  });

  // El desbloqueo es un cambio de privilegio por si mismo: se registra aparte
  // para poder responder a "quien y cuando devolvio el acceso a esta cuenta".
  if (estabaBloqueada) {
    emitir({
      categoria: 'AUTENTICACION', accion: 'CUENTA_DESBLOQUEADA',
      actor,
      recurso: { entidad_tipo: 'usuario', entidad_id: usuario.id_usuario, entidad_nombre: usuario.correo },
      metadatos: { via: 'Enlace de recuperación de contraseña' },
    });
  }

  return {
    correo: usuario.correo,
    nombre: usuario.nombre,
  };
}

/**
 * Verifica que un token sea valido SIN consumirlo todavia.
 * Lo usa el frontend al cargar la pantalla de "restablecer contrasena":
 * si el token es invalido/expirado, mostramos error antes de que el usuario
 * escriba una nueva contrasena para nada.
 */
export async function verificarToken(tokenPlano) {
  const resultado = await tokenRepo.buscarTokenValido(tokenPlano);
  if (!resultado) return { valido: false, motivo: 'NO_EXISTE' };
  if (resultado.motivo) return { valido: false, motivo: resultado.motivo };
  return {
    valido: true,
    correo: resultado.fila.correo,
    nombre: resultado.fila.nombre,
  };
}