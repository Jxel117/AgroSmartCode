import * as repo from './usuario.repository.js';
import { hashPassword } from '../../utils/password.js';
import { AppError } from '../../utils/AppError.js';

function toPublic(u) {
  return {
    id: u.id_usuario, nombre: u.nombre, apellido: u.apellido,
    correo: u.correo, rol: u.rol, estado: u.estado,
    fechaCreacion: u.fecha_creacion,
  };
}

export async function listar() {
  const usuarios = await repo.findAll();
  return usuarios.map(toPublic);
}

export async function crear(datos) {
  const existente = await repo.findByCorreo(datos.correo);
  if (existente) throw AppError.conflict('Ya existe un usuario con ese correo');
  const contraHash = await hashPassword(datos.contra);
  const usuario = await repo.create({
    nombre: datos.nombre, apellido: datos.apellido,
    correo: datos.correo, contraHash, rol: datos.rol,
  });
  return toPublic(usuario);
}

export async function actualizar(id, datos) {
  const usuario = await repo.update(id, datos);
  if (!usuario) throw AppError.notFound('Usuario no encontrado');
  return toPublic(usuario);
}

export async function cambiarEstado(id, estado) {
  const usuario = await repo.updateEstado(id, estado);
  if (!usuario) throw AppError.notFound('Usuario no encontrado');
  return toPublic(usuario);
}

export async function eliminar(id, solicitanteId) {
  if (id === solicitanteId) {
    throw AppError.badRequest('No puedes eliminar tu propia cuenta');
  }
  const ok = await repo.remove(id);
  if (!ok) throw AppError.notFound('Usuario no encontrado');
}