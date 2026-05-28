import * as repo from './programacion.repository.js';
import { AppError } from '../../utils/AppError.js';

export async function listar(req, res) {
  res.json({ programaciones: await repo.findByParcela(req.params.parcelaId) });
}

export async function crear(req, res) {
  const programacion = await repo.create({ parcelaId: req.params.parcelaId, ...req.body });
  res.status(201).json({ programacion });
}

export async function cambiarEstado(req, res) {
  const programacion = await repo.updateEstado(req.params.id, req.body.estado);
  if (!programacion) throw AppError.notFound('Programacion no encontrada');
  res.json({ programacion });
}

export async function eliminar(req, res) {
  const ok = await repo.remove(req.params.id);
  if (!ok) throw AppError.notFound('Programacion no encontrada');
  res.status(204).send();
}