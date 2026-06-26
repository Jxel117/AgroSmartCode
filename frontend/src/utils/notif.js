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
};

// Re-exporta toast por si se necesita uso directo
export { toast };