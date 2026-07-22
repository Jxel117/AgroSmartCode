import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Radio } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import { useEventoSocket } from '../context/SocketContext.jsx';
import { parcelasApi, riegoApi } from '../api/endpoints.js';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import EstadoVacio from '../components/EstadoVacio.jsx';
import { fechaHora, etiquetaEstadoAfd, claseBadgeEstado } from '../utils/formato.js';

// Orden natural del proceso de riego (no alfabetico): asi la barra se lee
// como una secuencia, de "en reposo" a "regando" a "fallo".
const ORDEN_ESTADOS = ['S0_MONITOREO', 'S1_EVALUACION', 'S2_RIEGO_ACTIVO', 'S3_RIEGO_DETENIDO', 'S4_FALLO'];

// Mismo significado que los badges del resto de la app: verde = riego activo,
// rojo = fallo, gris = el resto (neutral). Nunca un color por categoria random.
const COLOR_ESTADO = {
  S0_MONITOREO: 'var(--gris-500)',
  S1_EVALUACION: 'var(--gris-500)',
  S2_RIEGO_ACTIVO: 'var(--verde-500)',
  S3_RIEGO_DETENIDO: 'var(--gris-500)',
  S4_FALLO: 'var(--rojo)',
};

export default function EventosRiego() {
  const navigate = useNavigate();
  const [parcelas, setParcelas] = useState([]);
  const [parcelaId, setParcelaId] = useState('');
  const [transiciones, setTransiciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    parcelasApi.listar().then(({ data }) => {
      setParcelas(data.parcelas);
      if (data.parcelas.length > 0) setParcelaId(data.parcelas[0].id_parcela);
      else setCargando(false);
    });
  }, []);

  useEffect(() => {
    if (!parcelaId) return;
    let activo = true;
    setCargando(true);
    riegoApi.afd(parcelaId)
      .then(({ data }) => { if (activo) setTransiciones(data.transiciones); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [parcelaId]);

  const onTransicionAfd = useCallback((transicion) => {
    if (transicion.parcela_id !== parcelaId) return;
    setTransiciones((prev) => [{
      id_transicion: `live-${Date.now()}`,
      estado_origen: transicion.estadoOrigen,
      estado_destino: transicion.estadoDestino,
      causa_transicion: transicion.causa,
      timestamp_utc: transicion.timestamp,
    }, ...prev].slice(0, 100));
  }, [parcelaId]);

  useEventoSocket('transicion_afd', onTransicionAfd);

  const datosFrecuencia = useMemo(() => {
    const conteo = {};
    for (const t of transiciones) {
      conteo[t.estado_destino] = (conteo[t.estado_destino] ?? 0) + 1;
    }
    return ORDEN_ESTADOS
      .filter((estado) => conteo[estado])
      .map((estado) => ({
        estado: etiquetaEstadoAfd(estado),
        valor: conteo[estado],
        color: COLOR_ESTADO[estado] ?? 'var(--gris-500)',
      }));
  }, [transiciones]);

  return (
    <>
      <EncabezadoPagina
        titulo="Eventos registrados"
        descripcion="Historial de cambios de estado del riego automático de tus terrenos."
        accion={
          <div className="dash-header-acciones">
            {parcelas.length > 1 && (
              <select className="dash-selector" value={parcelaId} onChange={(e) => setParcelaId(e.target.value)}>
                {parcelas.map((p) => (
                  <option key={p.id_parcela} value={p.id_parcela}>{p.nombre_descriptivo}</option>
                ))}
              </select>
            )}
            <button className="btn btn-secundario" onClick={() => navigate('/')}>
              <ArrowLeft size={16} strokeWidth={2} /> Volver a Inicio
            </button>
          </div>
        }
      />

      {!cargando && datosFrecuencia.length > 0 && (
        <div className="tarjeta dash-grafico">
          <div className="dash-seccion-header">
            <div className="dash-seccion-titulo-grupo">
              <h3>Frecuencia de eventos</h3>
              <span className="dash-seccion-subtitulo">Cuántas veces cambió el riego a cada estado, en el historial mostrado abajo.</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={datosFrecuencia} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--gris-100)" />
              <XAxis dataKey="estado" tick={{ fontSize: 12, fill: 'var(--gris-500)' }} axisLine={{ stroke: 'var(--gris-100)' }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--gris-500)' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                cursor={{ fill: 'var(--gris-50)' }}
                contentStyle={{ borderRadius: 10, border: '1px solid var(--gris-100)', fontFamily: 'var(--fuente-texto)' }}
                formatter={(valor) => [valor, 'Eventos']}
              />
              <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {datosFrecuencia.map((d) => <Cell key={d.estado} fill={d.color} />)}
                <LabelList dataKey="valor" position="top" style={{ fill: 'var(--gris-700)', fontSize: 12, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="tarjeta dash-transiciones">
        <div className="dash-seccion-header">
          <div className="dash-seccion-titulo-grupo">
            <h3>Historial completo</h3>
            <span className="dash-seccion-subtitulo">Cada cambio de estado del riego automático, con su detalle.</span>
          </div>
          <span className="dash-eventos-contador">{transiciones.length} evento{transiciones.length === 1 ? '' : 's'}</span>
        </div>

        {cargando ? (
          <div style={{ display: 'grid', placeItems: 'center', minHeight: 200 }}>
            <div className="spinner" />
          </div>
        ) : transiciones.length === 0 ? (
          <EstadoVacio
            icono={Radio}
            titulo="Sin eventos por ahora"
            descripcion="Aquí aparecerán los cambios de estado del riego automático (encendido, apagado, alertas) apenas ocurran en este terreno."
          />
        ) : (
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr><th>Fecha</th><th>Evento</th><th>Detalle</th></tr>
              </thead>
              <tbody>
                {transiciones.map((t) => (
                  <tr key={t.id_transicion}>
                    <td>{fechaHora(t.timestamp_utc)}</td>
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
  );
}
