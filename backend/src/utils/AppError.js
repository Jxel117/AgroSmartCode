// Error de negocio con codigo HTTP. Lo lanzamos desde los servicios.
export class AppError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }

  static badRequest(msg, details) { return new AppError(400, msg, details); }
  static unauthorized(msg = 'No autenticado') { return new AppError(401, msg); }
  static forbidden(msg = 'No autorizado') { return new AppError(403, msg); }
  static notFound(msg = 'Recurso no encontrado') { return new AppError(404, msg); }
  static conflict(msg) { return new AppError(409, msg); }
}