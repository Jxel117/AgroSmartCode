import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { SlidersHorizontal, Wand2, History, Settings } from 'lucide-react';
import { riegoApi, perfilesApi } from '../api/endpoints.js';
import Modal from './Modal.jsx';
import { fechaHora } from '../utils/formato.js';

export default function ModalConfiguracionRiego({ abierto, onCerrar, parcela }) {
  const [seccion, setSeccion] = useState('actual'); // actual | perfil | manual | historial
  const [configActual, setConfigActual] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [perfilSeleccionado, setPerfilSeleccionado] = useState('');
  const [formManual, setFormManual] = useState({
    umin: '', umax: '', uminCritico: '', tMaximo: '', tmin: '', nIntentosFallidosMax: 3,
  });
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierto || !parcela) return;
    recargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, parcela?.id_parcela]);

  async function recargarTodo() {
    setCargando(true);
    try {
      const [confRes, histRes, perfRes] = await Promise.all([
        riegoApi.configuracion(parcela.id_parcela).catch(() => ({ data: { configuracion: null } })),
        riegoApi.historial(parcela.id_parcela),
        perfilesApi.listar(),
      ]);
      setConfigActual(confRes.data.configuracion);
      setHistorial(histRes.data.historial ?? []);
      setPerfiles(perfRes.data.perfiles ?? []);
    } catch (err) {
      toast.error('No se pudo cargar la configuración');
    } finally {
      setCargando(false);
    }
  }

  async function aplicarPerfil(e) {
    e.preventDefault();
    if (!perfilSeleccionado) {
      toast.error('Selecciona un perfil agronómico');
      return;
    }
    setGuardando(true);
    try {
      await riegoApi.aplicarPerfil(parcela.id_parcela, perfilSeleccionado);
      toast.success('Perfil aplicado correctamente');
      setPerfilSeleccionado('');
      setSeccion('actual');
      await recargarTodo();
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'No se pudo aplicar el perfil');
    } finally {
      setGuardando(false);
    }
  }

  async function aplicarManual(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      const payload = {
        umin: Number(formManual.umin),
        umax: Number(formManual.umax),
        uminCritico: Number(formManual.uminCritico),
        tMaximo: Number(formManual.tMaximo),
        tmin: parseInt(formManual.tmin, 10),
        nIntentosFallidosMax: parseInt(formManual.nIntentosFallidosMax, 10),
      };
      await riegoApi.aplicarManual(parcela.id_parcela, payload);
      toast.success('Configuración manual aplicada');
      setFormManual({ umin: '', umax: '', uminCritico: '', tMaximo: '', tmin: '', nIntentosFallidosMax: 3 });
      setSeccion('actual');
      await recargarTodo();
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'No se pudo aplicar la configuración');
    } finally {
      setGuardando(false);
    }
  }

  if (!parcela) return null;

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={`Configuración de riego — ${parcela.nombre_descriptivo}`}
    >
      {/* Pestañas */}
      <div style={{
        display: 'flex', gap: '0.5rem', marginBottom: '1.5rem',
        borderBottom: '1px solid var(--gris-100)', paddingBottom: '0.5rem',
      }}>
        <BotonPestania activa={seccion === 'actual'} onClick={() => setSeccion('actual')} icono={Settings}>
          Actual
        </BotonPestania>
        <BotonPestania activa={seccion === 'perfil'} onClick={() => setSeccion('perfil')} icono={Wand2}>
          Aplicar perfil
        </BotonPestania>
        <BotonPestania activa={seccion === 'manual'} onClick={() => setSeccion('manual')} icono={SlidersHorizontal}>
          Manual
        </BotonPestania>
        <BotonPestania activa={seccion === 'historial'} onClick={() => setSeccion('historial')} icono={History}>
          Historial
        </BotonPestania>
      </div>

      {cargando ? (
        <p style={{ color: 'var(--gris-500)', textAlign: 'center', padding: '1rem' }}>Cargando...</p>
      ) : (
        <>
          {seccion === 'actual' && <SeccionActual config={configActual} perfiles={perfiles} />}
          {seccion === 'perfil' && (
            <SeccionPerfil
              perfiles={perfiles}
              perfilSeleccionado={perfilSeleccionado}
              setPerfilSeleccionado={setPerfilSeleccionado}
              parcela={parcela}
              onAplicar={aplicarPerfil}
              guardando={guardando}
            />
          )}
          {seccion === 'manual' && (
            <SeccionManual
              form={formManual}
              setForm={setFormManual}
              onAplicar={aplicarManual}
              guardando={guardando}
            />
          )}
          {seccion === 'historial' && <SeccionHistorial historial={historial} perfiles={perfiles} />}
        </>
      )}
    </Modal>
  );
}

// ----- Sub-componentes -----

function BotonPestania({ activa, onClick, icono: Icono, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.55rem 0.85rem',
        background: activa ? 'var(--verde-100)' : 'transparent',
        color: activa ? 'var(--verde-700)' : 'var(--gris-700)',
        borderRadius: 'var(--radio-sm)',
        fontSize: '0.85rem', fontWeight: 600,
        cursor: 'pointer',
        transition: 'all var(--transicion-rapida)',
      }}
    >
      <Icono size={15} strokeWidth={1.8} />
      {children}
    </button>
  );
}

function SeccionActual({ config, perfiles }) {
  if (!config) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--gris-500)' }}>
        <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Sin configuración de riego</p>
        <p style={{ fontSize: '0.9rem' }}>
          Esta parcela aún no tiene configuración aplicada. Aplica un perfil predeterminado o
          configura manualmente para que el sistema pueda regar automáticamente.
        </p>
      </div>
    );
  }

  const perfilUsado = perfiles.find((p) => p.id_perfil === config.perfil_id);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span className={`badge ${config.modalidad_configuracion === 'PERFIL_PREDETERMINADO' ? 'badge-verde' : 'badge-ambar'}`}>
          {config.modalidad_configuracion === 'PERFIL_PREDETERMINADO' ? 'Perfil predeterminado' : 'Manual'}
        </span>
        <span style={{ color: 'var(--gris-500)', fontSize: '0.85rem' }}>
          Aplicada el {fechaHora(config.fecha_aplicacion)}
        </span>
      </div>

      {perfilUsado && (
        <p style={{ fontSize: '0.88rem', color: 'var(--gris-700)', marginBottom: '1rem' }}>
          Basada en el perfil <strong>{perfilUsado.tipo_cultivo} / {perfilUsado.tipo_suelo}</strong>
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.6rem', marginBottom: '0.5rem' }}>
        <DatoConfig etiqueta="Humedad mín." valor={`${config.umin}%`} />
        <DatoConfig etiqueta="Humedad máx." valor={`${config.umax}%`} />
        <DatoConfig etiqueta="Crítica" valor={`${config.umin_critico}%`} resaltar />
        <DatoConfig etiqueta="Temp. máx." valor={`${config.t_maximo}°C`} />
        <DatoConfig etiqueta="Temp. mín." valor={`${config.tmin}°C`} />
        <DatoConfig etiqueta="Reintentos" valor={`${config.n_intentos_fallidos_max}`} />
      </div>
    </div>
  );
}

function SeccionPerfil({ perfiles, perfilSeleccionado, setPerfilSeleccionado, parcela, onAplicar, guardando }) {
  // Sugerir el perfil que coincide con el cultivo/suelo de la parcela
  const sugerido = perfiles.find(
    (p) => p.tipo_cultivo === parcela.tipo_cultivo && p.tipo_suelo === parcela.tipo_suelo
  );

  return (
    <form onSubmit={onAplicar}>
      <p style={{ fontSize: '0.88rem', color: 'var(--gris-700)', marginBottom: '1rem', lineHeight: 1.5 }}>
        Aplica una de las configuraciones predefinidas del catálogo agronómico. El sistema usará
        estos valores como referencia para regar automáticamente esta parcela.
      </p>

      {sugerido && (
        <div style={{ background: 'var(--verde-50)', border: '1px solid var(--verde-300)', padding: '0.75rem 1rem', borderRadius: 'var(--radio-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
          <strong style={{ color: 'var(--verde-700)' }}>Sugerencia:</strong> esta parcela es{' '}
          <strong>{parcela.tipo_cultivo}</strong> en suelo <strong>{parcela.tipo_suelo}</strong>.
          Existe un perfil que coincide.
          <button
            type="button"
            onClick={() => setPerfilSeleccionado(sugerido.id_perfil)}
            style={{ marginLeft: '0.5rem', color: 'var(--verde-700)', fontWeight: 600, textDecoration: 'underline', background: 'none' }}
          >
            Seleccionarlo
          </button>
        </div>
      )}

      <div className="campo">
        <label>Perfil agronómico</label>
        <select value={perfilSeleccionado} onChange={(e) => setPerfilSeleccionado(e.target.value)}>
          <option value="">Selecciona un perfil...</option>
          {perfiles.map((p) => (
            <option key={p.id_perfil} value={p.id_perfil}>
              {p.tipo_cultivo} / {p.tipo_suelo} (mín {p.umin_recomendado}%, máx {p.umax_recomendado}%)
            </option>
          ))}
        </select>
      </div>

      <button className="btn btn-primario" type="submit" disabled={guardando || !perfilSeleccionado} style={{ width: '100%' }}>
        {guardando ? 'Aplicando...' : 'Aplicar perfil'}
      </button>
    </form>
  );
}

function SeccionManual({ form, setForm, onAplicar, guardando }) {
  return (
    <form onSubmit={onAplicar}>
      <p style={{ fontSize: '0.88rem', color: 'var(--gris-700)', marginBottom: '1rem', lineHeight: 1.5 }}>
        Configura los umbrales manualmente. Útil cuando ningún perfil del catálogo se ajusta
        exactamente a tus necesidades.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="campo">
          <label>Humedad mínima (%)</label>
          <input type="number" step="0.1" min="0" max="100" required
            value={form.umin} onChange={(e) => setForm({ ...form, umin: e.target.value })} />
        </div>
        <div className="campo">
          <label>Humedad máxima (%)</label>
          <input type="number" step="0.1" min="0" max="100" required
            value={form.umax} onChange={(e) => setForm({ ...form, umax: e.target.value })} />
        </div>
      </div>

      <div className="campo">
        <label>Humedad crítica (%)</label>
        <input type="number" step="0.1" min="0" max="100" required
          value={form.uminCritico} onChange={(e) => setForm({ ...form, uminCritico: e.target.value })} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="campo">
          <label>Temp. máxima (°C)</label>
          <input type="number" step="0.1" required
            value={form.tMaximo} onChange={(e) => setForm({ ...form, tMaximo: e.target.value })} />
        </div>
        <div className="campo">
          <label>Temp. mínima (°C)</label>
          <input type="number" step="1" required
            value={form.tmin} onChange={(e) => setForm({ ...form, tmin: e.target.value })} />
        </div>
      </div>

      <div className="campo">
        <label>Máximo de reintentos fallidos</label>
        <input type="number" min="1" max="10"
          value={form.nIntentosFallidosMax}
          onChange={(e) => setForm({ ...form, nIntentosFallidosMax: e.target.value })} />
        <span style={{ fontSize: '0.74rem', color: 'var(--gris-500)' }}>
          Cuántas lecturas fallidas tolera el sistema antes de generar una alerta crítica.
        </span>
      </div>

      <button className="btn btn-primario" type="submit" disabled={guardando} style={{ width: '100%', marginTop: '0.5rem' }}>
        {guardando ? 'Aplicando...' : 'Aplicar configuración manual'}
      </button>
    </form>
  );
}

function SeccionHistorial({ historial }) {
  if (historial.length === 0) {
    return (
      <p style={{ color: 'var(--gris-500)', textAlign: 'center', padding: '1.5rem 0', fontSize: '0.9rem' }}>
        Aún no hay cambios de configuración para esta parcela.
      </p>
    );
  }

  return (
    <div style={{ maxHeight: 380, overflowY: 'auto' }}>
      {historial.map((h, idx) => (
        <div key={h.id_configuracion}
          style={{
            padding: '0.75rem 0',
            borderBottom: idx < historial.length - 1 ? '1px solid var(--gris-100)' : 'none',
          }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.4rem' }}>
            <span className={`badge ${h.modalidad_configuracion === 'PERFIL_PREDETERMINADO' ? 'badge-verde' : 'badge-ambar'}`}>
              {h.modalidad_configuracion === 'PERFIL_PREDETERMINADO' ? 'Perfil' : 'Manual'}
              {idx === 0 && ' · ACTIVA'}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--gris-500)' }}>
              {fechaHora(h.fecha_aplicacion)}
            </span>
          </div>
          {h.perfil_tipo_cultivo && (
            <p style={{ fontSize: '0.82rem', color: 'var(--gris-700)', marginBottom: '0.3rem' }}>
              Basada en perfil <strong>{h.perfil_tipo_cultivo} / {h.perfil_tipo_suelo}</strong>
            </p>
          )}
          <p style={{ fontSize: '0.78rem', color: 'var(--gris-500)' }}>
            Hum {h.umin}-{h.umax}% · Crítica {h.umin_critico}% · Temp {h.tmin}-{h.t_maximo}°C
          </p>
        </div>
      ))}
    </div>
  );
}

function DatoConfig({ etiqueta, valor, resaltar }) {
  return (
    <div style={{
      background: resaltar ? '#fff4e6' : 'var(--crema)',
      padding: '0.6rem 0.75rem',
      borderRadius: 'var(--radio-sm)',
      border: resaltar ? '1px solid var(--ambar)' : '1px solid transparent',
    }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--gris-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {etiqueta}
      </div>
      <div style={{ fontWeight: 700, color: resaltar ? '#8a5d12' : 'var(--verde-700)', fontSize: '1rem' }}>
        {valor}
      </div>
    </div>
  );
}