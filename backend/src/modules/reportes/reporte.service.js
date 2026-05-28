import * as repo from './reporte.repository.js';

function redondear(valor) {
  return valor == null ? null : Math.round(Number(valor) * 100) / 100;
}

export async function generar(parcelaId, { tipoPeriodo, fechaInicio, fechaFin, persistir }) {
  const desde = new Date(fechaInicio);
  const hasta = new Date(fechaFin);

  const stats = await repo.estadisticasLecturas(parcelaId, desde, hasta);
  const numActivaciones = await repo.activacionesRiego(parcelaId, desde, hasta);

  const reporte = {
    parcelaId,
    tipoPeriodo,
    fechaInicio,
    fechaFin,
    totalLecturas: parseInt(stats.total_lecturas, 10),
    humedadMin: redondear(stats.humedad_min),
    humedadMax: redondear(stats.humedad_max),
    humedadPromedio: redondear(stats.humedad_promedio),
    temperaturaMin: redondear(stats.temperatura_min),
    temperaturaMax: redondear(stats.temperatura_max),
    temperaturaPromedio: redondear(stats.temperatura_promedio),
    numActivaciones,
  };

  if (persistir) {
    const guardado = await repo.guardar(reporte);
    reporte.idReporte = guardado.id_reporte;
  }

  return reporte;
}