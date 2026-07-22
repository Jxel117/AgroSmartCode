import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Droplets, Thermometer, Waves, Activity, Sprout, CalendarClock, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useEventoSocket } from '../context/SocketContext.jsx';
import { parcelasApi, lecturasApi, riegoApi, nodosApi } from '../api/endpoints.js';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import EstadoVacio from '../components/EstadoVacio.jsx';
import { SkeletonTarjeta } from '../components/Skeleton.jsx';
import { hora, saludo } from '../utils/formato.js';

// Estados que puede reportar el ticker en vivo del nodo (ver estado_riego).
// "Evaluacion" e "Iniciando riego" comparten semantica (el sistema esta
// decidiendo) pero se muestran distinto para seguir el flujo real del nodo.
const ETIQUETA_RIEGO_VIVO = {
  EVALUANDO: 'Evaluación',
  NORMAL: 'Evaluación',
  PREPARANDO: 'Iniciando riego',
  REGANDO: 'Riego activo',
  DETENIDO: 'Riego finalizado',
  COMPLETADO: 'Riego finalizado',
  FALLO: 'Fallo del sensor',
};
const CLASE_RIEGO_VIVO = {
  PREPARANDO: 'badge-ambar',
  REGANDO: 'badge-verde',
  FALLO: 'badge-rojo',
};

// Nodos "no autonomos" (el backend decide el riego, ver AFD) nunca mandan
// EVALUANDO/PREPARANDO/REGANDO por riegostatus: solo reportan humedad y el
// backend calcula su propia maquina de estados. Sin este mapeo, la tarjeta
// se quedaria en "Cargando..." para siempre con esos nodos.
const MAPEO_AFD_A_RIEGO_VIVO = {
  S0_MONITOREO: 'EVALUANDO',
  S1_EVALUACION: 'EVALUANDO',
  S2_RIEGO_ACTIVO: 'REGANDO',
  S3_RIEGO_DETENIDO: 'DETENIDO',
  S4_FALLO: 'FALLO',
};
// Color del anillo y duracion total de cada fase, para dibujar la cuenta
// regresiva (ver AnilloCuentaRegresiva). Solo las fases con cuenta propia.
const COLOR_RIEGO_VIVO = {
  EVALUANDO: 'var(--gris-500)',
  PREPARANDO: 'var(--ambar)',
  REGANDO: 'var(--verde-500)',
};
const TOTAL_SEGUNDOS_RIEGO_VIVO = {
  EVALUANDO: 10,
  PREPARANDO: 5,
  REGANDO: 3,
};

const SUBTITULO_INICIO = 'Visualiza en tiempo real el estado de tus cultivos y del sistema de riego. Consulta la humedad del suelo, la temperatura, el estado del riego, las lecturas más recientes y los eventos relevantes.';

const VARIANTES_LISTA = {
  oculto: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const VARIANTES_ITEM = {
  oculto: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

const VENTANA_MAX = 80;

export default function IoTDashboard() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [parcelas, setParcelas] = useState([]);
  const [parcelaId, setParcelaId] = useState('');
  const [lecturas, setLecturas] = useState([]);
  const [config, setConfig] = useState(null);
  const [nodos, setNodos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [riegoEnVivo, setRiegoEnVivo] = useState(null);
  const [totalLecturas, setTotalLecturas] = useState(0);

  useEffect(() => {
    parcelasApi.listar().then(({ data }) => {
      setParcelas(data.parcelas);
      if (data.parcelas.length > 0) setParcelaId(data.parcelas[0].id_parcela);
      else setCargando(false);
    });
  }, []);

  const totalLecturasInicializado = useRef(false);

  useEffect(() => {
    if (!parcelaId) return;
    let activo = true;
    totalLecturasInicializado.current = false;

    async function cargar() {
      try {
        const [lec, nodosRes, afdRes] = await Promise.all([
          lecturasApi.porParcela(parcelaId, VENTANA_MAX),
          nodosApi.listar(),
          riegoApi.afd(parcelaId),
        ]);
        if (!activo) return;
        setLecturas([...lec.data.lecturas].reverse());
        // Solo fijamos el contador la primera vez: en los refrescos periodicos
        // siguientes el total ya lo lleva onLecturaNueva por WebSocket, y si
        // lo reasignaramos aqui quedaria pegado al limite de la ventana (80).
        if (!totalLecturasInicializado.current) {
          setTotalLecturas(lec.data.lecturas.length);
          totalLecturasInicializado.current = true;
        }
        setNodos(nodosRes.data.nodos);
        // Solo sirve de respaldo inicial para nodos NO autonomos (el backend
        // decide el riego vía AFD): si ya llego un riegostatus en vivo, no lo
        // pisamos. Los nodos autonomos ni siquiera tienen AFD que avance.
        const estadoAfd = MAPEO_AFD_A_RIEGO_VIVO[afdRes.data.afd?.estado_actual];
        if (estadoAfd) {
          setRiegoEnVivo((prev) => prev ?? {
            estado: estadoAfd, segundos: null, timestamp: afdRes.data.afd.fecha_ultimo_cambio_estado,
          });
        }
        try {
          const cfg = await riegoApi.configuracion(parcelaId);
          if (activo) setConfig(cfg.data.configuracion);
        } catch { if (activo) setConfig(null); }
      } finally {
        if (activo) setCargando(false);
      }
    }

    setCargando(true);
    cargar();
    // 10s en vez de 30s: es el respaldo para detectar que el nodo se
    // desconecto (la conexion "SI esta activo" ya se refleja al instante
    // por WebSocket, ver marcarNodoActivo). 30s se sentia muy desfasado
    // respecto al monitor serial del ESP32.
    const intervalo = setInterval(cargar, 10000);
    return () => { activo = false; clearInterval(intervalo); };
  }, [parcelaId]);

  // El estado ACTIVO/DESCONECTADO del nodo solo llega por sondeo REST cada
  // 30s. Si el dispositivo se reconecta o riega en ese intervalo, la UI se ve
  // "atrasada" respecto al monitor serial. Como recibir un evento en vivo es
  // en si mismo la prueba de que el nodo esta conectado, lo marcamos activo
  // de inmediato en vez de esperar al proximo sondeo.
  const marcarNodoActivo = useCallback(() => {
    setNodos((prev) => prev.map((n) => (
      n.parcela_id === parcelaId && n.estado !== 'ACTIVO' ? { ...n, estado: 'ACTIVO' } : n
    )));
  }, [parcelaId]);

  const onLecturaNueva = useCallback((lectura) => {
    if (lectura.parcela_id !== parcelaId) return;
    marcarNodoActivo();
    setLecturas((prev) => {
      const nueva = [...prev, lectura];
      if (nueva.length > VENTANA_MAX) return nueva.slice(nueva.length - VENTANA_MAX);
      return nueva;
    });
    setTotalLecturas((prev) => prev + 1);
  }, [parcelaId, marcarNodoActivo]);

  const onAlertaNueva = useCallback(() => {}, []);

  // El ticker de "Evaluacion" del nodo publica un estado_riego cada ~1s sin
  // parar (evaluando, iniciando riego, riego activo o riego finalizado), asi
  // que esta tarjeta puede mostrar siempre lo ultimo recibido, sin
  // temporizadores de auto-apagado: el proximo tick ya lo corrige solo.
  const onEstadoRiego = useCallback((data) => {
    if (data.parcela_id !== parcelaId) return;
    marcarNodoActivo();
    setRiegoEnVivo({ estado: data.estado, segundos: data.segundos || null, timestamp: data.timestamp });
  }, [parcelaId, marcarNodoActivo]);

  // Respaldo para nodos NO autonomos: no mandan estado_riego, solo avanzan
  // el AFD del backend. Sin esto la tarjeta se queda en "Cargando..." para
  // siempre con esos nodos.
  const onTransicionAfd = useCallback((transicion) => {
    if (transicion.parcela_id !== parcelaId) return;
    marcarNodoActivo();
    const estado = MAPEO_AFD_A_RIEGO_VIVO[transicion.estadoDestino];
    if (estado) setRiegoEnVivo({ estado, segundos: null, timestamp: transicion.timestamp });
  }, [parcelaId, marcarNodoActivo]);

  useEventoSocket('lectura_nueva', onLecturaNueva);
  useEventoSocket('alerta_nueva', onAlertaNueva);
  useEventoSocket('estado_riego', onEstadoRiego);
  useEventoSocket('transicion_afd', onTransicionAfd);

  const ultima = lecturas[lecturas.length - 1];
  const nodoParcela = nodos.find(n => n.parcela_id === parcelaId);
  const nodoActivo = nodoParcela?.estado === 'ACTIVO';
  const datosGrafico = lecturas.map((l) => ({
    hora: hora(l.timestamp_utc),
    humedad: l.humedad != null ? Number(l.humedad) : null,
    temperatura: l.temperatura != null ? Number(l.temperatura) : null,
  }));

  if (parcelas.length === 0 && !cargando) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <EncabezadoPagina
          titulo={saludo(usuario?.nombre)}
          descripcion={SUBTITULO_INICIO}
        />
        {usuario?.empresaIdentificador && (
          <div style={{ background: 'var(--verde-50)', color: 'var(--verde-700)', padding: '0.6rem 1rem', borderRadius: 'var(--radio-sm)', marginBottom: '1.2rem', fontSize: '0.88rem', fontWeight: 500 }}>
            Empresa: <strong>{usuario.empresaIdentificador}</strong>
          </div>
        )}
        <div className="tarjeta">
          <EstadoVacio
            icono={Sprout}
            titulo="Todavía no tienes terrenos asignados"
            descripcion="Aquí verás la humedad, temperatura y el estado del riego apenas tengas un terreno vinculado a tu cuenta. Pide a un administrador que te asigne uno o revisa la sección de Terrenos."
            accion={
              <button className="btn btn-secundario" onClick={() => navigate('/parcelas')}>
                Ver Terrenos
              </button>
            }
          />
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <EncabezadoPagina
        titulo={saludo(usuario?.nombre)}
        descripcion={SUBTITULO_INICIO}
        accion={
          <div className="dash-header-acciones">
            {usuario?.empresaIdentificador && (
              <span className="dash-empresa-chip">
                Empresa: <strong>{usuario.empresaIdentificador}</strong>
              </span>
            )}
            <select className="dash-selector" value={parcelaId} onChange={(e) => setParcelaId(e.target.value)}>
              {parcelas.map((p) => (
                <option key={p.id_parcela} value={p.id_parcela}>{p.nombre_descriptivo}</option>
              ))}
            </select>
          </div>
        }
      />

      {cargando ? (
        <div className="fade-in">
          <div className="dash-tarjetas">
            <SkeletonTarjeta /><SkeletonTarjeta /><SkeletonTarjeta /><SkeletonTarjeta />
          </div>
          <p style={{ textAlign: 'center', color: 'var(--gris-500)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Cargando las lecturas más recientes de tu terreno…
          </p>
          <div className="tarjeta dash-grafico" style={{ display: 'grid', placeItems: 'center', minHeight: 320 }}>
            <div className="spinner" />
          </div>
        </div>
      ) : (
        <motion.div variants={VARIANTES_LISTA} initial="oculto" animate="visible">
          <div className="dash-tarjetas-header">
            <button className="header-nav-item" onClick={() => navigate('/eventos')}>
              <CalendarClock size={17} strokeWidth={1.8} />
              <span>Eventos registrados</span>
            </button>
          </div>
          <motion.div className="dash-tarjetas" variants={VARIANTES_ITEM}>
            <TarjetaMetrica
              titulo="Humedad del suelo"
              valor={ultima?.humedad != null ? `${ultima.humedad}%` : '—'}
              detalle={!nodoActivo ? 'Verifica la conexión del dispositivo' : config ? `Rango ideal ${config.umin}–${config.umax}%` : 'Aún sin configuración de riego'}
              color="var(--azul)"
              Icono={Droplets}
              fondoIcono="var(--azul-50)"
              noConectado={!nodoActivo}
            />
            <TarjetaMetrica
              titulo="Temperatura"
              valor={ultima?.temperatura != null ? `${ultima.temperatura}°C` : '—'}
              detalle={!nodoActivo ? 'Verifica la conexión del dispositivo' : config ? `Máximo tolerado ${config.t_maximo}°C` : 'Aún sin configuración de riego'}
              color="var(--ambar)"
              Icono={Thermometer}
              fondoIcono="var(--ambar-50)"
              noConectado={!nodoActivo}
            />
            <div className="tarjeta tarjeta-hover dash-tarjeta-estado">
              <div className="dash-tarjeta-header">
                <span className="dash-tarjeta-titulo">Estado del riego</span>
                <span className="dash-tarjeta-icono" style={{ color: 'var(--verde-600)', background: 'var(--gris-50)', padding: 0 }}>
                  {riegoEnVivo?.segundos ? (
                    <AnilloCuentaRegresiva
                      segundos={riegoEnVivo.segundos}
                      total={TOTAL_SEGUNDOS_RIEGO_VIVO[riegoEnVivo.estado] ?? 5}
                      color={COLOR_RIEGO_VIVO[riegoEnVivo.estado] ?? 'var(--gris-500)'}
                    />
                  ) : (
                    <Clock size={18} strokeWidth={1.75} />
                  )}
                </span>
              </div>
              {!nodoActivo ? (
                <span className="badge badge-gris" style={{ fontSize: '0.95rem', padding: '0.4rem 0.9rem', marginTop: '0.6rem', width: 'fit-content' }}>
                  No conectado
                </span>
              ) : !riegoEnVivo ? (
                <span className="badge badge-gris" style={{ fontSize: '0.95rem', padding: '0.4rem 0.9rem', marginTop: '0.6rem', width: 'fit-content' }}>
                  Cargando…
                </span>
              ) : (
                <span className={`badge ${CLASE_RIEGO_VIVO[riegoEnVivo.estado] ?? 'badge-gris'}`} style={{ fontSize: '0.95rem', padding: '0.4rem 0.9rem', marginTop: '0.6rem', width: 'fit-content' }}>
                  {ETIQUETA_RIEGO_VIVO[riegoEnVivo.estado] ?? riegoEnVivo.estado}
                </span>
              )}
              <span className="dash-tarjeta-detalle">
                {nodoActivo && riegoEnVivo ? `Última actualización: ${hora(riegoEnVivo.timestamp)}` : 'Sin datos recientes'}
              </span>
            </div>
            <TarjetaMetrica
              titulo="Lecturas registradas"
              valor={totalLecturas}
              detalle="En la sesion actual"
              color="var(--tierra-500)"
              Icono={Activity}
              fondoIcono="rgba(160, 125, 79, 0.14)"
            />
          </motion.div>

          <motion.div className="tarjeta dash-grafico" variants={VARIANTES_ITEM}>
            <div className="dash-seccion-header">
              <div className="dash-seccion-titulo-grupo">
                <h3>Humedad y temperatura</h3>
                <span className="dash-seccion-subtitulo">
                  {config
                    ? 'Las líneas punteadas marcan los umbrales mínimo y máximo de humedad configurados para este terreno.'
                    : 'Evolución reciente de los sensores de este terreno.'}
                </span>
              </div>
              <span className="en-vivo"><span className="en-vivo-punto" />En vivo</span>
            </div>
            {datosGrafico.length === 0 ? (
              <EstadoVacio
                icono={Waves}
                titulo="Todavía no hay lecturas para graficar"
                descripcion="En cuanto el dispositivo de este terreno envíe su primera lectura de humedad o temperatura, la verás aquí en tiempo real."
              />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={datosGrafico} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gHumedad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--azul)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--azul)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--ambar)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--ambar)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gris-100)" />
                  <XAxis dataKey="hora" tick={{ fontSize: 11, fill: 'var(--gris-500)' }} interval="preserveStartEnd" minTickGap={40} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--gris-500)' }} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--gris-100)', fontFamily: 'var(--fuente-texto)' }} />
                  {config && <ReferenceLine y={Number(config.umin)} stroke="var(--azul)" strokeDasharray="4 4" />}
                  {config && <ReferenceLine y={Number(config.umax)} stroke="var(--verde-500)" strokeDasharray="4 4" />}
                  <Area type="monotone" dataKey="humedad" stroke="var(--azul)" strokeWidth={2} fill="url(#gHumedad)" name="Humedad %" connectNulls />
                  <Area type="monotone" dataKey="temperatura" stroke="var(--ambar)" strokeWidth={2} fill="url(#gTemp)" name="Temp °C" connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </motion.div>
      )}
    </>
  );
}

function TarjetaMetrica({ titulo, valor, detalle, color, Icono, fondoIcono, noConectado }) {
  return (
    <div className="tarjeta tarjeta-hover dash-tarjeta-metrica">
      <div className="dash-tarjeta-header">
        <span className="dash-tarjeta-titulo">{titulo}</span>
        {Icono && (
          <span className="dash-tarjeta-icono" style={{ color, background: fondoIcono }}>
            <Icono size={18} strokeWidth={1.75} />
          </span>
        )}
      </div>
      {noConectado ? (
        <span className="badge badge-gris" style={{ fontSize: '0.95rem', padding: '0.4rem 0.9rem', marginTop: '0.6rem', width: 'fit-content' }}>
          No conectado
        </span>
      ) : (
        <span className="dash-tarjeta-valor" style={{ color }}>{valor}</span>
      )}
      {detalle && <span className="dash-tarjeta-detalle">{detalle}</span>}
    </div>
  );
}

// Anillo circular que se vacia a medida que pasan los segundos de la fase
// actual del riego (evaluando / iniciando riego / regando). Reemplaza al
// icono fijo de la tarjeta "Estado del riego" mientras hay una cuenta activa.
function AnilloCuentaRegresiva({ segundos, total, color }) {
  const radio = 15;
  const circunferencia = 2 * Math.PI * radio;
  const fraccion = total > 0 ? Math.max(0, Math.min(1, segundos / total)) : 0;
  const offset = circunferencia * (1 - fraccion);

  return (
    <svg width="38" height="38" viewBox="0 0 38 38" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="19" cy="19" r={radio} fill="none" stroke="var(--gris-100)" strokeWidth="4" />
      <circle
        cx="19" cy="19" r={radio} fill="none" stroke={color} strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circunferencia}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s linear' }}
      />
      <text
        x="19" y="19" textAnchor="middle" dominantBaseline="central"
        transform="rotate(90 19 19)" fontSize="13" fontWeight="700" fill="var(--gris-900)"
      >
        {segundos}
      </text>
    </svg>
  );
}
