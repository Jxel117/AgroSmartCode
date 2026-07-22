import { verifyToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import { registrarActor } from '../audit/audit.context.js';
import * as sesionRepo from '../modules/usuarios/sesion.repository.js';

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Token no provisto'));
  }
  const token = header.slice(7);
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return next(AppError.unauthorized('Token invalido o expirado'));
  }

  // La firma del JWT solo prueba que el token fue emitido por el servidor;
  // tambien debe seguir ACTIVA en sesion_usuario, o un logout no cerraria
  // realmente la sesion mientras el token no haya expirado por si solo.
  const activa = await sesionRepo.estaActiva(token);
  if (!activa) {
    return next(AppError.unauthorized('Sesion cerrada o invalida'));
  }

  req.user = {
    id: payload.sub,
    rol: payload.rol,
    correo: payload.correo,
    empresa: payload.empresa ?? null,
  };
  // A partir de aqui, todo evento emitido durante esta peticion sabe quien lo provoco.
  registrarActor(req.user);
  next();
}

// Restringe el acceso a ciertos roles. Uso: authorize('ADMINISTRADOR')
export function authorize(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!rolesPermitidos.includes(req.user.rol)) {
      return next(AppError.forbidden('No tienes permisos para esta accion'));
    }
    next();
  };
}