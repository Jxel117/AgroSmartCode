import * as service from './parcela.service.js';

export async function listar(req, res) {
  const parcelas = await service.listar(req.user);
  res.json({ parcelas });
}

export async function obtener(req, res) {
  const parcela = await service.obtener(req.params.id, req.user);
  res.json({ parcela });
}

export async function crear(req, res) {
  const parcela = await service.crear(req.body, req.user);
  res.status(201).json({ parcela });
}

export async function actualizar(req, res) {
  const parcela = await service.actualizar(req.params.id, req.body, req.user.empresa);
  res.json({ parcela });
}

export async function eliminar(req, res) {
  await service.eliminar(req.params.id, req.user);
  res.status(204).send();
}

export async function asignar(req, res) {
  await service.asignar(req.params.id, req.body.usuarioId, req.user);
  res.json({ mensaje: 'Agricultor asignado' });
}

export async function desasignar(req, res) {
  await service.desasignar(req.params.id, req.body.usuarioId, req.user);
  res.json({ mensaje: 'Agricultor desasignado' });
}

export async function listarAgricultores(req, res) {
  const agricultores = await service.listarAgricultores(req.params.id, req.user.empresa);
  res.json({ agricultores });
}