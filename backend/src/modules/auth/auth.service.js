import * as usuarioRepo from '../usuarios/usuario.repository.js';
import * as intentoRepo from '../usuarios/intentoLogin.repository.js';
import * as sesionRepo from '../usuarios/sesion.repository.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { signToken } from '../../utils/jwt.js';
import { AppError } from '../../utils/AppError.js';

function toPublic(usuario) {
  return {
    id: usuario.id_usuario,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    correo: usuario.correo,
    rol: usuario.rol,
    estado: usuario.estado,
  };
}

export async function registrar(datos) {
  // Registro publico solo permitido para crear el PRIMER administrador (bootstrap).
  // Despues, los usuarios los crea el administrador desde el panel.
  const yaHayAdmin = await usuarioRepo.existeAlgunAdmin();
  if (yaHayAdmin) {
    throw AppError.forbidden(
      'El registro publico esta deshabilitado. Solicita una cuenta al administrador.'
    );
  }
  if (datos.rol !== 'ADMINISTRADOR') {
    throw AppError.badRequest('El primer usuario registrado debe ser ADMINISTRADOR');
  }

  const existente = await usuarioRepo.findByCorreo(datos.correo);
  if (existente) throw AppError.conflict('Ya existe un usuario con ese correo');

  const contraHash = await hashPassword(datos.contra);
  const usuario = await usuarioRepo.create({
    nombre: datos.nombre, apellido: datos.apellido,
    correo: datos.correo, contraHash, rol: datos.rol,
  });
  return toPublic(usuario);
}

export async function login({ correo, contra }, ip) {
  const usuario = await usuarioRepo.findByCorreo(correo);

  if (!usuario) {
    await intentoRepo.registrar({ correo, ip, exitoso: false, motivoFallo: 'Usuario inexistente' });
    throw AppError.unauthorized('Credenciales invalidas');
  }

  if (usuario.estado !== 'ACTIVA') {
    await intentoRepo.registrar({ correo, ip, exitoso: false, motivoFallo: 'Cuenta no activa' });
    throw AppError.forbidden('La cuenta no esta activa');
  }

  const valido = await verifyPassword(contra, usuario.contra_hash);
  if (!valido) {
    await intentoRepo.registrar({ correo, ip, exitoso: false, motivoFallo: 'Contrasena incorrecta' });
    throw AppError.unauthorized('Credenciales invalidas');
  }

  const token = signToken({
    sub: usuario.id_usuario,
    rol: usuario.rol,
    correo: usuario.correo,
  });

  // Registro de sesion y del intento exitoso
  const expiracion = new Date(Date.now() + 8 * 60 * 60 * 1000); // coherente con JWT_EXPIRES_IN=8h
  await sesionRepo.crearSesion({ usuarioId: usuario.id_usuario, token, fechaExpiracion: expiracion });
  await intentoRepo.registrar({ correo, ip, exitoso: true });

  return { token, usuario: toPublic(usuario) };
}

export async function logout(token) {
  await sesionRepo.revocarPorToken(token);
}