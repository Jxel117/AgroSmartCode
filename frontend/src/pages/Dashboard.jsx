import { useState, useEffect, useCallback } from 'react';
import { notif } from '../utils/notif.js';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useAuth } from '../context/AuthContext.jsx';
import { useEventoSocket } from '../context/SocketContext.jsx';
import { parcelasApi, lecturasApi, riegoApi } from '../api/endpoints.js';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import { hora, fechaHora, etiquetaEstadoAfd, claseBadgeEstado } from '../utils/formato.js';
import './Dashboard.css';

const VENTANA_MAX = 80; // numero maximo de lecturas en pantalla

export default function Dashboard() {
  const { usuario } = useAuth();
  const [parcelas, setParcelas] = useState([]);
  const [parcelaId, setParcelaId] = useState('');
  const [lecturas, setLecturas] = useState([]);
  const [config, setConfig] = useState(null);
  const [afd, setAfd] = useState(null);
  const [transiciones, setTransiciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Cargar parcelas al inicio
  useEffect(() => {
    parcelasApi.listar().then(({ data }) => {
      setParcelas(data.parcelas);
      if (data.parcelas.length > 0) setParcelaId(data.parcelas[0].id_parcela);
      else setCargando(false);
    });
  }, []);

  // Cargar datos de la parcela seleccionada (con autorefresco como backup)
  useEffect(() => {
    if (!parcelaId) return;
    let activo = true;

    async function cargar() {
      try {
        const [lec, afdRes] = await Promise.all([
          lecturasApi.porParcela(parcelaId, VENTANA_MAX),
          riegoApi.afd(parcelaId),
        ]);
        if (!activo) return;
        setLecturas([...lec.data.lecturas].reverse());
        setAfd(afdRes.data.afd);
        setTransiciones(afdRes.data.transiciones);
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
    const intervalo = setInterval(cargar, 30000); // backup cada 30s
    return () => { activo = false; clearInterval(intervalo); };
  }, [parcelaId]);

  // === SUSCRIPCIONES WEBSOCKET ===

  // Lectura nueva: si es de la parcela actual, anadir al grafico en vivo
  const onLecturaNueva = useCallback((lectura) => {
    if (lectura.parcela_id !== parcelaId) return;

    setLecturas((prev) => {
      const nueva = [...prev, lectura];
      // Mantener ventana maxima recortando lo mas antiguo
      if (nueva.length > VENTANA_MAX) {
        return nueva.slice(nueva.length - VENTANA_MAX);
      }
      return nueva;
    });
  }, [parcelaId]);

  // Las alertas ya no muestran toast aqui para evitar saturar el Dashboard.
  // Solo se notifican via el contador en el sidebar.
  const onAlertaNueva = useCallback(() => {
    // Sin toast. El badge del sidebar se actualiza solo.
  }, []);

  // Transicion AFD: si es de la parcela actual, refrescar y mostrar toast
  const onTransicionAfd = useCallback((transicion) => {
    if (transicion.parcela_id !== parcelaId) return;
    // Actualizar el estado del AFD mostrado
    setAfd((prev) => prev ? { ...prev, estado_actual: transicion.estadoDestino, fecha_ultimo_cambio_estado: transicion.timestamp } : prev);
    // Insertar la transicion al inicio de la tabla
    setTransiciones((prev) => [{
      id_transicion: `live-${Date.now()}`,
      estado_origen: transicion.estadoOrigen,
      estado_destino: transicion.estadoDestino,
      causa_transicion: transicion.causa,
      timestamp_utc: transicion.timestamp,
    }, ...prev].slice(0, 50));

    // Toast con la transicion
    const origen = etiquetaEstadoAfd(transicion.estadoOrigen);
    const destino = etiquetaEstadoAfd(transicion.estadoDestino);
    if (transicion.accionActuador === 'ENCENDER') {
      notif.exito(`Riego activado: ${origen} → ${destino}`);
    } else if (transicion.accionActuador === 'APAGAR') {
      notif.info(`Riego detenido: ${origen} → ${destino}`);
    } else {
      notif.info(`${origen} → ${destino}`, { description: transicion.causa });
    }
  }, [parcelaId]);

  // Registrar las suscripciones
  useEventoSocket('lectura_nueva', onLecturaNueva);
  useEventoSocket('alerta_nueva', onAlertaNueva);
  useEventoSocket('transicion_afd', onTransicionAfd);

  // === RENDER ===

  const ultima = lecturas[lecturas.length - 1];
  const datosGrafico = lecturas.map((l) => ({
    hora: hora(l.timestamp_utc),
    humedad: l.humedad != null ? Number(l.humedad) : null,
    temperatura: l.temperatura != null ? Number(l.temperatura) : null,
  }));

  if (parcelas.length === 0 && !cargando) {
    return (
      <>
        <EncabezadoPagina titulo="Inicio" />

        {usuario?.empresaIdentificador && (
          <div style={{ background: 'var(--verde-50)', color: 'var(--verde-700)', padding: '0.6rem 1rem', borderRadius: 'var(--radio-sm)', marginBottom: '1.2rem', fontSize: '0.88rem', fontWeight: 500 }}>
            Empresa: <strong>{usuario.empresaIdentificador}</strong>
          </div>
        )}

        <div className="tarjeta" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--gris-500)' }}>No tienes parcelas asignadas todavia.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Inicio"
        descripcion="Monitoreo en tiempo real del riego automatizado en tus terrenos. Aquí ves humedad, temperatura, estado del riego y eventos recientes."
        accion={
          <select className="dash-selector" value={parcelaId} onChange={(e) => setParcelaId(e.target.value)}>
            {parcelas.map((p) => (
              <option key={p.id_parcela} value={p.id_parcela}>{p.nombre_descriptivo}</option>
            ))}
          </select>
        }
      />

      {usuario?.empresaIdentificador && (
        <div style={{ background: 'var(--verde-50)', color: 'var(--verde-700)', padding: '0.6rem 1rem', borderRadius: 'var(--radio-sm)', marginBottom: '1.2rem', fontSize: '0.88rem', fontWeight: 500 }}>
          Empresa: <strong>{usuario.empresaIdentificador}</strong>
        </div>
      )}

      {cargando ? (
        <div style={{ display: 'grid', placeItems: 'center', padding: '4rem' }}><div className="spinner" /></div>
      ) : (
        <>
          <div className="dash-tarjetas">
            <TarjetaMetrica
              titulo="Humedad del suelo"
              valor={ultima?.humedad != null ? `${ultima.humedad}%` : '—'}
              detalle={config ? `Rango ${config.umin}–${config.umax}%` : 'Sin configuracion'}
              color="var(--azul)"
            />
            <TarjetaMetrica
              titulo="Temperatura"
              valor={ultima?.temperatura != null ? `${ultima.temperatura}°C` : '—'}
              detalle={config ? `Maximo ${config.t_maximo}°C` : ''}
              color="var(--ambar)"
            />
            <div className="tarjeta dash-tarjeta-estado">
              <span className="dash-tarjeta-titulo">Estado del riego</span>
              <span className={`badge ${claseBadgeEstado(afd?.estado_actual)}`} style={{ fontSize: '0.95rem', padding: '0.4rem 0.9rem', marginTop: '0.6rem' }}>
                {etiquetaEstadoAfd(afd?.estado_actual)}
              </span>
              <span className="dash-tarjeta-detalle">
                Ultima actualizacion: {hora(afd?.fecha_ultimo_cambio_estado)}
              </span>
            </div>
            <TarjetaMetrica
              titulo="Lecturas registradas"
              valor={lecturas.length}
              detalle="en la ventana actual"
              color="var(--verde-600)"
            />
          </div>

          <div className="tarjeta dash-grafico">
            <h3 style={{ marginBottom: '1.25rem' }}>Humedad y temperatura</h3>
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
          </div>

          <div className="tarjeta dash-transiciones">
            <h3 style={{ marginBottom: '1rem' }}>Transiciones recientes del automata</h3>
            {transiciones.length === 0 ? (
              <p style={{ color: 'var(--gris-500)' }}>Sin transiciones registradas.</p>
            ) : (
              <div className="tabla-scroll">
                <table className="tabla">
                  <thead>
                    <tr><th>Fecha</th><th>Origen</th><th>Destino</th><th>Causa</th></tr>
                  </thead>
                  <tbody>
                    {transiciones.slice(0, 12).map((t) => (
                      <tr key={t.id_transicion}>
                        <td>{fechaHora(t.timestamp_utc)}</td>
                        <td><span className="badge badge-gris">{etiquetaEstadoAfd(t.estado_origen)}</span></td>
                        <td><span className={`badge ${claseBadgeEstado(t.estado_destino)}`}>{etiquetaEstadoAfd(t.estado_destino)}</span></td>
                        <td style={{ color: 'var(--gris-700)', fontSize: '0.86rem' }}>{t.causa_transicion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

function TarjetaMetrica({ titulo, valor, detalle, color }) {
  return (
    <div className="tarjeta dash-tarjeta-metrica">
      <span className="dash-tarjeta-titulo">{titulo}</span>
      <span className="dash-tarjeta-valor" style={{ color }}>{valor}</span>
      {detalle && <span className="dash-tarjeta-detalle">{detalle}</span>}
    </div>
  );
}