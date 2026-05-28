// Envuelve un controlador async para que cualquier error vaya al middleware de errores.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}