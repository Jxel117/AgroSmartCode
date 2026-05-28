import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, res, next) {
  next(AppError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Errores de validacion de zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Datos invalidos',
      details: err.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
    });
  }

  // Violacion de restriccion UNIQUE en PostgreSQL
  if (err.code === '23505') {
    return res.status(409).json({ error: 'El registro ya existe (valor duplicado).' });
  }

  // Violacion de llave foranea
  if (err.code === '23503') {
    return res.status(409).json({ error: 'Referencia invalida a otro registro.' });
  }

  // Errores de negocio controlados
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Error no previsto
  console.error('Error no controlado:', err);
  return res.status(500).json({
    error: 'Error interno del servidor',
    ...(env.nodeEnv === 'development' ? { detalle: err.message } : {}),
  });
}