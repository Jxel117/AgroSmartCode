import { motion, useReducedMotion } from 'framer-motion';

/**
 * Envoltorio para animar la entrada/salida al cambiar de pagina (p.ej. Inicio -> Dispositivos).
 * Fade + ligero deslizamiento y escala.
 * Si el usuario pidio reducir movimiento, se deja solo un fundido de opacidad.
 */
export default function TransicionPagina({ children }) {
  const prefiereMenosMovimiento = useReducedMotion();

  const variantes = prefiereMenosMovimiento
    ? {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    }
    : {
      initial: { opacity: 0, y: 10, scale: 0.99 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -10, scale: 0.99 },
    };

  return (
    <motion.div
      initial={variantes.initial}
      animate={variantes.animate}
      exit={variantes.exit}
      transition={{
        duration: 0.28,
        ease: [0.16, 1, 0.3, 1], // mismo easing que usas en login-aparecer
      }}
    >
      {children}
    </motion.div>
  );
}