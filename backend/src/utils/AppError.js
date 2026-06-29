export class AppError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(msg, details) {
    return new AppError(400, msg, details);
  }
  static unauthorized(msg) {
    return new AppError(401, msg);
  }
  static forbidden(msg) {
    return new AppError(403, msg);
  }
  static notFound(msg) {
    return new AppError(404, msg);
  }
  static conflict(msg) {
    return new AppError(409, msg);
  }
}
