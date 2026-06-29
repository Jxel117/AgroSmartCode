import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, _res, next) {
  next(AppError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Parámetros inválidos',
      details: err.issues.map((i) => ({
        campo: i.path.join('.'),
        mensaje: i.message,
      })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  console.error('[Error no controlado]', err);
  return res.status(500).json({
    error: 'Error interno del servidor',
    ...(env.nodeEnv === 'development' ? { detalle: err.message } : {}),
  });
}
