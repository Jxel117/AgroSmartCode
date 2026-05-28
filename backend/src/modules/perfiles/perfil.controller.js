import * as repo from './perfil.repository.js';
import { AppError } from '../../utils/AppError.js';

export async function listar(req, res) {
  res.json({ perfiles: await repo.findAll() });
}

export async function obtener(req, res) {
  const perfil = await repo.findById(req.params.id);
  if (!perfil) throw AppError.notFound('Perfil no encontrado');
  res.json({ perfil });
}

export async function crear(req, res) {
  res.status(201).json({ perfil: await repo.create(req.body) });
}

export async function actualizar(req, res) {
  const perfil = await repo.update(req.params.id, req.body);
  if (!perfil) throw AppError.notFound('Perfil no encontrado');
  res.json({ perfil });
}

export async function eliminar(req, res) {
  const ok = await repo.remove(req.params.id);
  if (!ok) throw AppError.notFound('Perfil no encontrado');
  res.status(204).send();
}