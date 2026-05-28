import * as configService from './configuracion.service.js';
import * as actuadorRepo from './actuador.repository.js';
import * as afdRepo from '../afd/afd.repository.js';

export async function obtenerConfig(req, res) {
  res.json({ configuracion: await configService.obtenerVigente(req.params.parcelaId) });
}

export async function aplicarManual(req, res) {
  const cfg = await configService.aplicarManual(req.params.parcelaId, req.body);
  res.status(201).json({ configuracion: cfg });
}

export async function aplicarPerfil(req, res) {
  const cfg = await configService.aplicarPerfil(req.params.parcelaId, req.body.perfilId);
  res.status(201).json({ configuracion: cfg });
}

export async function estadoActuadores(req, res) {
  res.json({ actuadores: await actuadorRepo.findByParcela(req.params.parcelaId) });
}

export async function crearActuador(req, res) {
  const actuador = await actuadorRepo.create({
    parcelaId: req.params.parcelaId, tipo: req.body.tipo,
  });
  res.status(201).json({ actuador });
}

export async function estadoAfd(req, res) {
  const afd = await afdRepo.findOrCreateByParcela(req.params.parcelaId);
  const transiciones = await afdRepo.findTransiciones(req.params.parcelaId, 50);
  res.json({ afd, transiciones });
}