import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { notif } from '../utils/notif.js';
import { CheckCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { alertasApi } from '../api/endpoints.js';
import { useFetch } from '../hooks/useFetch.js';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import { fechaHora, claseBadgeEstado, etiquetaDia, claveDia, etiquetaMes, claveMes } from '../utils/formato.js';

const FILTROS = [
  { valor: '', label: 'Todas' },
  { valor: 'ACTIVA', label: 'Activas' },
  { valor: 'LEIDA', label: 'Leídas' },
  { valor: 'RESUELTA', label: 'Resueltas' },
];

const PERIODOS = [
  { valor: 'dia', label: 'Por día' },
  { valor: '7dias', label: 'Últimos 7 días' },
  { valor: 'mes', label: 'Por mes' },
];

const AYUDA_ESTADOS = 'Activas: recién generadas, sin revisar · Leídas: ya las viste, pendientes de resolver · Resueltas: el problema ya se solucionó';

const POR_PAGINA = 10;

// Construye la lista de botones de pagina, colapsando con "..." cuando hay muchas paginas
function construirPaginas(total, actual) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const claves = new Set([1, 2, total - 1, total, actual - 1, actual, actual + 1]);
  const ordenadas = [...claves].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const resultado = [];
  let anterior = 0;
  for (const n of ordenadas) {
    if (n - anterior > 1) resultado.push('…');
    resultado.push(n);
    anterior = n;
  }
  return resultado;
}

export default function Alertas() {
  const [filtro, setFiltro] = useState('');
  const [periodo, setPeriodo] = useState('dia');
  const [pagina, setPagina] = useState(1);
  const [ahora] = useState(Date.now);
  const { refrescarContadorAlertas } = useOutletContext();
  const { datos, cargando, recargar } = useFetch(
    () => alertasApi.listar(filtro || undefined).then((r) => r.data.alertas),
    [filtro]
  );

  function cambiarFiltro(valor) {
    setFiltro(valor);
    setPagina(1);
  }

  function cambiarPeriodo(valor) {
    setPeriodo(valor);
    setPagina(1);
  }

  // "Ultimos 7 dias" ademas filtra; "por dia" y "por mes" solo cambian el agrupado
  const datosPeriodo = useMemo(() => {
    if (!datos) return [];
    if (periodo !== '7dias') return datos;
    const limite = ahora - 7 * 24 * 60 * 60 * 1000;
    return datos.filter((a) => new Date(a.fecha_generacion).getTime() >= limite);
  }, [datos, periodo, ahora]);

  const totalPaginas = Math.max(1, Math.ceil(datosPeriodo.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const datosPagina = datosPeriodo.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  // Agrupa las alertas de la pagina actual por dia o por mes, en el orden en que llegan (mas recientes primero)
  const grupos = useMemo(() => {
    const obtenerClave = periodo === 'mes' ? claveMes : claveDia;
    const obtenerEtiqueta = periodo === 'mes' ? etiquetaMes : etiquetaDia;
    const mapa = new Map();
    for (const a of datosPagina) {
      const clave = obtenerClave(a.fecha_generacion);
      if (!mapa.has(clave)) mapa.set(clave, { etiqueta: obtenerEtiqueta(a.fecha_generacion), alertas: [] });
      mapa.get(clave).alertas.push(a);
    }
    return [...mapa.values()];
  }, [datosPagina, periodo]);

  async function leida(id) {
    try {
      await alertasApi.marcarLeida(id);
      notif.exito('Alerta marcada como leída');
      recargar();
      refrescarContadorAlertas();
    } catch (err) {
      notif.error(err.response?.data?.error ?? 'No se pudo marcar la alerta como leída');
    }
  }

  async function resuelta(id) {
    try {
      await alertasApi.marcarResuelta(id);
      notif.exito('Alerta marcada como resuelta');
      recargar();
      refrescarContadorAlertas();
    } catch (err) {
      notif.error(err.response?.data?.error ?? 'No se pudo marcar la alerta como resuelta');
    }
  }

  async function marcarTodas() {
    try {
      const { data } = await alertasApi.marcarTodasLeidas();
      if (data.marcadas === 0) {
        notif.info('No había alertas activas');
      } else {
        notif.exito(`${data.marcadas} alerta(s) marcada(s) como leída(s)`);
      }
      recargar();
      refrescarContadorAlertas();
    } catch (err) {
      notif.error(err.response?.data?.error ?? 'No se pudo marcar como leídas');
    }
  }

  // Cuantas hay activas en la vista actual (para mostrar el boton solo cuando aplica)
  const hayActivas = datos?.some((a) => a.estado === 'ACTIVA');

  return (
    <>
      <EncabezadoPagina
        titulo="Alertas"
        descripcion="Eventos críticos detectados por el sistema (humedad crítica, temperatura excesiva, fallos de sensores) que requieren tu atención."
        accion={hayActivas && (
          <button className="btn btn-secundario" onClick={marcarTodas}>
            <CheckCheck size={16} strokeWidth={2} />
            Marcar todas como leídas
          </button>
        )}
      />

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        {FILTROS.map((f) => (
          <button key={f.valor}
            className={`btn ${filtro === f.valor ? 'btn-primario' : 'btn-secundario'}`}
            onClick={() => cambiarFiltro(f.valor)}>
            {f.label}
          </button>
        ))}
      </div>
      <p style={{ fontSize: '0.78rem', color: 'var(--gris-500)', marginBottom: '0.75rem' }}>
        {AYUDA_ESTADOS}
      </p>

      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {PERIODOS.map((p) => (
          <button key={p.valor}
            className={`btn ${periodo === p.valor ? 'btn-primario' : 'btn-secundario'}`}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
            onClick={() => cambiarPeriodo(p.valor)}>
            {p.label}
          </button>
        ))}
      </div>

      {cargando ? <div className="spinner" /> : (
        <>
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {datosPeriodo.length === 0 && (
              <div className="tarjeta" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--gris-500)' }}>
                No hay alertas en esta categoria.
              </div>
            )}
            {grupos.map((g) => (
              <div key={g.etiqueta} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--gris-500)' }}>
                  {g.etiqueta}
                </h4>
                {g.alertas.map((a) => (
                  <div key={a.id_alerta} className="tarjeta tarjeta-hover" style={{ padding: '1.1rem 1.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span className={`badge ${claseBadgeEstado(a.severidad)}`}>{a.severidad}</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{a.mensaje}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gris-500)' }}>{a.tipo_alerta} · {fechaHora(a.fecha_generacion)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span className={`badge ${claseBadgeEstado(a.estado)}`}>{a.estado}</span>
                      {a.estado === 'ACTIVA' && (
                        <button className="btn btn-secundario" style={{ padding: '0.4rem 0.7rem' }} onClick={() => leida(a.id_alerta)}>
                          Marcar leida
                        </button>
                      )}
                      {a.estado !== 'RESUELTA' && (
                        <button className="btn btn-primario" style={{ padding: '0.4rem 0.7rem' }} onClick={() => resuelta(a.id_alerta)}>
                          Resolver
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {totalPaginas > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem', marginTop: '1.75rem' }}>
              <button
                className="btn-icono"
                disabled={paginaActual === 1}
                title="Página anterior"
                onClick={() => setPagina(paginaActual - 1)}
              >
                <ChevronLeft size={16} strokeWidth={1.8} />
              </button>
              {construirPaginas(totalPaginas, paginaActual).map((n, i) => (
                n === '…' ? (
                  <span key={`e${i}`} style={{ padding: '0 0.3rem', color: 'var(--gris-500)' }}>…</span>
                ) : (
                  <button key={n}
                    className={`btn ${n === paginaActual ? 'btn-primario' : 'btn-secundario'}`}
                    style={{ padding: '0.4rem 0.75rem', minWidth: '2.3rem' }}
                    onClick={() => setPagina(n)}>
                    {n}
                  </button>
                )
              ))}
              <button
                className="btn-icono"
                disabled={paginaActual === totalPaginas}
                title="Página siguiente"
                onClick={() => setPagina(paginaActual + 1)}
              >
                <ChevronRight size={16} strokeWidth={1.8} />
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}