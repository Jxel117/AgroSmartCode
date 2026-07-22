import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Thermometer,
  Gauge,
  BellRing,
  Droplets,
  LogIn,
  Sprout,
  Frown,
  Smile,
} from 'lucide-react';
import './Landing.css';

const MANUAL_PDF = encodeURI('/Landing/Manual_de_instalación_de_dispositivo_IoT.pdf');
const POLITICA_PRIVACIDAD = encodeURI('/Landing/Politica_Privacidad_AgroSmart_v1.0.pdf');

const PASOS = [
  {
    numero: '01',
    Icono: Thermometer,
    titulo: 'Monitoreo continuo',
    texto: 'Los nodos IoT instalados en la parcela miden humedad y temperatura del suelo de forma constante, sin intervención manual.',
    imagen: '/Landing/Pasos/Paso1.jpg',
  },
  {
    numero: '02',
    Icono: Gauge,
    titulo: 'Análisis en tiempo real',
    texto: 'La plataforma cruza cada lectura con las condiciones del cultivo y determina de inmediato si el terreno necesita agua.',
    imagen: '/Landing/Pasos/Paso2.jpg',
  },
  {
    numero: '03',
    Icono: BellRing,
    titulo: 'Notificación oportuna',
    texto: 'El agricultor recibe un aviso claro para iniciar o detener el riego, sin tener que estar físicamente en la parcela.',
    imagen: '/Landing/Pasos/Paso3.jpg',
  },
  {
    numero: '04',
    Icono: Droplets,
    titulo: 'Riego preciso',
    texto: 'Se aplica solo el agua que el cultivo realmente requiere, reduciendo el desperdicio y mejorando la producción.',
    imagen: '/Landing/Pasos/Paso4.jpg',
  },
];

function inicialesEquipo(nombre) {
  return nombre
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

const EQUIPO = [
  { nombre: 'Luis Armijos', rol: 'Líder del proyecto', correo: 'luis.d.armijos.r@unl.edu.ec', foto: '/Landing/Equipo/LuisArmijos.jpeg' },
  { nombre: 'Joel Tapia', rol: 'Desarrollador principal', correo: 'stalin.tapia@unl.edu.ec', foto: '/Landing/Equipo/JoelTapia.jpeg' },
  { nombre: 'Eberson Guayllas', rol: 'Analista del Sistema', correo: 'eberson.guayllas@unl.edu.ec', foto: '/Landing/Equipo/EbersonGuayllas.jpeg' },
  { nombre: 'Freddy Matailo', rol: 'Líder de Análisis y Documentación', correo: 'freddy.matailo@unl.edu.ec', foto: '/Landing/Equipo/FreddyMatailo.jpeg' },
  { nombre: 'Santiago Tamayo', rol: 'Arquitecto de Software', correo: 'manuel.tamayo@unl.edu.ec', foto: '/Landing/Equipo/SantiagoTamayo.jpeg' },
];

const CONTACTOS = EQUIPO;

// Aislada en su propio componente para que sus re-renders no afecten al
// resto de la landing. El paso avanza solo (automatico), sin intervencion
// del usuario: no hay botones ni clics que interrumpan la secuencia. El
// avance se pausa mientras la seccion no esta en pantalla. Las imagenes
// (ya optimizadas, ~20-80KB cada una) se cargan de inmediato para que no
// se vea un espacio vacio al llegar a la seccion.
function ComoFunciona() {
  const [pasoActivo, setPasoActivo] = useState(0);
  const [comoVisible, setComoVisible] = useState(false);
  const comoRef = useRef(null);

  useEffect(() => {
    const el = comoRef.current;
    if (!el) return;
    const observador = new IntersectionObserver(
      ([entrada]) => setComoVisible(entrada.isIntersecting),
      { threshold: 0.15 }
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    if (!comoVisible) return;
    const id = setTimeout(() => {
      setPasoActivo((i) => (i + 1) % PASOS.length);
    }, 3500);
    return () => clearTimeout(id);
  }, [pasoActivo, comoVisible]);

  return (
    <section className="landing-como" id="como-funciona" ref={comoRef}>
      <h2 className="landing-titulo-seccion landing-titulo-seccion--centrado">¿Cómo funciona AgroSmart?</h2>
      <p className="landing-como-intro">
        Conectando el campo con la tecnología, paso a paso.
      </p>

      <div className="landing-como-grid">
        <ol className="landing-pasos">
          {PASOS.map(({ numero, Icono, titulo, texto }, i) => (
            <li
              className={`landing-paso${i === pasoActivo ? ' landing-paso--activo' : ''}`}
              key={numero}
              aria-current={i === pasoActivo ? 'step' : undefined}
            >
              <div className="landing-paso-item">
                <span className="landing-paso-marca">
                  <span className="landing-paso-icono">
                    <Icono size={18} strokeWidth={1.8} />
                  </span>
                  <span className="landing-paso-numero" aria-hidden="true">{numero}</span>
                </span>
                <span className="landing-paso-texto">
                  <h3>{titulo}</h3>
                  <p>{texto}</p>
                </span>
              </div>
            </li>
          ))}
        </ol>

        <div className="landing-como-carrusel">
          {PASOS.map(({ numero, imagen, titulo }, i) => (
            <img
              key={numero}
              src={imagen}
              alt={`Paso ${numero}: ${titulo}`}
              className={`landing-como-carrusel-img${i === pasoActivo ? ' landing-como-carrusel-img--activa' : ''}`}
              decoding="async"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const [conScroll, setConScroll] = useState(false);

  useEffect(() => {
    function alDesplazar() {
      setConScroll(window.scrollY > 20);
    }
    window.addEventListener('scroll', alDesplazar, { passive: true });
    return () => window.removeEventListener('scroll', alDesplazar);
  }, []);

  const anio = new Date().getFullYear();

  return (
    <div className="landing">
      <header className={`landing-header${conScroll ? ' landing-header--solido' : ''}`}>
        <div className="landing-header-inner">
          <a href="#inicio" className="landing-marca">
            <img src="/logo_agrosmart_planta.svg" alt="AgroSmart" className="landing-marca-logo" />
            <span>AgroSmart</span>
          </a>

          <nav className="landing-nav" aria-label="Principal">
            <a href="#contacto" className="btn btn-fantasma landing-btn landing-btn-contacto">
              Contáctanos
            </a>
            <Link to="/login" className="btn btn-primario landing-btn landing-btn-login">
              <LogIn size={17} strokeWidth={1.8} />
              Iniciar sesión
            </Link>
          </nav>
        </div>
      </header>

      <main id="inicio">
        {/* ============ HERO / QUE ES ============ */}
        <section className="landing-hero" id="bienvenida">
          <div className="landing-hero-fondo" aria-hidden="true" />
          <div className="landing-hero-fondo-overlay" aria-hidden="true" />

          <div className="landing-hero-contenido">
            <span className="landing-eyebrow">
              <Sprout size={15} strokeWidth={2} />
              Riego inteligente basado en IoT
            </span>

            <h1 className="landing-hero-titulo">
              Riega con inteligencia, cultiva con confianza.
            </h1>

            <h2 className="landing-hero-subtitulo">¿Qué es AgroSmart?</h2>

            <p className="landing-hero-texto-cuerpo">
              AgroSmart es una plataforma inteligente de monitoreo y gestión del riego agrícola que integra tecnologías IoT (
              Internet de las Cosas) para transformar la manera en que se administra el agua en los cultivos. 
              Su enfoque principal es la automatización, facilidad de uso y tecnología de vanguardia para ayudar a productores agrícolas 
              a incrementar la productividad, reducir el desperdicio de agua y promover una agricultura más sostenible.
            </p>
            <p className="landing-hero-texto-cuerpo">
              El sistema combina un dispositivo electrónico instalado en el campo con una plataforma web que recopila, procesa 
              y visualiza en tiempo real la información proveniente de los sensores. Gracias al monitoreo continuo de variables 
              como la humedad del suelo y la temperatura ambiental, AgroSmart proporciona información precisa que ayuda al agricultor 
              a conocer el estado de su cultivo y tomar decisiones de riego basadas en datos, optimizando el uso de los recursos y 
              favoreciendo una producción más eficiente y sostenible.
            </p>
          </div>
        </section>

        {/* ============ QUE RESOLVEMOS ============ */}
        <section className="landing-problema" id="que-resuelve">
          <div className="landing-problema-grid">
            <div className="landing-problema-visual">
              <img
                src="/Landing/Img2.jpg"
                alt="Agricultor sosteniendo un puñado de tierra de su cultivo en una ladera del campo ecuatoriano"
                loading="lazy"
                decoding="async"
              />
              <div className="landing-problema-destacado">
                “Sin datos del suelo, regar es una apuesta. Con AgroSmart, es una decisión inteligente.”
              </div>
            </div>

            <div className="landing-problema-texto">
              <h2 className="landing-titulo-seccion">¿Qué resuelve AgroSmart?</h2>

              <div className="landing-problema-bloque">
                <span className="landing-problema-etiqueta landing-problema-etiqueta--riesgo">
                  ANTES
                  <Frown size={14} strokeWidth={2} />
                </span>
                <p>
                  En el campo existe un uso excesivo de agua en los cultivos debido a la falta de
                  información precisa sobre las condiciones del suelo. En muchos casos, los
                  agricultores riegan por estimación, sin contar con un indicador que les permita
                  saber cuándo es realmente necesario iniciar o detener el riego, lo que provoca un
                  desperdicio significativo de agua y una menor eficiencia en la producción agrícola.
                </p>
              </div>

              <div className="landing-problema-bloque">
                <span className="landing-problema-etiqueta landing-problema-etiqueta--solucion">
                  CON AGROSMART
                  <Smile size={14} strokeWidth={2} />
                </span>
                <p>
                  AgroSmart transforma el riego en una decisión basada en datos. Nuestro dispositivo inteligente, apoyado en tecnología IoT
                  (Internet de las Cosas), monitorea continuamente la temperatura y la humedad del suelo, analiza la información en tiempo real
                  y determina el momento adecuado para iniciar o detener el riego.
                  De esta manera, el agricultor recibe información confiable para tomar mejores decisiones, reducir el desperdicio de agua, optimizar los recursos y lograr un cultivo más eficiente y sostenible.
                </p>
              </div>
            </div>
          </div>
        </section>

        <ComoFunciona />

        {/* ============ EQUIPO ============ */}
        <section className="landing-equipo" id="equipo">
          <h2 className="landing-titulo-seccion landing-titulo-seccion--centrado">¿Quienes forman parte de AgroSmart?</h2>
          <p className="landing-como-intro">
            Tecnología e innovación al servicio de una gestión agrícola más eficiente.
          </p>

          <div className="landing-equipo-fila">
              {EQUIPO.map((p) => (
              <div className="landing-persona-tarjeta" key={p.correo}>
                <div className="landing-persona-tarjeta-foto">
                  {p.foto ? (
                    <img src={p.foto} alt={p.nombre} loading="lazy" decoding="async" />
                  ) : (
                    <span className="landing-persona-tarjeta-iniciales">{inicialesEquipo(p.nombre)}</span>
                  )}
                </div>
                <h3>{p.nombre}</h3>
                <p className="landing-persona-tarjeta-rol">{p.rol}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ============ CONTACTO / FOOTER ============ */}
      <footer className="landing-footer" id="contacto">
        <div className="landing-footer-inner">
          <div className="landing-footer-grid">
            <div className="landing-footer-info">
              <h2>Contáctanos</h2>

              <ul className="landing-footer-contactos">
                {CONTACTOS.map((p) => (
                  <li key={p.correo}>
                    <span className="landing-footer-contacto-nombre">{p.nombre}</span>
                    <a href={`mailto:${p.correo}`}>{p.correo}</a>
                  </li>
                ))}
              </ul>

              <p className="landing-footer-nota">
                Desarrollado por un equipo comprometido con la innovación y la transformación digital del sector agrícola.
              </p>

              <div className="landing-footer-utilidades">
                <a href={MANUAL_PDF} target="_blank" rel="noopener noreferrer">Manual de usuario</a>
                <span className="landing-footer-separador" aria-hidden="true">·</span>
                <a href={POLITICA_PRIVACIDAD} target="_blank" rel="noopener noreferrer">Política de privacidad</a>
              </div>
            </div>

            <div className="landing-footer-marca">
              <div className="landing-footer-foto-marco">
                <img src="/Landing/Equipo/Equipo.png" alt="Equipo de AgroSmart" />
              </div>
              <span className="landing-footer-foto-nota">Equipo de trabajo</span>
            </div>
          </div>

          <div className="landing-footer-legal">
            &copy; {anio} AgroSmart. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
