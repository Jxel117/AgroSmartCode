import * as repo from './alerta.repository.js';
import { AppError } from '../../utils/AppError.js';

export async function listar(req, res) {
  res.json({ alertas: await repo.findAll(req.query.estado) });
}

export async function marcarLeida(req, res) {
  const alerta = await repo.marcarLeida(req.params.id);
  if (!alerta) throw AppError.notFound('Alerta no encontrada o ya leida');
  res.json({ alerta });
}

export async function marcarResuelta(req, res) {
  const alerta = await repo.marcarResuelta(req.params.id);
  if (!alerta) throw AppError.notFound('Alerta no encontrada');
  res.json({ alerta });
}