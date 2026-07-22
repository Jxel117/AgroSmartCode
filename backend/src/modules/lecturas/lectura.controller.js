import * as service from './lectura.service.js';
import * as estadoRiegoService from '../riego/estadoRiego.service.js';
import { AppError } from '../../utils/AppError.js';

// Llamado por el DISPOSITIVO (auth por credencial de nodo)
export async function ingestar(req, res) {
  const resultado = await service.ingestar(req.nodo.id, req.body);
  if (!resultado) throw AppError.notFound('Nodo no encontrado');
  res.status(201).json(resultado);
}

// Reporte de estado de riego de un nodo autonomo (equivalente REST al topic
// MQTT "riegostatus"), para nodos que no usan MQTT.
export async function riegostatus(req, res) {
  const resultado = await estadoRiegoService.reportarEstadoRiego(req.nodo.id, req.body);
  if (!resultado) throw AppError.notFound('Nodo no encontrado o sin parcela asignada');
  res.status(200).json({ ok: true });
}

// Llamado por el FRONTEND (auth por JWT de usuario)
export async function recientes(req, res) {
  const limite = req.query.limite ? parseInt(req.query.limite, 10) : 100;
  const lecturas = await service.lecturasRecientes(req.params.parcelaId, limite);
  res.json({ lecturas });
}