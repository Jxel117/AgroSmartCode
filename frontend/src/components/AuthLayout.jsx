import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Droplets, Radio, ShieldCheck } from 'lucide-react';
import FondoCarrusel from './FondoCarrusel.jsx';
import './AuthLayout.css';

const CARACTERISTICAS = [
  { Icono: Activity, texto: 'Monitoreo en tiempo real de humedad y temperatura' },
  { Icono: Droplets, texto: 'Riego automatizado según la necesidad de cada parcela' },
  { Icono: Radio, texto: 'Sensores IoT conectados a tu finca las 24 horas' },
  { Icono: ShieldCheck, texto: 'Acceso protegido con verificación en cada ingreso' },
];

const DURACION_MENSAJE_MS = 6000;

function MensajesFlotantes() {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndice((i) => (i + 1) % CARACTERISTICAS.length);
    }, DURACION_MENSAJE_MS);
    return () => clearInterval(id);
  }, []);

  const { Icono, texto } = CARACTERISTICAS[indice];

  return (
    <div className="auth-splash">
      <AnimatePresence mode="wait">
        <motion.div
          key={indice}
          className="auth-splash-mensaje"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 14 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="auth-splash-icono"><Icono size={20} strokeWidth={1.8} /></span>
          <span className="auth-splash-texto">{texto}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function LogoHero() {
  return (
    <div className="auth-hero-logo-wrap">
      <span className="auth-hero-ping auth-hero-ping--1" />
      <span className="auth-hero-ping auth-hero-ping--2" />
      <span className="auth-hero-ping auth-hero-ping--3" />
      <span className="auth-hero-circulo" />
      <img src="/agrosmart.svg" alt="AgroSmart" className="auth-hero-logo" />
    </div>
  );
}

export default function AuthLayout({ titulo, subtitulo, children, mensajesFlotantes = false }) {
  const anio = new Date().getFullYear();

  return (
    <div className="auth-pagina">
      <div className="auth-fondo-container">
        <FondoCarrusel />
        <div className="auth-fondo-overlay" />
      </div>

      <div className="auth-contenido">
        <div className="auth-fila">
          <div className="auth-columna-central">
            <LogoHero />

            <motion.div
              className="auth-tarjeta"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="auth-tarjeta-logo">
                <span className="auth-tarjeta-logo-titulo">Bienvenido a AgroSmart</span>
                {mensajesFlotantes && <MensajesFlotantes />}
                <span className="auth-tarjeta-logo-subtitulo">{titulo}</span>
                {subtitulo && <p className="auth-tarjeta-logo-descripcion">{subtitulo}</p>}
              </div>

              {children}
            </motion.div>
          </div>
        </div>

        <footer className="auth-derechos">
          &copy; {anio} AgroSmart. Todos los derechos reservados.
        </footer>
      </div>
    </div>
  );
}
