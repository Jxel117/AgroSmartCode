import * as repo from './usuario.repository.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { generarCorreoInstitucional } from '../../utils/correoInstitucional.js';
import { AppError } from '../../utils/AppError.js';

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
    correo: u.correo,                       // institucional @agrosmart.ec (acceso)
    correoValidacion: u.correo_validacion,  // Gmail (validacion)
    rol: u.rol,
    estado: u.estado,
    empresaIdentificador: u.empresa_identificador,
    bloqueado: u.bloqueado,
    fechaCreacion: u.fecha_creacion,
  };
}

export async function listar(empresaIdentificador) {
  // Multi-tenant: solo usuarios de la misma empresa (se refina en Fase C)
  const usuarios = await repo.findAll(empresaIdentificador);
  return usuarios.map(toPublic);
}

export async function crear(datos, adminEmpresa) {
  // Verifica que el Gmail de validacion no este ya en uso
  const existente = await repo.findByCorreoValidacion(datos.correoValidacion);
  if (existente) throw AppError.conflict('Ya existe un usuario con ese correo de validación');

  // Genera el correo institucional unico
  const correoInstitucional = await generarCorreoInstitucional(datos.nombre, datos.apellido);
  const contraHash = await hashPassword(datos.contra);

  const usuario = await repo.create({
    nombre: datos.nombre,
    apellido: datos.apellido,
    correo: correoInstitucional,
    correoValidacion: datos.correoValidacion,
    contraHash,
    rol: datos.rol,
    empresaIdentificador: adminEmpresa, // hereda la empresa del admin que lo crea
  });
  return toPublic(usuario);
}

export async function actualizar(id, datos, solicitanteId, empresaAdmin) {
  await verificarTenant(id, empresaAdmin);
  const usuario = await repo.update(id, datos);
  if (!usuario) throw AppError.notFound('Usuario no encontrado');
  return toPublic(usuario);
}

export async function cambiarEstado(id, estado, solicitanteId, empresaAdmin) {
  if (id === solicitanteId) {
    throw AppError.badRequest('No puedes cambiar el estado de tu propia cuenta');
  }
  await verificarTenant(id, empresaAdmin);
  const usuario = await repo.updateEstado(id, estado);
  if (!usuario) throw AppError.notFound('Usuario no encontrado');
  return toPublic(usuario);
}

export async function eliminar(id, solicitanteId, empresaAdmin) {
  if (id === solicitanteId) {
    throw AppError.badRequest('No puedes eliminar tu propia cuenta');
  }
  await verificarTenant(id, empresaAdmin);
  const ok = await repo.remove(id);
  if (!ok) throw AppError.notFound('Usuario no encontrado');
}

// Cambio de contrasena por el propio usuario (estando logueado)
export async function cambiarPassword(usuarioId, passwordActual, passwordNueva) {
  const usuario = await repo.findByIdConHash(usuarioId);
  if (!usuario) throw AppError.notFound('Usuario no encontrado');

  const valido = await verifyPassword(passwordActual, usuario.contra_hash);
  if (!valido) throw AppError.badRequest('La contraseña actual es incorrecta');

  const nuevaHash = await hashPassword(passwordNueva);
  await repo.actualizarPassword(usuarioId, nuevaHash);
}

// Reseteo de contrasena por un administrador a un usuario bajo su gestion
export async function resetearPassword(adminEmpresa, usuarioId, passwordNueva) {
  const usuario = await repo.findById(usuarioId);
  if (!usuario) throw AppError.notFound('Usuario no encontrado');

  // Multi-tenant: el admin solo puede resetear usuarios de SU empresa
  if (usuario.empresa_identificador !== adminEmpresa) {
    throw AppError.forbidden('No puedes gestionar usuarios de otra empresa');
  }

  const nuevaHash = await hashPassword(passwordNueva);
  await repo.actualizarPassword(usuarioId, nuevaHash);
  // Resetear el bloqueo al cambiar la contrasena
  await repo.desbloquear(usuarioId);
}