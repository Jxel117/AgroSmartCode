import * as service from './recuperacion.service.js';

export async function solicitar(req, res) {
  await service.solicitarRecuperacion(req.body.correoValidacion);
  // Respuesta neutral, no revelamos si el correo existe
  res.json({
    mensaje: 'Si el correo está registrado, recibirás un enlace de recuperación en breve.',
  });
}

export async function verificar(req, res) {
  const resultado = await service.verificarToken(req.params.token);
  res.json(resultado);
}

export async function completar(req, res) {
  const resultado = await service.completarRecuperacion(
    req.params.token,
    req.body.passwordNueva
  );
  res.json({
    mensaje: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.',
    correo: resultado.correo,
  });
}