/**
 * Utilidades para avatar del usuario.
 * Usa SVG inline minimalista (silueta humana en circulo) como por defecto.
 * Cuando el usuario suba foto custom, se mostrara esa en su lugar.
 */

/**
 * Iniciales como fallback si la imagen no carga.
 */
export function iniciales(usuario) {
  if (!usuario) return '?';
  const n = usuario.nombre?.[0] ?? '';
  const a = usuario.apellido?.[0] ?? '';
  return `${n}${a}`.toUpperCase() || '?';
}

/**
 * Devuelve true si el usuario tiene foto custom subida.
 */
export function tieneFotoCustom(usuario) {
  return Boolean(usuario?.foto_url);
}