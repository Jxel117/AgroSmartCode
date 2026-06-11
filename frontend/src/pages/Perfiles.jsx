import { useState } from 'react';
import { perfilesApi } from '../api/endpoints.js';
import { useFetch } from '../hooks/useFetch.js';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import Modal from '../components/Modal.jsx';
import { claseBadgeEstado } from '../utils/formato.js';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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

export default function Perfiles() {
  const { datos, cargando, recargar } = useFetch(() => perfilesApi.listar().then((r) => r.data.perfiles));
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  function num(campo, e) {
    setForm({ ...form, [campo]: e.target.value });
  }

  function abrirNuevo() {
    setEditando(null);
    setForm(VACIO);
    setErrorForm('');
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
    setErrorForm('');
    setModal(true);
  }

  function traducirCampo(campo) {
    const traducciones = {
      tipoSuelo: 'Tipo de suelo',
      tipoCultivo: 'Tipo de cultivo',
      uminRecomendado: 'Humedad mínima',
      umaxRecomendado: 'Humedad máxima',
      uminCriticoRecomendado: 'Humedad crítica',
      tMaximoRecomendado: 'Temperatura máxima',
      tminRecomendado: 'Temperatura mínima',
      descripcionAgronomica: 'Descripción',
      fuenteReferencia: 'Fuente',
    };
    return traducciones[campo] ?? campo;
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    setErrorForm('');
    try {
      // Convertir strings a numeros antes de enviar
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
      } else {
        await perfilesApi.crear(payload);
      }
      setModal(false);
      setForm(VACIO);
      setEditando(null);
      recargar();
    } catch (err) {
      const detalles = err.response?.data?.details;
      if (Array.isArray(detalles) && detalles.length > 0) {
        const lista = detalles.map((d) => `• ${traducirCampo(d.campo)}: ${d.mensaje}`).join('\n');
        setErrorForm(lista);
      } else {
        setErrorForm(err.response?.data?.error ?? 'Error al guardar');
      }
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id) {
  toast('¿Eliminar esta configuración?', {
    description: 'Esta acción no se puede deshacer.',
    action: {
      label: 'Eliminar',
      onClick: async () => {
        try {
          await perfilesApi.eliminar(id);
          toast.success('Configuración eliminada');
          recargar();
        } catch (err) {
          toast.error(err.response?.data?.error ?? 'No se pudo eliminar');
        }
      },
    },
  });
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
                <button className="btn btn-peligro" style={{ padding: '0.4rem 0.7rem', flex: 1 }} onClick={() => eliminar(p.id_perfil)}>
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
        <form onSubmit={guardar}>
          {errorForm && (
            <div className="login-error" style={{ marginBottom: '1rem', whiteSpace: 'pre-line' }}>
              {errorForm}
            </div>
          )}

          <p style={{ fontSize: '0.86rem', color: 'var(--gris-700)', marginBottom: '1rem' }}>
            Define los umbrales agronómicos para un tipo de cultivo y suelo. El sistema usará estos valores como referencia al configurar el riego automático de los terrenos.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="campo">
              <label>Tipo de suelo</label>
              <select value={form.tipoSuelo} onChange={(e) => setForm({ ...form, tipoSuelo: e.target.value })}>
                {SUELOS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span style={{ fontSize: '0.74rem', color: 'var(--gris-500)' }}>
                Característica del terreno que afecta la retención de agua.
              </span>
            </div>
            <div className="campo">
              <label>Tipo de cultivo</label>
              <select value={form.tipoCultivo} onChange={(e) => setForm({ ...form, tipoCultivo: e.target.value })}>
                {CULTIVOS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <span style={{ fontSize: '0.74rem', color: 'var(--gris-500)' }}>
                Categoría de planta a la que aplica esta configuración.
              </span>
            </div>
          </div>

          <h4 style={{ fontSize: '0.95rem', margin: '1.2rem 0 0.6rem', color: 'var(--gris-700)' }}>Umbrales de humedad</h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="campo">
              <label>Humedad mínima (%)</label>
              <input type="number" step="0.1" min="0" max="100"
                value={form.uminRecomendado}
                onChange={(e) => num('uminRecomendado', e)}
                placeholder="Ej: 45" />
              <span style={{ fontSize: '0.74rem', color: 'var(--gris-500)' }}>
                Por debajo de este valor el sistema activa el riego.
              </span>
            </div>
            <div className="campo">
              <label>Humedad máxima (%)</label>
              <input type="number" step="0.1" min="0" max="100"
                value={form.umaxRecomendado}
                onChange={(e) => num('umaxRecomendado', e)}
                placeholder="Ej: 70" />
              <span style={{ fontSize: '0.74rem', color: 'var(--gris-500)' }}>
                Al alcanzar este valor el sistema detiene el riego.
              </span>
            </div>
          </div>

          <div className="campo">
            <label>Humedad crítica (%)</label>
            <input type="number" step="0.1" min="0" max="100"
              value={form.uminCriticoRecomendado}
              onChange={(e) => num('uminCriticoRecomendado', e)}
              placeholder="Ej: 25" />
            <span style={{ fontSize: '0.74rem', color: 'var(--gris-500)' }}>
              Nivel de emergencia agronómica. Por debajo de aquí el sistema genera una alerta crítica.
            </span>
          </div>

          <h4 style={{ fontSize: '0.95rem', margin: '1.2rem 0 0.6rem', color: 'var(--gris-700)' }}>Umbrales de temperatura</h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="campo">
              <label>Temperatura máxima (°C)</label>
              <input type="number" step="0.1" min="0" max="60"
                value={form.tMaximoRecomendado}
                onChange={(e) => num('tMaximoRecomendado', e)}
                placeholder="Ej: 35" />
              <span style={{ fontSize: '0.74rem', color: 'var(--gris-500)' }}>
                Por encima de este valor el riego se detiene aunque haya humedad baja.
              </span>
            </div>
            <div className="campo">
              <label>Temperatura mínima (°C)</label>
              <input type="number" step="0.1" min="-10" max="40"
                value={form.tminRecomendado}
                onChange={(e) => num('tminRecomendado', e)}
                placeholder="Ej: 12" />
              <span style={{ fontSize: '0.74rem', color: 'var(--gris-500)' }}>
                Temperatura mínima tolerada por el cultivo.
              </span>
            </div>
          </div>

          <h4 style={{ fontSize: '0.95rem', margin: '1.2rem 0 0.6rem', color: 'var(--gris-700)' }}>Información adicional</h4>

          <div className="campo">
            <label>Descripción</label>
            <input
              value={form.descripcionAgronomica}
              onChange={(e) => setForm({ ...form, descripcionAgronomica: e.target.value })}
              placeholder="Ej: Tomate riñón de exterior, ciclo corto, suelo arcilloso" />
            <span style={{ fontSize: '0.74rem', color: 'var(--gris-500)' }}>
              Nota libre del agrónomo sobre el cultivo, suelo o ciclo de riego.
            </span>
          </div>

          <div className="campo">
            <label>Fuente de referencia</label>
            <input
              value={form.fuenteReferencia}
              onChange={(e) => setForm({ ...form, fuenteReferencia: e.target.value })}
              placeholder="Ej: INIAP Boletín 128, Manual UNL Agronomía" />
            <span style={{ fontSize: '0.74rem', color: 'var(--gris-500)' }}>
              De dónde provienen los datos agronómicos (manual, boletín, experiencia propia).
            </span>
          </div>

          <button className="btn btn-primario" type="submit" disabled={guardando}
            style={{ width: '100%', marginTop: '1rem' }}>
            {guardando ? 'Guardando...' : (editando ? 'Actualizar configuración' : 'Crear configuración')}
          </button>
        </form>
      </Modal>
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