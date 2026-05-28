import { useState, useEffect, useCallback } from 'react';

// Ejecuta una funcion async y maneja los estados de carga/error.
// 'deps' controla cuando se recarga.
export function useFetch(fn, deps = []) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const resultado = await fn();
      setDatos(resultado);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al cargar datos');
    } finally {
      setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { recargar(); }, [recargar]);

  return { datos, cargando, error, recargar };
}