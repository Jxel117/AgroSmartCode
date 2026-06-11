// Politica de contrasena: minimo 8 caracteres, al menos una mayuscula,
// una minuscula, un numero y un caracter especial.

const REGLAS = [
  { test: (s) => s.length >= 8, mensaje: 'Mínimo 8 caracteres' },
  { test: (s) => /[A-Z]/.test(s), mensaje: 'Al menos una letra mayúscula' },
  { test: (s) => /[a-z]/.test(s), mensaje: 'Al menos una letra minúscula' },
  { test: (s) => /[0-9]/.test(s), mensaje: 'Al menos un número' },
  { test: (s) => /[^A-Za-z0-9]/.test(s), mensaje: 'Al menos un carácter especial' },
];

// Devuelve un array de mensajes de error (vacio si la contrasena es valida)
export function validarPassword(password) {
  return REGLAS.filter((r) => !r.test(password)).map((r) => r.mensaje);
}

export function esPasswordValida(password) {
  return validarPassword(password).length === 0;
}