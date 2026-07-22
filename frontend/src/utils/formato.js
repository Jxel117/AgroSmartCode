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

// Saludo segun la hora del dia ("Buenos dias, Nombre") para encabezados de bienvenida
export function saludo(nombre) {
  const horaActual = new Date().getHours();
  let momento;
  if (horaActual < 12) momento = 'Buenos días';
  else if (horaActual < 19) momento = 'Buenas tardes';
  else momento = 'Buenas noches';
  return nombre ? `${momento}, ${nombre}` : momento;
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

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function esMismoDia(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Etiqueta legible para agrupar por dia: "Hoy", "Ayer" o "13 de julio de 2026"
export function etiquetaDia(iso) {
  if (!iso) return '—';
  const fecha = new Date(iso);
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  if (esMismoDia(fecha, hoy)) return 'Hoy';
  if (esMismoDia(fecha, ayer)) return 'Ayer';
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}

// Clave estable (YYYY-MM-DD) para agrupar por dia
export function claveDia(iso) {
  const f = new Date(iso);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
}

// Etiqueta legible para agrupar por mes: "Julio 2026"
export function etiquetaMes(iso) {
  const f = new Date(iso);
  const nombre = MESES[f.getMonth()];
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${f.getFullYear()}`;
}

// Clave estable (YYYY-MM) para agrupar por mes
export function claveMes(iso) {
  const f = new Date(iso);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`;
}