import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

/**
 * Middleware de autenticación para el microservicio de auditoría.
 * Valida el JWT emitido por AgroSmart usando el mismo secreto compartido.
 * Solo permite acceso a usuarios con rol ADMINISTRADOR.
 */
export function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Token de autenticación requerido');
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.jwtSecret);

    // Solo administradores pueden acceder al sistema de auditoría
    if (payload.rol !== 'ADMINISTRADOR') {
      throw AppError.forbidden(
        'Acceso denegado: solo administradores pueden consultar la auditoría'
      );
    }

    req.user = {
      id: payload.sub,
      rol: payload.rol,
      correo: payload.correo,
      empresa: payload.empresa,
    };

    next();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw AppError.unauthorized('Token inválido o expirado');
  }
}
