import * as authService from './auth.service.js';
import * as registroEmpresaService from './registroEmpresa.service.js';

export async function registrar(req, res) {
  const usuario = await authService.registrar(req.body);
  res.status(201).json({ usuario });
}

export async function login(req, res) {
  const ip = req.ip ?? req.headers['x-forwarded-for']?.split(',')[0] ?? null;
  const resultado = await authService.login({
    correo: req.body.correo,
    contra: req.body.contra,
    captchaToken: req.body.captchaToken,
  }, ip);
  res.json(resultado);
}

export async function logout(req, res) {
  const token = req.headers.authorization.slice(7);
  await authService.logout(token);
  res.json({ mensaje: 'Sesion cerrada' });
}

export async function perfil(req, res) {
  // req.user lo coloca el middleware authenticate
  res.json({ usuario: req.user });
}

export async function registrarEmpresa(req, res) {
  const resultado = await registroEmpresaService.registrarEmpresa(req.body);
  res.status(201).json({
    mensaje: 'Tu empresa ha sido registrada. Revisa tu correo Gmail para activar tu cuenta.',
    correoInstitucional: resultado.correoInstitucional,
    correoValidacion: resultado.correoValidacion,
    empresa: resultado.empresa,
  });
}