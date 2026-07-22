import { randomBytes } from 'node:crypto';
import * as repo from './usuario.repository.js';
import * as tokenRepo from '../auth/tokenRecuperacion.repository.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { generarCorreoInstitucional } from '../../utils/correoInstitucional.js';
import { enviarEmail, plantillaEmail } from '../../services/email.service.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { emitir } from '../../audit/audit.emitter.js';

function actorDe(usuario) {
  return {
    usuario_id: usuario.id,
    correo: usuario.correo,
    rol: usuario.rol,
    empresa_id: usuario.empresa,
  };
}

async function verificarTenant(usuarioId, empresaAdmin) {
  const usuario = await repo.findById(usuarioId);
  if (!usuario) throw AppError.notFound('Usuario no encontrado');
  if (empresaAdmin && usuario.empresa_identificador !== empresaAdmin) {
    throw AppError.forbidden('No puedes gestionar usuarios de otra empresa');
  }
  return usuario;
}

function toPublic(u) {
  return {
    id: u.id_usuario,
    nombre: u.nombre,
    apellido: u.apellido,
    correo: u.correo,
    correoValidacion: u.correo_validacion,
    rol: u.rol,
    estado: u.estado,
    empresaIdentificador: u.empresa_identificador,
    bloqueado: u.bloqueado,
    cuentaActivada: u.cuenta_activada,
    fechaCreacion: u.fecha_creacion,
    avatar_id: u.avatar_id ?? null,
  };
}

// Genera un enlace de activacion nuevo y envia el correo. Se usa tanto al
// crear un agricultor como al reenviar el correo si el primero no llego.
async function enviarCorreoActivacion({ usuarioId, nombre, correoValidacion, correoInstitucional, empresa }) {
  const { token } = await tokenRepo.crearToken(usuarioId);
  const enlace = `${env.appUrlFrontend}/activar/${token}`;

  const html = plantillaEmail({
    titulo: 'Bienvenido a AgroSmart',
    saludo: `Buen día ${nombre}`,
    mensaje: `Has sido registrado como agricultor de <strong>${empresa}</strong> en AgroSmart. Para activar tu cuenta y definir tu contraseña, haz clic en el botón de abajo. El enlace es válido durante 1 hora.<br><br>Una vez actives tu cuenta, podrás iniciar sesión con tu correo institucional: <strong>${correoInstitucional}</strong>`,
    botonTexto: 'Activar mi cuenta',
    botonUrl: enlace,
    despedida: 'Si no reconoces este registro, contacta a tu administrador.',
  });

  await enviarEmail({
    destino: correoValidacion,
    asunto: 'AgroSmart - Activa tu cuenta',
    html,
    texto: `Activa tu cuenta abriendo este enlace: ${enlace} (válido por 1 hora). Tu correo de acceso será ${correoInstitucional}.`,
  });
}

export async function listar(empresaIdentificador) {
  // Multi-tenant: solo usuarios de la misma empresa (se refina en Fase C)
  const usuarios = await repo.findAll(empresaIdentificador);
  return usuarios.map(toPublic);
}

export async function crear(datos, admin) {
  // Verifica que el Gmail de validacion no este ya en uso
  const existente = await repo.findByCorreoValidacion(datos.correoValidacion);
  if (existente) throw AppError.conflict('Ya existe un usuario con ese correo de validación');

  // Genera el correo institucional unico
  const correoInstitucional = await generarCorreoInstitucional(datos.nombre, datos.apellido);

  // Los AGRICULTOR no reciben la contrasena por el admin: se crean bloqueados
  // y activan su cuenta (definen su propia contrasena) via enlace por correo,
  // igual que el flujo de registro de empresa.
  const requiereActivacion = datos.rol === 'AGRICULTOR';
  const passwordInicial = requiereActivacion ? randomBytes(32).toString('hex') : datos.contra;
  const contraHash = await hashPassword(passwordInicial);

  const usuario = await repo.create({
    nombre: datos.nombre,
    apellido: datos.apellido,
    correo: correoInstitucional,
    correoValidacion: datos.correoValidacion,
    contraHash,
    rol: datos.rol,
    empresaIdentificador: admin.empresa, // hereda la empresa del admin que lo crea
  });

  if (requiereActivacion) {
    await repo.marcarPendienteActivacion(usuario.id_usuario);
    await enviarCorreoActivacion({
      usuarioId: usuario.id_usuario,
      nombre: datos.nombre,
      correoValidacion: datos.correoValidacion,
      correoInstitucional,
      empresa: admin.empresa,
    });
  }

  emitir({
    categoria: 'GESTION_USUARIO', accion: 'USUARIO_CREADO',
    actor: actorDe(admin),
    recurso: { entidad_tipo: 'usuario', entidad_id: usuario.id_usuario, entidad_nombre: usuario.correo },
    metadatos: { rol_asignado: usuario.rol, requiere_activacion: requiereActivacion },
  });

  return toPublic(requiereActivacion ? { ...usuario, bloqueado: true, cuenta_activada: false } : usuario);
}

export async function actualizar(id, datos, admin) {
  await verificarTenant(id, admin.empresa);
  const usuario = await repo.update(id, datos);
  if (!usuario) throw AppError.notFound('Usuario no encontrado');

  emitir({
    categoria: 'GESTION_USUARIO', accion: 'USUARIO_ACTUALIZADO',
    actor: actorDe(admin),
    recurso: { entidad_tipo: 'usuario', entidad_id: id, entidad_nombre: usuario.correo },
    metadatos: { campos_modificados: Object.keys(datos) },
  });

  return toPublic(usuario);
}

export async function cambiarEstado(id, estado, admin) {
  if (id === admin.id) {
    throw AppError.badRequest('No puedes cambiar el estado de tu propia cuenta');
  }
  await verificarTenant(id, admin.empresa);
  const usuario = await repo.updateEstado(id, estado);
  if (!usuario) throw AppError.notFound('Usuario no encontrado');

  emitir({
    categoria: 'GESTION_USUARIO', accion: 'USUARIO_ESTADO_CAMBIADO',
    actor: actorDe(admin),
    recurso: { entidad_tipo: 'usuario', entidad_id: id, entidad_nombre: usuario.correo },
    metadatos: { estado_nuevo: estado },
  });

  return toPublic(usuario);
}

export async function eliminar(id, admin) {
  if (id === admin.id) {
    throw AppError.badRequest('No puedes eliminar tu propia cuenta');
  }
  const usuario = await verificarTenant(id, admin.empresa);
  const ok = await repo.remove(id);
  if (!ok) throw AppError.notFound('Usuario no encontrado');

  emitir({
    categoria: 'GESTION_USUARIO', accion: 'USUARIO_ELIMINADO',
    actor: actorDe(admin),
    recurso: { entidad_tipo: 'usuario', entidad_id: id, entidad_nombre: usuario.correo },
  });
}

// Cambio de contrasena por el propio usuario (estando logueado)
export async function cambiarPassword(actor, passwordActual, passwordNueva) {
  const usuario = await repo.findByIdConHash(actor.id);
  if (!usuario) throw AppError.notFound('Usuario no encontrado');

  const valido = await verifyPassword(passwordActual, usuario.contra_hash);
  if (!valido) {
    emitir({
      categoria: 'GESTION_USUARIO', accion: 'PASSWORD_CAMBIO_FALLIDO', resultado: 'FALLO',
      actor: actorDe(actor),
      recurso: { entidad_tipo: 'usuario', entidad_id: actor.id },
      metadatos: { motivo: 'Contraseña actual incorrecta' },
    });
    throw AppError.badRequest('La contraseña actual es incorrecta');
  }

  const nuevaHash = await hashPassword(passwordNueva);
  await repo.actualizarPassword(actor.id, nuevaHash);

  emitir({
    categoria: 'GESTION_USUARIO', accion: 'PASSWORD_CAMBIADO',
    actor: actorDe(actor),
    recurso: { entidad_tipo: 'usuario', entidad_id: actor.id },
  });
}

// Reseteo de contrasena por un administrador a un usuario bajo su gestion
export async function resetearPassword(admin, usuarioId, passwordNueva) {
  const usuario = await repo.findById(usuarioId);
  if (!usuario) throw AppError.notFound('Usuario no encontrado');

  // Multi-tenant: el admin solo puede resetear usuarios de SU empresa
  if (usuario.empresa_identificador !== admin.empresa) {
    throw AppError.forbidden('No puedes gestionar usuarios de otra empresa');
  }

  // El admin NO puede suplantar la validacion por correo: si el usuario
  // todavia no activo su cuenta (nunca uso el enlace enviado a su Gmail),
  // resetear la contrasena aqui lo dejaria activo sin haberse validado.
  // La unica salida es reenviar el correo de activacion.
  if (usuario.cuenta_activada === false) {
    throw AppError.badRequest(
      'Este usuario todavía no activó su cuenta desde el enlace enviado por correo. Usa "Reenviar correo de activación" en vez de restablecer la contraseña.'
    );
  }

  const nuevaHash = await hashPassword(passwordNueva);
  await repo.actualizarPassword(usuarioId, nuevaHash);
  // Resetear el bloqueo al cambiar la contrasena
  const estabaBloqueada = usuario.bloqueado === true;
  await repo.desbloquear(usuarioId);

  emitir({
    categoria: 'GESTION_USUARIO', accion: 'PASSWORD_RESETEADO_POR_ADMIN',
    actor: actorDe(admin),
    recurso: { entidad_tipo: 'usuario', entidad_id: usuarioId, entidad_nombre: usuario.correo },
  });

  // El reseteo tambien devuelve el acceso a una cuenta bloqueada: se registra
  // aparte para poder responder a "quien desbloqueo esta cuenta y cuando".
  if (estabaBloqueada) {
    emitir({
      categoria: 'AUTENTICACION', accion: 'CUENTA_DESBLOQUEADA',
      actor: actorDe(admin),
      recurso: { entidad_tipo: 'usuario', entidad_id: usuarioId, entidad_nombre: usuario.correo },
      metadatos: { via: 'Reseteo de contraseña por administrador' },
    });
  }
}

// Reenvia el correo de activacion a un usuario que aun no valido su cuenta
// (p. ej. el primer correo no llego o el enlace expiro). No cambia password
// ni desbloquea: eso solo ocurre cuando el propio usuario usa el enlace.
export async function reenviarActivacion(admin, usuarioId) {
  const usuario = await repo.findById(usuarioId);
  if (!usuario) throw AppError.notFound('Usuario no encontrado');

  if (usuario.empresa_identificador !== admin.empresa) {
    throw AppError.forbidden('No puedes gestionar usuarios de otra empresa');
  }
  if (usuario.cuenta_activada !== false) {
    throw AppError.badRequest('Este usuario ya activó su cuenta');
  }

  await enviarCorreoActivacion({
    usuarioId: usuario.id_usuario,
    nombre: usuario.nombre,
    correoValidacion: usuario.correo_validacion,
    correoInstitucional: usuario.correo,
    empresa: admin.empresa,
  });

  emitir({
    categoria: 'GESTION_USUARIO', accion: 'ACTIVACION_REENVIADA',
    actor: actorDe(admin),
    recurso: { entidad_tipo: 'usuario', entidad_id: usuarioId, entidad_nombre: usuario.correo },
  });
}
