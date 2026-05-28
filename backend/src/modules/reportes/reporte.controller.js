import * as service from './reporte.service.js';

export async function generar(req, res) {
  const reporte = await service.generar(req.params.parcelaId, req.body);
  res.json({ reporte });
}