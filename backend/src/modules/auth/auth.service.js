import * as usuarioRepo from '../usuarios/usuario.repository.js';
import * as intentoRepo from '../usuarios/intentoLogin.repository.js';
import * as sesionRepo from '../usuarios/sesion.repository.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { signToken } from '../../utils/jwt.js';
import { AppError } from '../../utils/AppError.js';
import { verificarRecaptcha } from '../../services/recaptcha.service.js';

function toPublic(usuario) {
  return {
    id: usuario.id_usuario,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    correo: usuario.correo,
    correoValidacion: usuario.correo_validacion,
    rol: usuario.rol,
    estado: usuario.estado,
    empresaIdentificador: usuario.empresa_identificador,
  };
}

export async function registrar(datos) {
  const yaHayAdmin = await usuarioRepo.existeAlgunAdmin();
  if (yaHayAdmin) {
    throw AppError.forbidden('El registro público está deshabilitado. Solicita una cuenta al administrador.');
  }
  if (datos.rol !== 'ADMINISTRADOR') {
    throw AppError.badRequest('El primer usuario registrado debe ser ADMINISTRADOR');
  }

  const existente = await usuarioRepo.findByCorreoValidacion(datos.correoValidacion);
  if (existente) throw AppError.conflict('Ya existe un usuario con ese correo de validación');

  const { generarCorreoInstitucional } = await import('../../utils/correoInstitucional.js');
  const correoInstitucional = await generarCorreoInstitucional(datos.nombre, datos.apellido);
  const contraHash = await hashPassword(datos.contra);

  const usuario = await usuarioRepo.create({
    nombre: datos.nombre,
    apellido: datos.apellido,
    correo: correoInstitucional,
    correoValidacion: datos.correoValidacion,
    contraHash,
    rol: datos.rol,
    empresaIdentificador: datos.empresaIdentificador ?? null,
  });
  return toPublic(usuario);
}

export async function login({ correo, contra, captchaToken }, ip) {
  // Verificar CAPTCHA antes de procesar credenciales
  const captcha = await verificarRecaptcha(captchaToken, ip);
  if (!captcha.valido) {
    throw AppError.badRequest('Verificación de seguridad fallida. Por favor completa el captcha.');
  }
  
  const usuario = await usuarioRepo.findByCorreo(correo);

  if (!usuario) {
    await intentoRepo.registrar({ correo, ip, exitoso: false, motivoFallo: 'Usuario inexistente' });
    throw AppError.unauthorized('Credenciales inválidas');
  }

  // Cuenta bloqueada: no permite intentar hasta recuperar contrasena
  if (usuario.bloqueado) {
    await intentoRepo.registrar({ correo, ip, exitoso: false, motivoFallo: 'Cuenta bloqueada' });
    throw new AppError(423, 'Cuenta bloqueada por múltiples intentos fallidos. Recupera tu contraseña para desbloquearla.');
  }

  if (usuario.estado !== 'ACTIVA') {
    await intentoRepo.registrar({ correo, ip, exitoso: false, motivoFallo: 'Cuenta no activa' });
    throw AppError.forbidden('La cuenta no está activa');
  }

  const valido = await verifyPassword(contra, usuario.contra_hash);
  if (!valido) {
    const intentos = await usuarioRepo.incrementarIntentosFallidos(usuario.id_usuario);
    await intentoRepo.registrar({ correo, ip, exitoso: false, motivoFallo: 'Contraseña incorrecta' });

    const MAX_INTENTOS = 3;
    if (intentos >= MAX_INTENTOS) {
      await usuarioRepo.bloquear(usuario.id_usuario);
      throw new AppError(423, 'Cuenta bloqueada tras 3 intentos fallidos. Recupera tu contraseña para desbloquearla.');
    }

    const restantes = MAX_INTENTOS - intentos;
    throw new AppError(401, `Credenciales inválidas. Te quedan ${restantes} intento(s) antes del bloqueo.`);
  }

  // Login correcto: resetear contador de intentos
  await usuarioRepo.resetearIntentos(usuario.id_usuario);

  const token = signToken({
    sub: usuario.id_usuario,
    rol: usuario.rol,
    correo: usuario.correo,
    empresa: usuario.empresa_identificador,
  });

  const expiracion = new Date(Date.now() + 8 * 60 * 60 * 1000);
  await sesionRepo.crearSesion({ usuarioId: usuario.id_usuario, token, fechaExpiracion: expiracion });
  await intentoRepo.registrar({ correo, ip, exitoso: true });

  return { token, usuario: toPublic(usuario) };
}

export async function logout(token) {
  await sesionRepo.revocarPorToken(token);
}