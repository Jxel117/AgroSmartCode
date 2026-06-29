import { motion } from 'framer-motion';

/**
 * Envoltorio para animar entrada de paginas.
 * Aplica fade-in + ligero deslizamiento hacia arriba.
 * Duracion 250ms con easing suave.
 */
export default function TransicionPagina({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        duration: 0.25,
        ease: [0.16, 1, 0.3, 1], // mismo easing que usas en login-aparecer
      }}
    >
      {children}
    </motion.div>
  );
}