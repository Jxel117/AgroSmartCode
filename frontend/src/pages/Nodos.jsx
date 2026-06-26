import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Power, PowerOff, Cpu, AlertTriangle } from 'lucide-react';
import { nodosApi, parcelasApi } from '../api/endpoints.js';
import { useFetch } from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import Modal from '../components/Modal.jsx';
import EstadoVacio from '../components/EstadoVacio.jsx';
import { SkeletonFilaTabla } from '../components/Skeleton.jsx';
import { fechaHora, claseBadgeEstado } from '../utils/formato.js';
import { riegoApi } from '../api/endpoints.js';
import ModalConfirmar from '../components/ModalConfirmar.jsx';

const FORM_VACIO = {
  parcelaId: '',
  ubicacionDescriptiva: '',
  latitud: '',
  longitud: '',
};

export default function Nodos() {
  const { esAdmin } = useAuth();
  const { datos: nodos, cargando, recargar } = useFetch(() => nodosApi.listar().then((r) => r.data.nodos));
  const { datos: parcelas } = useFetch(() => parcelasApi.listar().then((r) => r.data.parcelas));
  const { datos: configuraciones } = useFetch(() => riegoApi.listarConfiguraciones().then((r) => r.data.configuraciones));

  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [credenciales, setCredenciales] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [modalEliminar, setModalEliminar] = useState({ abierto: false, nodo: null, cargando: false });

  function abrirNuevo() {
    setEditando(null);
    setForm(FORM_VACIO);
    setCredenciales(null);
    setModal(true);
  }

  function abrirEditar(n) {
    setEditando(n.id_nodo);
    setForm({
      parcelaId: n.parcela_id ?? '',
      ubicacionDescriptiva: n.ubicacion_descriptiva ?? '',
      latitud: n.latitud ?? '',
      longitud: n.longitud ?? '',
    });
    setCredenciales(null);
    setModal(true);
  }

  function cerrar() {
    setModal(false);
    setCredenciales(null);
    setEditando(null);
    setForm(FORM_VACIO);
  }

  function payloadDesdeForm() {
    return {
      parcelaId: form.parcelaId || null,
      ubicacionDescriptiva: form.ubicacionDescriptiva || null,
      latitud: form.latitud === '' ? null : Number(form.latitud),
      longitud: form.longitud === '' ? null : Number(form.longitud),
    };
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editando) {
        await nodosApi.actualizar(editando, payloadDesdeForm());
        toast.success('Dispositivo actualizado');
        cerrar();
        recargar();
      } else {
        const { data } = await nodosApi.crear(payloadDesdeForm());
        setCredenciales(data.credenciales);
        recargar();
      }
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'No se pudo guardar el dispositivo');
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(n, nuevoEstado) {
    try {
      await nodosApi.cambiarEstado(n.id_nodo, nuevoEstado);
      toast.success(`Dispositivo ${nuevoEstado === 'ACTIVO' ? 'activado' : 'suspendido'}`);
      recargar();
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'No se pudo cambiar el estado');
    }
  }

  function eliminar(n) {
    setModalEliminar({ abierto: true, nodo: n, cargando: false });
  }

  async function confirmarEliminar() {
    const n = modalEliminar.nodo;
    if (!n) return;
    setModalEliminar((prev) => ({ ...prev, cargando: true }));
    try {
      await nodosApi.eliminar(n.id_nodo);
      toast.success('Dispositivo eliminado');
      setModalEliminar({ abierto: false, nodo: null, cargando: false });
      recargar();
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'No se pudo eliminar');
      setModalEliminar((prev) => ({ ...prev, cargando: false }));
    }
  }

  // Mapea id de parcela a su nombre descriptivo
  function nombreParcela(idParcela) {
    if (!idParcela) return '—';
    const p = parcelas?.find((x) => x.id_parcela === idParcela);
    return p?.nombre_descriptivo ?? '—';
  }

  function configuracionDeParcela(idParcela) {
    if (!idParcela) return null;
    return configuraciones?.find((c) => c.parcela_id === idParcela) ?? null;
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Dispositivos"
        descripcion="Dispositivos físicos instalados en los terrenos que miden humedad y temperatura, y envían las lecturas al sistema vía MQTT."
        accion={esAdmin && (
          <button className="btn btn-primario" onClick={abrirNuevo}>
            <Plus size={16} strokeWidth={2} />
            Registrar dispositivo
          </button>
        )}
      />

      <div className="tarjeta" style={{ padding: '0.5rem 1.5rem 1rem' }}>
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                <th>Terreno asignado</th>
                <th>Configuración de riego</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th>Última lectura</th>
                {esAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonFilaTabla key={i} columnas={esAdmin ? 6 : 5} />
                ))
              ) : nodos?.length === 0 ? (
                <tr>
                  <td colSpan={esAdmin ? 6 : 5} style={{ padding: 0 }}>
                    <EstadoVacio
                      icono={Cpu}
                      titulo="Aún no tienes dispositivos registrados"
                      descripcion="Registra tu primer dispositivo para empezar a recibir lecturas de humedad y temperatura."
                      accion={esAdmin && (
                        <button className="btn btn-primario" onClick={abrirNuevo}>
                          <Plus size={16} strokeWidth={2} />
                          Registrar primer dispositivo
                        </button>
                      )}
                    />
                  </td>
                </tr>
              ) : (
                nodos.map((n) => {
                  const config = configuracionDeParcela(n.parcela_id);

                  return (
                    <tr key={n.id_nodo}>
                      <td style={{ fontWeight: 600 }}>
                        {nombreParcela(n.parcela_id)}
                      </td>

                      <td>
                        <CeldaConfiguracion
                          config={config}
                          parcelaAsignada={!!n.parcela_id}
                        />
                      </td>

                      <td style={{ color: 'var(--gris-700)', fontSize: '0.88rem' }}>
                        {n.ubicacion_descriptiva ?? '—'}
                      </td>

                      <td>
                        <span className={`badge ${claseBadgeEstado(n.estado)}`}>
                          {n.estado}
                        </span>
                      </td>

                      <td style={{ color: 'var(--gris-500)', fontSize: '0.85rem' }}>
                        {fechaHora(n.fecha_ultima_lectura)}
                      </td>

                      {esAdmin && (
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            className="btn-icono"
                            title="Editar"
                            onClick={() => abrirEditar(n)}
                          >
                            <Pencil size={16} strokeWidth={1.8} />
                          </button>

                          {n.estado === 'ACTIVO' ? (
                            <button
                              className="btn-icono"
                              title="Suspender"
                              onClick={() => cambiarEstado(n, 'INACTIVO')}
                            >
                              <PowerOff size={16} strokeWidth={1.8} />
                            </button>
                          ) : n.estado !== 'FALLO' && (
                            <button
                              className="btn-icono"
                              title="Activar"
                              onClick={() => cambiarEstado(n, 'ACTIVO')}
                            >
                              <Power size={16} strokeWidth={1.8} />
                            </button>
                          )}

                          <button
                            className="btn-icono btn-icono-peligro"
                            title="Eliminar"
                            onClick={() => eliminar(n)}
                          >
                            <Trash2 size={16} strokeWidth={1.8} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        abierto={modal}
        onCerrar={cerrar}
        titulo={
          credenciales
            ? 'Dispositivo registrado'
            : editando
              ? 'Editar dispositivo'
              : 'Registrar nuevo dispositivo'
        }
      >
        {credenciales ? (
          <div>
            <p style={{ marginBottom: '1rem', color: 'var(--gris-700)' }}>
              Guarda estas credenciales ahora. El secreto no se volverá a mostrar. Tu dispositivo debe enviarlas en cada lectura.
            </p>
            <div className="credenciales-caja">
              <div><span>Identificador</span><code>{credenciales.identificador}</code></div>
              <div><span>Secreto</span><code>{credenciales.secreto}</code></div>
            </div>
            <button className="btn btn-primario" onClick={cerrar} style={{ width: '100%', marginTop: '1.25rem' }}>
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={guardar}>
            <p style={{ fontSize: '0.86rem', color: 'var(--gris-700)', marginBottom: '1rem' }}>
              {editando
                ? 'Modifica el terreno o la ubicación física de este dispositivo. Las características del hardware no se pueden cambiar.'
                : 'Todos los dispositivos AgroSmart son ESP32 con sensores combinados de humedad capacitiva y temperatura DHT22.'}
            </p>

            <div className="campo">
              <label>Terreno asignado</label>
              <select value={form.parcelaId} onChange={(e) => setForm({ ...form, parcelaId: e.target.value })}>
                <option value="">Sin asignar</option>
                {parcelas?.map((p) => (
                  <option key={p.id_parcela} value={p.id_parcela}>{p.nombre_descriptivo}</option>
                ))}
              </select>
              <span style={{ fontSize: '0.74rem', color: 'var(--gris-500)' }}>
                Puedes asignarlo más adelante.
              </span>
            </div>

            <div className="campo">
              <label>Ubicación descriptiva</label>
              <input
                value={form.ubicacionDescriptiva}
                onChange={(e) => setForm({ ...form, ubicacionDescriptiva: e.target.value })}
                placeholder="Ej: Esquina noreste del invernadero"
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--gris-500)' }}>
                Referencia física dentro del terreno para localizar el dispositivo.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="campo">
                <label>Latitud (opcional)</label>
                <input
                  type="number" step="0.000001" min="-90" max="90"
                  value={form.latitud}
                  onChange={(e) => setForm({ ...form, latitud: e.target.value })}
                  placeholder="-4.0079"
                />
              </div>
              <div className="campo">
                <label>Longitud (opcional)</label>
                <input
                  type="number" step="0.000001" min="-180" max="180"
                  value={form.longitud}
                  onChange={(e) => setForm({ ...form, longitud: e.target.value })}
                  placeholder="-79.2113"
                />
              </div>
            </div>

            <button className="btn btn-primario" type="submit" disabled={guardando}
              style={{ width: '100%', marginTop: '0.5rem' }}>
              {guardando
                ? (editando ? 'Actualizando...' : 'Registrando...')
                : (editando ? 'Actualizar dispositivo' : 'Registrar dispositivo')}
            </button>
          </form>
        )}
      </Modal>
      <ModalConfirmar
        abierto={modalEliminar.abierto}
        onCerrar={() => setModalEliminar({ abierto: false, nodo: null, cargando: false })}
        onConfirmar={confirmarEliminar}
        titulo={`¿Eliminar dispositivo ${modalEliminar.nodo?.identificador ?? ''}?`}
        descripcion="Esta acción no se puede deshacer."
        cargando={modalEliminar.cargando}
      />
    </>
  );
}

function CeldaConfiguracion({ config, parcelaAsignada }) {
  if (!parcelaAsignada) {
    return (
      <span style={{ color: 'var(--gris-500)', fontSize: '0.82rem', fontStyle: 'italic' }}>
        Sin terreno asignado
      </span>
    );
  }

  if (!config) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
        color: '#8a5d12', fontSize: '0.82rem', fontWeight: 600,
      }}>
        <AlertTriangle size={14} strokeWidth={2} />
        Sin configuración
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
      <span style={{ fontSize: '0.82rem', color: 'var(--verde-700)', fontWeight: 600 }}>
        Hum {config.umin}–{config.umax}% · Temp ≤{config.t_maximo}°C
      </span>
      <span style={{ fontSize: '0.72rem', color: 'var(--gris-500)' }}>
        {config.modalidad_configuracion === 'PERFIL_PREDETERMINADO' ? 'Perfil predeterminado' : 'Manual'}
      </span>
    </div>
  );
}