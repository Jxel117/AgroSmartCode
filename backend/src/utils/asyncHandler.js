/**
 * Envuelve un controlador async para que los errores
 * se propaguen automáticamente al middleware de errores.
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
