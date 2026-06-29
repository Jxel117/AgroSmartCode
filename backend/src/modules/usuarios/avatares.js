export const AVATARES_DISPONIBLES = [
  'avatar-1',
  'avatar-2',
  'avatar-3',
  'avatar-4',
];

export function esAvatarValido(id) {
  return AVATARES_DISPONIBLES.includes(id);
}