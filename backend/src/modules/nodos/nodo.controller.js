import * as service from './nodo.service.js';

export async function listar(req, res) {
  const nodos = await service.listar(req.query.parcelaId);
  res.json({ nodos });
}

export async function obtener(req, res) {
  res.json({ nodo: await service.obtener(req.params.id) });
}

export async function crear(req, res) {
  const resultado = await service.crear(req.body);
  res.status(201).json(resultado);
}

export async function actualizar(req, res) {
  res.json({ nodo: await service.actualizar(req.params.id, req.body) });
}

export async function eliminar(req, res) {
  await service.eliminar(req.params.id);
  res.status(204).send();
}   