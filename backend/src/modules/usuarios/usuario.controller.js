import * as service from './usuario.service.js';

export async function listar(req, res) {
  res.json({ usuarios: await service.listar() });
}

export async function crear(req, res) {
  const usuario = await service.crear(req.body);
  res.status(201).json({ usuario });
}

export async function actualizar(req, res) {
  const usuario = await service.actualizar(req.params.id, req.body);
  res.json({ usuario });
}

export async function cambiarEstado(req, res) {
  const usuario = await service.cambiarEstado(req.params.id, req.body.estado);
  res.json({ usuario });
}

export async function eliminar(req, res) {
  await service.eliminar(req.params.id, req.user.id);
  res.status(204).send();
}

import * as repo from './usuario.repository.js';

export async function listarAgricultores(req, res) {
  const agricultores = await repo.findAgricultores();
  res.json({ agricultores });
}