import { verifyToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Token no provisto'));
  }
  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, rol: payload.rol, correo: payload.correo };
    next();
  } catch {
    next(AppError.unauthorized('Token invalido o expirado'));
  }
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