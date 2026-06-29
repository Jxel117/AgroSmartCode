import { useState } from 'react';
import { perfilesApi } from '../api/endpoints.js';
import { useFetch } from '../hooks/useFetch.js';
import { useValidacionForm } from '../hooks/useValidacionForm.js';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import Modal from '../components/Modal.jsx';
import Campo from '../components/Campo.jsx';
import { claseBadgeEstado } from '../utils/formato.js';
import { notif } from '../utils/notif.js';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import ModalConfirmar from '../components/ModalConfirmar.jsx';

const SUELOS = ['HUMIFERO', 'ARENOSO', 'ARCILLOSO'];
const CULTIVOS = ['HORTALIZAS', 'FRUTOS_ROJOS'];

const VACIO = {
  tipoSuelo: 'HUMIFERO',
  tipoCultivo: 'HORTALIZAS',
  uminRecomendado: '',
  umaxRecomendado: '',
  uminCriticoRecomendado: '',
  tMaximoRecomendado: '',
  tminRecomendado: '',
  descripcionAgronomica: '',
  fuenteReferencia: '',
};

// Helper para validar numero requerido con rango
const numRequerido = (etiqueta, min, max) => (v) => {
  if (v === '' || v === null || v === undefined) return `${etiqueta} es obligatoria`;
  const n = Number(v);
  if (Number.isNaN(n)) return `${etiqueta} debe ser un número`;
  if (n < min || n > max) return `${etiqueta} debe estar entre ${min} y ${max}`;
  return null;
};

const reglas = {
  uminRecomendado: numRequerido('Humedad mínima', 0, 100),
  umaxRecomendado: (v, datos) => {
    const base = numRequerido('Humedad máxima', 0, 100)(v);
    if (base) return base;
    if (Number(v) <= Number(datos.uminRecomendado)) return 'Debe ser mayor que la humedad mínima';
    return null;
  },
  uminCriticoRecomendado: (v, datos) => {
    const base = numRequerido('Humedad crítica', 0, 100)(v);
    if (base) return base;
    if (Number(v) >= Number(datos.uminRecomendado)) return 'Debe ser menor que la humedad mínima';
    return null;
  },
  tMaximoRecomendado: numRequerido('Temperatura máxima', 0, 60),
  tminRecomendado: (v, datos) => {
    const base = numRequerido('Temperatura mínima', -10, 40)(v);
    if (base) return base;
    if (Number(v) >= Number(datos.tMaximoRecomendado)) return 'Debe ser menor que la temperatura máxima';
    return null;
  },
};

export default function Perfiles() {
  const { datos, cargando, recargar } = useFetch(() => perfilesApi.listar().then((r) => r.data.perfiles));
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [modalEliminar, setModalEliminar] = useState({ abierto: false, perfil: null, cargando: false });

  const { errores, validar, limpiarError, limpiarTodos, setErroresBackend } = useValidacionForm();

  function abrirNuevo() {
    setEditando(null);
    setForm(VACIO);
    limpiarTodos();
    setModal(true);
  }

  function abrirEditar(p) {
    setEditando(p.id_perfil);
    setForm({
      tipoSuelo: p.tipo_suelo,
      tipoCultivo: p.tipo_cultivo,
      uminRecomendado: p.umin_recomendado,
      umaxRecomendado: p.umax_recomendado,
      uminCriticoRecomendado: p.umin_critico_recomendado,
      tMaximoRecomendado: p.t_maximo_recomendado,
      tminRecomendado: p.tmin_recomendado,
      descripcionAgronomica: p.descripcion_agronomica ?? '',
      fuenteReferencia: p.fuente_referencia ?? '',
    });
    limpiarTodos();
    setModal(true);
  }

  function setCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) limpiarError(campo);
  }

  async function guardar(e) {
    e.preventDefault();
    if (!validar(form, reglas)) return;

    setGuardando(true);
    try {
      const payload = {
        ...form,
        uminRecomendado: Number(form.uminRecomendado),
        umaxRecomendado: Number(form.umaxRecomendado),
        uminCriticoRecomendado: Number(form.uminCriticoRecomendado),
        tMaximoRecomendado: Number(form.tMaximoRecomendado),
        tminRecomendado: Number(form.tminRecomendado),
      };

      if (editando) {
        await perfilesApi.actualizar(editando, payload);
        notif.exito('Configuración actualizada correctamente');
      } else {
        await perfilesApi.crear(payload);
        notif.exito('Configuración creada correctamente');
      }
      setModal(false);
      setForm(VACIO);
      setEditando(null);
      recargar();
    } catch (err) {
      const detalles = err.response?.data?.details;
      if (Array.isArray(detalles) && detalles.length > 0) {
        setErroresBackend(detalles);
        notif.formulario.error('Revisa los campos marcados');
      } else {
        notif.error(err.response?.data?.error ?? 'No se pudo guardar la configuración');
      }
    } finally {
      setGuardando(false);
    }
  }

  function eliminar(p) {
    setModalEliminar({ abierto: true, perfil: p, cargando: false });
  }

  async function confirmarEliminar() {
    const p = modalEliminar.perfil;
    if (!p) return;
    setModalEliminar((prev) => ({ ...prev, cargando: true }));
    try {
      await perfilesApi.eliminar(p.id_perfil);
      notif.exito('Configuración eliminada');
      setModalEliminar({ abierto: false, perfil: null, cargando: false });
      recargar();
    } catch (err) {
      notif.error(err.response?.data?.error ?? 'No se pudo eliminar la configuración');
      setModalEliminar((prev) => ({ ...prev, cargando: false }));
    }
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Configuraciones por Cultivo"
        descripcion="Plantillas de riego según el tipo de cultivo. Aquí defines los umbrales de humedad y temperatura que el sistema usará para activar o detener el riego automáticamente."
        accion={
          <button className="btn btn-primario" onClick={abrirNuevo}>
            <Plus size={16} strokeWidth={2} />
            Nueva configuración
          </button>
        }
      />

      {cargando ? <div className="spinner" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {datos?.map((p) => (
            <div key={p.id_perfil} className="tarjeta" style={{ padding: '1.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem' }}>{p.tipo_cultivo}</h3>
                  <span style={{ fontSize: '0.84rem', color: 'var(--gris-500)' }}>Suelo {p.tipo_suelo}</span>
                </div>
                <span className={`badge ${claseBadgeEstado(p.estado)}`}>{p.estado}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', margin: '1rem 0' }}>
                <Dato etiqueta="Humedad min" valor={`${p.umin_recomendado}%`} />
                <Dato etiqueta="Humedad max" valor={`${p.umax_recomendado}%`} />
                <Dato etiqueta="Critico" valor={`${p.umin_critico_recomendado}%`} />
                <Dato etiqueta="Temp max" valor={`${p.t_maximo_recomendado}°C`} />
              </div>
              {p.descripcion_agronomica && (
                <p style={{ fontSize: '0.84rem', color: 'var(--gris-700)', marginBottom: '0.5rem' }}>
                  {p.descripcion_agronomica}
                </p>
              )}
              {p.fuente_referencia && (
                <p style={{ fontSize: '0.75rem', color: 'var(--gris-500)', marginBottom: '0.75rem' }}>
                  Fuente: {p.fuente_referencia}
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secundario" style={{ padding: '0.4rem 0.7rem', flex: 1 }} onClick={() => abrirEditar(p)}>
                  <Pencil size={14} strokeWidth={1.8} />
                  Editar
                </button>
                <button className="btn btn-peligro" style={{ padding: '0.4rem 0.7rem', flex: 1 }} onClick={() => eliminar(p)}>
                  <Trash2 size={14} strokeWidth={1.8} />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          {datos?.length === 0 && (
            <p style={{ color: 'var(--gris-500)', gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
              Aún no has creado configuraciones. Pulsa "+ Nueva configuración" para empezar.
            </p>
          )}
        </div>
      )}

      <Modal
        abierto={modal}
        onCerrar={() => setModal(false)}
        titulo={editando ? 'Editar configuración' : 'Nueva configuración'}
      >
        <form onSubmit={guardar} noValidate>
          <p style={{ fontSize: '0.86rem', color: 'var(--gris-700)', marginBottom: '1rem' }}>
            Define los umbrales agronómicos para un tipo de cultivo y suelo. El sistema usará estos valores como referencia al configurar el riego automático de los terrenos.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <Campo label="Tipo de suelo" id="tipoSuelo" ayuda="Característica del terreno que afecta la retención de agua.">
              <select id="tipoSuelo" value={form.tipoSuelo} onChange={(e) => setCampo('tipoSuelo', e.target.value)}>
                {SUELOS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Campo>
            <Campo label="Tipo de cultivo" id="tipoCultivo" ayuda="Categoría de planta a la que aplica esta configuración.">
              <select id="tipoCultivo" value={form.tipoCultivo} onChange={(e) => setCampo('tipoCultivo', e.target.value)}>
                {CULTIVOS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Campo>
          </div>

          <h4 style={{ fontSize: '0.95rem', margin: '1.2rem 0 0.6rem', color: 'var(--gris-700)' }}>Umbrales de humedad</h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <Campo
              label="Humedad mínima (%)"
              id="uminRecomendado"
              obligatorio
              error={errores.uminRecomendado}
              ayuda="Por debajo de este valor el sistema activa el riego."
            >
              <input
                id="uminRecomendado"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={form.uminRecomendado}
                onChange={(e) => setCampo('uminRecomendado', e.target.value)}
                placeholder="Ej: 45"
              />
            </Campo>
            <Campo
              label="Humedad máxima (%)"
              id="umaxRecomendado"
              obligatorio
              error={errores.umaxRecomendado}
              ayuda="Al alcanzar este valor el sistema detiene el riego."
            >
              <input
                id="umaxRecomendado"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={form.umaxRecomendado}
                onChange={(e) => setCampo('umaxRecomendado', e.target.value)}
                placeholder="Ej: 70"
              />
            </Campo>
          </div>

          <Campo
            label="Humedad crítica (%)"
            id="uminCriticoRecomendado"
            obligatorio
            error={errores.uminCriticoRecomendado}
            ayuda="Nivel de emergencia agronómica. Por debajo de aquí el sistema genera una alerta crítica."
          >
            <input
              id="uminCriticoRecomendado"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={form.uminCriticoRecomendado}
              onChange={(e) => setCampo('uminCriticoRecomendado', e.target.value)}
              placeholder="Ej: 25"
            />
          </Campo>

          <h4 style={{ fontSize: '0.95rem', margin: '1.2rem 0 0.6rem', color: 'var(--gris-700)' }}>Umbrales de temperatura</h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <Campo
              label="Temperatura máxima (°C)"
              id="tMaximoRecomendado"
              obligatorio
              error={errores.tMaximoRecomendado}
              ayuda="Por encima de este valor el riego se detiene aunque haya humedad baja."
            >
              <input
                id="tMaximoRecomendado"
                type="number"
                step="0.1"
                min="0"
                max="60"
                value={form.tMaximoRecomendado}
                onChange={(e) => setCampo('tMaximoRecomendado', e.target.value)}
                placeholder="Ej: 35"
              />
            </Campo>
            <Campo
              label="Temperatura mínima (°C)"
              id="tminRecomendado"
              obligatorio
              error={errores.tminRecomendado}
              ayuda="Temperatura mínima tolerada por el cultivo."
            >
              <input
                id="tminRecomendado"
                type="number"
                step="0.1"
                min="-10"
                max="40"
                value={form.tminRecomendado}
                onChange={(e) => setCampo('tminRecomendado', e.target.value)}
                placeholder="Ej: 12"
              />
            </Campo>
          </div>

          <h4 style={{ fontSize: '0.95rem', margin: '1.2rem 0 0.6rem', color: 'var(--gris-700)' }}>Información adicional</h4>

          <Campo
            label="Descripción"
            id="descripcionAgronomica"
            ayuda="Nota libre del agrónomo sobre el cultivo, suelo o ciclo de riego."
          >
            <input
              id="descripcionAgronomica"
              value={form.descripcionAgronomica}
              onChange={(e) => setCampo('descripcionAgronomica', e.target.value)}
              placeholder="Ej: Tomate riñón de exterior, ciclo corto, suelo arcilloso"
            />
          </Campo>

          <Campo
            label="Fuente de referencia"
            id="fuenteReferencia"
            ayuda="De dónde provienen los datos agronómicos (manual, boletín, experiencia propia)."
          >
            <input
              id="fuenteReferencia"
              value={form.fuenteReferencia}
              onChange={(e) => setCampo('fuenteReferencia', e.target.value)}
              placeholder="Ej: INIAP Boletín 128, Manual UNL Agronomía"
            />
          </Campo>

          <button className="btn btn-primario" type="submit" disabled={guardando} style={{ width: '100%', marginTop: '1rem' }}>
            {guardando ? 'Guardando...' : (editando ? 'Actualizar configuración' : 'Crear configuración')}
          </button>
        </form>
      </Modal>
      <ModalConfirmar
        abierto={modalEliminar.abierto}
        onCerrar={() => setModalEliminar({ abierto: false, perfil: null, cargando: false })}
        onConfirmar={confirmarEliminar}
        titulo={`¿Eliminar configuración ${modalEliminar.perfil?.tipo_cultivo ?? ''} / ${modalEliminar.perfil?.tipo_suelo ?? ''}?`}
        descripcion="Esta acción no se puede deshacer."
        cargando={modalEliminar.cargando}
      />
    </>
  );
}

function Dato({ etiqueta, valor }) {
  return (
    <div style={{ background: 'var(--crema)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radio-sm)' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--gris-500)', fontWeight: 600 }}>{etiqueta}</div>
      <div style={{ fontWeight: 600, color: 'var(--verde-700)' }}>{valor}</div>
    </div>
  );
}