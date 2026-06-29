import { useState, useCallback } from 'react';

/**
 * Hook para gestionar errores de validacion por campo.
 *
 * Uso:
 *   const { errores, setError, limpiarError, limpiarTodos, validar } = useValidacionForm();
 *
 *   // Validar antes de enviar:
 *   const reglas = {
 *     nombre: (v) => !v?.trim() ? 'El nombre es obligatorio' : null,
 *     correoValidacion: (v) => !v ? 'El correo es obligatorio'
 *       : !v.endsWith('@gmail.com') ? 'Debe ser un Gmail' : null,
 *   };
 *   if (!validar(form, reglas)) return;
 *
 *   // Errores del backend (zod) tambien se pueden inyectar:
 *   setErroresBackend(detalles); // detalles es el array de err.response.data.details
 */
export function useValidacionForm() {
  const [errores, setErrores] = useState({});

  const setError = useCallback((campo, mensaje) => {
    setErrores((prev) => ({ ...prev, [campo]: mensaje }));
  }, []);

  const limpiarError = useCallback((campo) => {
    setErrores((prev) => {
      const next = { ...prev };
      delete next[campo];
      return next;
    });
  }, []);

  const limpiarTodos = useCallback(() => setErrores({}), []);

  const validar = useCallback((datos, reglas) => {
    const nuevos = {};
    let valido = true;
    for (const campo in reglas) {
      const mensaje = reglas[campo](datos[campo], datos);
      if (mensaje) {
        nuevos[campo] = mensaje;
        valido = false;
      }
    }
    setErrores(nuevos);
    return valido;
  }, []);

  const setErroresBackend = useCallback((detalles) => {
    if (!Array.isArray(detalles)) return;
    const nuevos = {};
    detalles.forEach((d) => {
      if (d.campo) nuevos[d.campo] = d.mensaje;
    });
    setErrores(nuevos);
  }, []);

  return { errores, setError, limpiarError, limpiarTodos, validar, setErroresBackend };
}