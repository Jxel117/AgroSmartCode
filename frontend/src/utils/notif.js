import { toast } from 'sonner';

/**
 * Helpers de notificacion con posicion y duracion contextual.
 *
 * Uso:
 *   notif.exito('Guardado correctamente');           // bottom-right, 2.5s (default)
 *   notif.error('No se pudo guardar');               // bottom-right, 3s
 *   notif.formulario.exito('Datos actualizados');    // top-center, 2.5s (mas visible)
 *   notif.formulario.error('Revisa los campos');     // top-center, 3.5s
 *
 * Reservamos top-center para acciones criticas que requieren atencion:
 * formularios de creacion/edicion, login, perfil, recuperacion de contrasena.
 */

export const notif = {
  // Notificaciones generales: discretas (bottom-right)
  exito: (msg, opts) => toast.success(msg, { duration: 2500, ...opts }),
  error: (msg, opts) => toast.error(msg, { duration: 3500, ...opts }),
  info: (msg, opts) => toast.info(msg, { duration: 2500, ...opts }),
  alerta: (msg, opts) => toast.warning(msg, { duration: 3000, ...opts }),

  // Notificaciones de formularios criticos: top-center, mas notorias
  formulario: {
    exito: (msg, opts) => toast.success(msg, { duration: 2500, position: 'top-center', ...opts }),
    error: (msg, opts) => toast.error(msg, { duration: 3500, position: 'top-center', ...opts }),
    alerta: (msg, opts) => toast.warning(msg, { duration: 3000, position: 'top-center', ...opts }),
  },

  /**
   * Notificacion con cuenta regresiva visual antes de confirmar una accion
   * automatica (ej. activacion de riego). Actualiza el mismo toast (por id)
   * en vez de apilar uno nuevo por segundo.
   *
   * @param {string} causa       Motivo mostrado antes de la cuenta regresiva
   * @param {string} mensajeFinal Texto mostrado al llegar a cero
   * @param {object} [opts]
   * @param {number} [opts.desde=5]
   * @param {number} [opts.pasoMs=1000]
   */
  cuentaRegresiva(causa, mensajeFinal, opts = {}) {
    const { desde = 5, pasoMs = 1000, id = `cuenta-${Date.now()}` } = opts;
    let n = desde;
    toast.warning(`${causa} — activándose en ${n}...`, { id, duration: Infinity });
    const intervalo = setInterval(() => {
      n -= 1;
      if (n > 0) {
        toast.warning(`${causa} — activándose en ${n}...`, { id, duration: Infinity });
      } else {
        clearInterval(intervalo);
        toast.success(mensajeFinal, { id, duration: 3000 });
      }
    }, pasoMs);
    return () => clearInterval(intervalo);
  },
};

// Re-exporta toast por si se necesita uso directo
export { toast };