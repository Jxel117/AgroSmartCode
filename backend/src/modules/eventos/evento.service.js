import * as repo from './evento.repository.js';

export async function listarEventos(filtros) {
  return repo.findEventos(filtros);
}

export async function obtenerStats(empresaId) {
  const [diarias, categorias, resumen] = await Promise.all([
    repo.getStatsDiarias(empresaId),
    repo.getStatsCategorias(empresaId),
    repo.getResumen(empresaId),
  ]);

  return { diarias, categorias, resumen };
}

export async function exportarEventos(filtros) {
  return repo.exportar(filtros);
}
