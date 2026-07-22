import { useState } from 'react';
import { parcelasApi } from '../api/endpoints.js';
import { useFetch } from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useValidacionForm } from '../hooks/useValidacionForm.js';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import Modal from '../components/Modal.jsx';
import Campo from '../components/Campo.jsx';
import { claseBadgeEstado } from '../utils/formato.js';
import ModalAgricultores from '../components/ModalAgricultores.jsx';
import ModalConfiguracionRiego from '../components/ModalConfiguracionRiego.jsx';
import { notif } from '../utils/notif.js';
import { Plus, Pencil, Trash2, Users as UsersIcon, SlidersHorizontal } from 'lucide-react';
import ModalConfirmar from '../components/ModalConfirmar.jsx';

const SUELOS = ['HUMIFERO', 'ARENOSO', 'ARCILLOSO'];
const CULTIVOS = ['HORTALIZAS', 'FRUTOS_ROJOS'];

const VACIO = {
  nombreDescriptivo: '',
  tipoSuelo: 'HUMIFERO',
  tipoCultivo: 'HORTALIZAS',
  ubicacionDescriptiva: '',
  estado: 'ACTIVA',
};

const reglas = {
  nombreDescriptivo: (v) => !v?.trim() ? 'El nombre es obligatorio'
    : v.trim().length < 2 ? 'Mínimo 2 caracteres' : null,
};

export default function Parcelas() {
  const { esAdmin } = useAuth();
  const { datos, cargando, error, recargar } = useFetch(() => parcelasApi.listar().then((r) => r.data.parcelas));
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [modalEliminar, setModalEliminar] = useState({ abierto: false, parcela: null, cargando: false });

  const { errores, validar, limpiarError, limpiarTodos, setErroresBackend } = useValidacionForm();

  const [modalAgric, setModalAgric] = useState(false);
  const [parcelaAgric, setParcelaAgric] = useState(null);
  const [modalConfig, setModalConfig] = useState(false);
  const [parcelaConfig, setParcelaConfig] = useState(null);

  function abrirNuevo() {
    setEditando(null);
    const numeros = (datos ?? [])
      .map((p) => {
        const match = /^Terreno (\d+)$/.exec(p.nombre_descriptivo);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => n > 0);
    const siguiente = numeros.length > 0 ? Math.max(...numeros) + 1 : 1;
    setForm({ ...VACIO, nombreDescriptivo: `Terreno ${siguiente}` });
    limpiarTodos();
    setModal(true);
  }

  function abrirConfiguracion(parcela) {
    setParcelaConfig(parcela);
    setModalConfig(true);
  }

  function abrirEditar(p) {
    setEditando(p.id_parcela);
    setForm({
      nombreDescriptivo: p.nombre_descriptivo,
      tipoSuelo: p.tipo_suelo,
      tipoCultivo: p.tipo_cultivo,
      ubicacionDescriptiva: p.ubicacion_descriptiva ?? '',
      estado: p.estado,
    });
    limpiarTodos();
    setModal(true);
  }

  function abrirAgricultores(p) {
    setParcelaAgric(p);
    setModalAgric(true);
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
      if (editando) {
        await parcelasApi.actualizar(editando, form);
        notif.exito('Terreno actualizado correctamente');
      } else {
        await parcelasApi.crear(form);
        notif.exito('Terreno creado correctamente');
      }
      setModal(false);
      recargar();
    } catch (err) {
      const detalles = err.response?.data?.details;
      if (Array.isArray(detalles) && detalles.length > 0) {
        setErroresBackend(detalles);
        notif.formulario.error('Revisa los campos marcados');
      } else {
        notif.error(err.response?.data?.error ?? 'No se pudo guardar el terreno');
      }
    } finally {
      setGuardando(false);
    }
  }

  function eliminar(p) {
    setModalEliminar({ abierto: true, parcela: p, cargando: false });
  }

  async function confirmarEliminar() {
    const p = modalEliminar.parcela;
    if (!p) return;
    setModalEliminar((prev) => ({ ...prev, cargando: true }));
    try {
      await parcelasApi.eliminar(p.id_parcela);
      notif.exito('Terreno eliminado');
      setModalEliminar({ abierto: false, parcela: null, cargando: false });
      recargar();
    } catch (err) {
      notif.error(err.response?.data?.error ?? 'No se pudo eliminar el terreno');
      setModalEliminar((prev) => ({ ...prev, cargando: false }));
    }
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Terrenos"
        descripcion="Áreas físicas de cultivo donde se instalan los dispositivos. Cada terreno tiene su propia configuración de riego y agricultores asignados."
        accion={esAdmin && (
          <button className="btn btn-primario" onClick={abrirNuevo}>
            <Plus size={16} strokeWidth={2} />
            Nuevo terreno
          </button>
        )}
      />

      {cargando ? <div className="spinner" /> : error ? <p style={{ color: 'var(--rojo)' }}>{error}</p> : (
        <div className="tarjeta fade-in" style={{ padding: '0.5rem 1.5rem 1rem' }}>
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Suelo</th>
                  <th>Cultivo</th>
                  <th>Ubicación</th>
                  <th>Estado</th>
                  {esAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {datos.map((p) => (
                  <tr key={p.id_parcela}>
                    <td style={{ fontWeight: 600 }}>{p.nombre_descriptivo}</td>
                    <td>{p.tipo_suelo}</td>
                    <td>{p.tipo_cultivo}</td>
                    <td style={{ color: 'var(--gris-500)' }}>{p.ubicacion_descriptiva ?? '—'}</td>
                    <td><span className={`badge ${claseBadgeEstado(p.estado)}`}>{p.estado}</span></td>
                    {esAdmin && (
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button className="btn-icono" title="Editar" onClick={() => abrirEditar(p)}>
                          <Pencil size={16} strokeWidth={1.8} />
                        </button>
                        <button className="btn-icono" title="Configuración de riego" onClick={() => abrirConfiguracion(p)}>
                          <SlidersHorizontal size={16} strokeWidth={1.8} />
                        </button>
                        <button className="btn-icono" title="Ver agricultores asignados" onClick={() => abrirAgricultores(p)}>
                          <UsersIcon size={16} strokeWidth={1.8} />
                        </button>
                        <button className="btn-icono btn-icono-peligro" title="Eliminar" onClick={() => eliminar(p)}>
                          <Trash2 size={16} strokeWidth={1.8} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {datos.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--gris-500)', padding: '2rem' }}>
                      No hay terrenos. Pulsa "+ Nuevo terreno" para empezar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal abierto={modal} onCerrar={() => setModal(false)} titulo={editando ? 'Editar terreno' : 'Nuevo terreno'}>
        <form onSubmit={guardar} noValidate>
          <Campo
            label="Nombre descriptivo"
            id="nombreDescriptivo"
            obligatorio
            error={errores.nombreDescriptivo}
            ayuda="Nombre amigable para identificar el terreno. Se sugiere uno automático, pero puedes cambiarlo."
          >
            <input
              id="nombreDescriptivo"
              value={form.nombreDescriptivo}
              onChange={(e) => setCampo('nombreDescriptivo', e.target.value)}
            />
          </Campo>

          <Campo label="Tipo de suelo" id="tipoSuelo" ayuda="Tipo de tierra del terreno; afecta a la retención de agua.">
            <select
              id="tipoSuelo"
              value={form.tipoSuelo}
              onChange={(e) => setCampo('tipoSuelo', e.target.value)}
            >
              {SUELOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Campo>

          <Campo label="Tipo de cultivo" id="tipoCultivo" ayuda="Cultivo principal sembrado en este terreno.">
            <select
              id="tipoCultivo"
              value={form.tipoCultivo}
              onChange={(e) => setCampo('tipoCultivo', e.target.value)}
            >
              {CULTIVOS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Campo>

          <Campo
            label="Ubicación"
            id="ubicacionDescriptiva"
            ayuda="Descripción textual de dónde se encuentra el terreno."
          >
            <input
              id="ubicacionDescriptiva"
              value={form.ubicacionDescriptiva}
              onChange={(e) => setCampo('ubicacionDescriptiva', e.target.value)}
              placeholder="Ej: Sector Norte, parte alta del lote"
            />
          </Campo>

          {editando && (
            <Campo label="Estado" id="estado">
              <select
                id="estado"
                value={form.estado}
                onChange={(e) => setCampo('estado', e.target.value)}
              >
                <option value="ACTIVA">ACTIVA</option>
                <option value="INACTIVA">INACTIVA</option>
              </select>
            </Campo>
          )}

          <button className="btn btn-primario" type="submit" disabled={guardando} style={{ width: '100%', marginTop: '0.5rem' }}>
            {guardando ? 'Guardando...' : (editando ? 'Actualizar terreno' : 'Crear terreno')}
          </button>
        </form>
      </Modal>

      <ModalAgricultores
        parcela={parcelaAgric}
        abierto={modalAgric}
        onCerrar={() => setModalAgric(false)}
      />

      <ModalConfiguracionRiego
        abierto={modalConfig}
        onCerrar={() => setModalConfig(false)}
        parcela={parcelaConfig}
      />
      <ModalConfirmar
        abierto={modalEliminar.abierto}
        onCerrar={() => setModalEliminar({ abierto: false, parcela: null, cargando: false })}
        onConfirmar={confirmarEliminar}
        titulo={`¿Eliminar "${modalEliminar.parcela?.nombre_descriptivo ?? ''}"?`}
        descripcion="Se borrarán sus dispositivos y lecturas. Esta acción no se puede deshacer."
        cargando={modalEliminar.cargando}
      />
    </>
  );
}