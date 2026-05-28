export function fechaHora(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-EC', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function hora(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
}

const ETIQUETAS = {
  S0_MONITOREO: 'Monitoreo', S1_EVALUACION: 'Evaluacion',
  S2_RIEGO_ACTIVO: 'Riego activo', S3_RIEGO_DETENIDO: 'Riego detenido', S4_FALLO: 'Fallo',
};
export function etiquetaEstadoAfd(estado) {
  return ETIQUETAS[estado] ?? estado;
}

export function claseBadgeEstado(estado) {
  if (['ACTIVA', 'ACTIVO', 'VALIDA', 'S2_RIEGO_ACTIVO'].includes(estado)) return 'badge-verde';
  if (['ADVERTENCIA', 'PAUSADA', 'DESCONECTADO'].includes(estado)) return 'badge-ambar';
  if (['CRITICA', 'FALLO', 'S4_FALLO', 'SUSPENDIDA'].includes(estado)) return 'badge-rojo';
  return 'badge-gris';
}