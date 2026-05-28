import * as authService from './auth.service.js';

export async function registrar(req, res) {
  const usuario = await authService.registrar(req.body);
  res.status(201).json({ usuario });
}

export async function login(req, res) {
  const ip = req.ip;
  const resultado = await authService.login(req.body, ip);
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