import * as service from './nodo.service.js';

export async function listar(req, res) {
  const nodos = await service.listar(req.user.empresa);
  res.json({ nodos });
}

export async function obtener(req, res) {
  res.json({ nodo: await service.obtener(req.params.id) });
}

export async function crear(req, res) {
  const resultado = await service.crear(req.body, req.user);
  res.status(201).json(resultado);
}

export async function actualizar(req, res) {
  res.json({ nodo: await service.actualizar(req.params.id, req.body) });
}

export async function cambiarEstado(req, res) {
  const nodo = await service.cambiarEstado(req.params.id, req.body.estado, req.user);
  res.json({ nodo });
}

export async function eliminar(req, res) {
  await service.eliminar(req.params.id, req.user);
  res.status(204).send();
}