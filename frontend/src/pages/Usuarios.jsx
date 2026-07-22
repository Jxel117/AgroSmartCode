import { useState } from 'react';
import { usuariosApi } from '../api/endpoints.js';
import { useFetch } from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useValidacionForm } from '../hooks/useValidacionForm.js';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import Modal from '../components/Modal.jsx';
import Campo from '../components/Campo.jsx';
import MedidorPassword from '../components/MedidorPassword.jsx';
import ModalParcelasUsuario from '../components/ModalParcelasUsuario.jsx';
import { claseBadgeEstado } from '../utils/formato.js';
import CampoPassword from '../components/CampoPassword.jsx';
import { notif } from '../utils/notif.js';
import { UserPlus, Pencil, Trash2, KeyRound, Power, PowerOff, MapPinned, Mail } from 'lucide-react';
import ModalConfirmar from '../components/ModalConfirmar.jsx';

const VACIO = { nombre: '', apellido: '', correoValidacion: '', contra: '', rol: 'AGRICULTOR' };

// Reglas de validacion para crear/editar
const reglasCrear = {
  nombre: (v) => !v?.trim() ? 'El nombre es obligatorio' : v.trim().length < 2 ? 'Mínimo 2 caracteres' : null,
  apellido: (v) => !v?.trim() ? 'El apellido es obligatorio' : v.trim().length < 2 ? 'Mínimo 2 caracteres' : null,
  correoValidacion: (v) => {
    if (!v?.trim()) return 'El correo Gmail es obligatorio';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Correo no válido';
    if (!v.toLowerCase().endsWith('@gmail.com')) return 'Debe ser una cuenta @gmail.com';
    return null;
  },
  contra: (v, form) => {
    // Los AGRICULTOR no llevan contraseña: activan su cuenta por correo.
    if (form?.rol !== 'ADMINISTRADOR') return null;
    if (!v) return 'La contraseña es obligatoria';
    if (v.length < 8) return 'Mínimo 8 caracteres';
    return null;
  },
};

const reglasEditar = {
  nombre: reglasCrear.nombre,
  apellido: reglasCrear.apellido,
};

export default function Usuarios() {
  const { usuario: actual, esAuditor } = useAuth();
  const { datos, cargando, error, recargar } = useFetch(() => usuariosApi.listar().then((r) => r.data.usuarios));

  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [modalEliminar, setModalEliminar] = useState({ abierto: false, usuario: null, cargando: false });

  const { errores, validar, limpiarError, limpiarTodos, setErroresBackend } = useValidacionForm();

  const [modalPass, setModalPass] = useState(false);
  const [usuarioPass, setUsuarioPass] = useState(null);
  const [passNueva, setPassNueva] = useState('');
  const valPass = useValidacionForm();

  const [modalParcelas, setModalParcelas] = useState(false);
  const [usuarioParcelas, setUsuarioParcelas] = useState(null);

  function abrirNuevo() {
    setEditando(null);
    setForm(VACIO);
    limpiarTodos();
    setModal(true);
  }

  function abrirEditar(u) {
    setEditando(u.id);
    setForm({
      nombre: u.nombre,
      apellido: u.apellido,
      correoValidacion: u.correoValidacion ?? '',
      contra: '',
      rol: u.rol,
    });
    limpiarTodos();
    setModal(true);
  }

  function abrirParcelas(u) {
    setUsuarioParcelas(u);
    setModalParcelas(true);
  }

  // Actualizar el form y limpiar error de ese campo
  function setCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) limpiarError(campo);
  }

  // Mapear nombres de campos del backend a los del frontend
  function mapearCampoBackend(detalles) {
    const mapa = { correoValidacion: 'correoValidacion', correo_validacion: 'correoValidacion' };
    return detalles.map((d) => ({ ...d, campo: mapa[d.campo] ?? d.campo }));
  }

  async function guardar(e) {
    e.preventDefault();
    const reglas = editando ? reglasEditar : reglasCrear;
    if (!validar(form, reglas)) return;

    setGuardando(true);
    try {
      if (editando) {
        await usuariosApi.actualizar(editando, { nombre: form.nombre, apellido: form.apellido });
        notif.exito('Usuario actualizado');
      } else if (form.rol === 'ADMINISTRADOR') {
        await usuariosApi.crear(form);
        notif.exito('Usuario creado correctamente');
      } else {
        const datosAgricultor = { ...form };
        delete datosAgricultor.contra;
        await usuariosApi.crear(datosAgricultor);
        notif.exito('Agricultor registrado. Se le envió un correo para activar su cuenta.');
      }
      setModal(false);
      recargar();
    } catch (err) {
      const detalles = err.response?.data?.details;
      if (Array.isArray(detalles) && detalles.length > 0) {
        setErroresBackend(mapearCampoBackend(detalles));
      } else {
        notif.error(err.response?.data?.error ?? 'Error al guardar');
      }
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(u, estado) {
    try {
      await usuariosApi.cambiarEstado(u.id, estado);
      notif.exito(`Usuario ${estado === 'ACTIVA' ? 'activado' : 'suspendido'}`);
      recargar();
    } catch (err) {
      notif.error(err.response?.data?.error ?? 'No se pudo cambiar el estado');
    }
  }

  async function reenviarActivacion(u) {
    try {
      await usuariosApi.reenviarActivacion(u.id);
      notif.exito('Correo de activación reenviado');
    } catch (err) {
      notif.error(err.response?.data?.error ?? 'No se pudo reenviar el correo');
    }
  }

  // Función eliminar:
  function eliminar(u) {
    setModalEliminar({ abierto: true, usuario: u, cargando: false });
  }

  async function confirmarEliminar() {
    const u = modalEliminar.usuario;
    if (!u) return;
    setModalEliminar((prev) => ({ ...prev, cargando: true }));
    try {
      await usuariosApi.eliminar(u.id);
      notif.exito('Usuario eliminado');
      setModalEliminar({ abierto: false, usuario: null, cargando: false });
      recargar();
    } catch (err) {
      notif.error(err.response?.data?.error ?? 'No se pudo eliminar');
      setModalEliminar((prev) => ({ ...prev, cargando: false }));
    }
  }

  function abrirResetPass(u) {
    setUsuarioPass(u);
    setPassNueva('');
    valPass.limpiarTodos();
    setModalPass(true);
  }

  async function resetearPass(e) {
    e.preventDefault();
    if (!passNueva || passNueva.length < 8) {
      valPass.setError('passNueva', 'La contraseña debe tener mínimo 8 caracteres');
      return;
    }
    try {
      await usuariosApi.resetearPassword(usuarioPass.id, passNueva);
      setModalPass(false);
      notif.exito('Contraseña restablecida y cuenta desbloqueada');
      recargar();
    } catch (err) {
      const detalles = err.response?.data?.details;
      if (Array.isArray(detalles) && detalles.length > 0) {
        valPass.setError('passNueva', detalles.map((d) => d.mensaje).join('. '));
      } else {
        notif.error(err.response?.data?.error ?? 'Error al restablecer');
      }
    }
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Usuarios"
        descripcion={esAuditor
          ? 'Solo lectura: todos los administradores y agricultores registrados, de todas las empresas.'
          : 'Cuentas de tu empresa: administradores que gestionan el sistema y agricultores que monitorean sus terrenos asignados.'}
        accion={esAuditor ? undefined : (
          <button className="btn btn-primario" onClick={abrirNuevo}>
            <UserPlus size={16} strokeWidth={2} />
            Nuevo usuario
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
                  <th>Correo acceso</th>
                  <th>Correo validación</th>
                  {esAuditor && <th>Empresa</th>}
                  <th>Rol</th>
                  <th>Estado</th>
                  {!esAuditor && <th></th>}
                </tr>
              </thead>
              <tbody>
                {datos.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>
                      {u.nombre} {u.apellido}
                      {u.id === actual.id && <span className="badge badge-gris" style={{ marginLeft: '0.5rem' }}>tú</span>}
                      {u.cuentaActivada === false
                        ? <span className="badge badge-ambar" style={{ marginLeft: '0.5rem' }}>pendiente de activación</span>
                        : u.bloqueado && <span className="badge badge-rojo" style={{ marginLeft: '0.5rem' }}>bloqueado</span>
                      }
                    </td>
                    <td style={{ color: 'var(--gris-700)', fontSize: '0.85rem' }}>{u.correo}</td>
                    <td style={{ color: 'var(--gris-500)', fontSize: '0.85rem' }}>{u.correoValidacion ?? '—'}</td>
                    {esAuditor && (
                      <td style={{ color: 'var(--gris-700)', fontSize: '0.85rem' }}>{u.empresaIdentificador ?? '—'}</td>
                    )}
                    <td><span className={`badge ${u.rol === 'ADMINISTRADOR' ? 'badge-ambar' : 'badge-gris'}`}>{u.rol}</span></td>
                    <td><span className={`badge ${claseBadgeEstado(u.estado)}`}>{u.estado}</span></td>
                    {!esAuditor && (
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button className="btn-icono" title="Editar" onClick={() => abrirEditar(u)}>
                          <Pencil size={16} strokeWidth={1.8} />
                        </button>
                        {u.cuentaActivada === false
                          ? <button className="btn-icono" title="Reenviar correo de activación" onClick={() => reenviarActivacion(u)}>
                            <Mail size={16} strokeWidth={1.8} />
                          </button>
                          : <button className="btn-icono" title="Resetear contraseña" onClick={() => abrirResetPass(u)}>
                            <KeyRound size={16} strokeWidth={1.8} />
                          </button>
                        }
                        {u.rol === 'AGRICULTOR' && (
                          <button className="btn-icono" title="Terrenos asignados" onClick={() => abrirParcelas(u)}>
                            <MapPinned size={16} strokeWidth={1.8} />
                          </button>
                        )}
                        {u.id !== actual.id && (
                          <>
                            {u.estado === 'ACTIVA'
                              ? <button className="btn-icono" title="Suspender" onClick={() => cambiarEstado(u, 'SUSPENDIDA')}>
                                <PowerOff size={16} strokeWidth={1.8} />
                              </button>
                              : <button className="btn-icono" title="Activar" onClick={() => cambiarEstado(u, 'ACTIVA')}>
                                <Power size={16} strokeWidth={1.8} />
                              </button>
                            }
                            <button className="btn-icono btn-icono-peligro" title="Eliminar" onClick={() => eliminar(u)}>
                              <Trash2 size={16} strokeWidth={1.8} />
                            </button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {datos.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--gris-500)', padding: '2rem' }}>
                      No hay usuarios.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal crear/editar */}
      <Modal abierto={modal} onCerrar={() => setModal(false)} titulo={editando ? 'Editar usuario' : 'Nuevo usuario'}>
        <form onSubmit={guardar} noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <Campo label="Nombre" id="nombre" obligatorio error={errores.nombre}>
              <input id="nombre" value={form.nombre} onChange={(e) => setCampo('nombre', e.target.value)} />
            </Campo>
            <Campo label="Apellido" id="apellido" obligatorio error={errores.apellido}>
              <input id="apellido" value={form.apellido} onChange={(e) => setCampo('apellido', e.target.value)} />
            </Campo>
          </div>

          {!editando && (
            <>
              <Campo
                label="Correo Gmail (validación)"
                id="correoVal"
                obligatorio
                error={errores.correoValidacion}
                ayuda="El correo de acceso @agrosmart.ec se generará automáticamente."
              >
                <input
                  id="correoVal"
                  type="email"
                  value={form.correoValidacion}
                  onChange={(e) => setCampo('correoValidacion', e.target.value)}
                  placeholder="usuario@gmail.com"
                />
              </Campo>

              <Campo label="Rol" id="rol">
                <select id="rol" value={form.rol} onChange={(e) => setCampo('rol', e.target.value)}>
                  <option value="AGRICULTOR">AGRICULTOR</option>
                  <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                </select>
              </Campo>

              {form.rol === 'ADMINISTRADOR' ? (
                <>
                  <Campo label="Contraseña" id="contraNuevo" obligatorio error={errores.contra}>
                    <CampoPassword
                      id="contraNuevo"
                      value={form.contra}
                      onChange={(e) => setCampo('contra', e.target.value)}
                      placeholder="Contraseña segura"
                      sinLabel
                    />
                  </Campo>
                  <MedidorPassword password={form.contra} />
                </>
              ) : (
                <p style={{ fontSize: '0.82rem', color: 'var(--gris-500)', marginBottom: '1rem' }}>
                  El agricultor no queda activo de inmediato: se le enviará un correo a su Gmail con un enlace para activar la cuenta y definir su propia contraseña. Hasta que lo haga, no podrá iniciar sesión ni ser asignado a terrenos.
                </p>
              )}
            </>
          )}

          {editando && (
            <p style={{ fontSize: '0.82rem', color: 'var(--gris-500)', marginBottom: '1rem' }}>
              El rol no se puede modificar después de crear la cuenta. Para cambiar la contraseña usa "Resetear clave".
            </p>
          )}

          <button className="btn btn-primario" type="submit" disabled={guardando} style={{ width: '100%', marginTop: '0.5rem' }}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </Modal>

      {/* Modal resetear password */}
      <Modal abierto={modalPass} onCerrar={() => setModalPass(false)} titulo={`Resetear contraseña de ${usuarioPass?.nombre ?? ''}`}>
        <form onSubmit={resetearPass} noValidate>
          <Campo label="Nueva contraseña" id="resetPass" obligatorio error={valPass.errores.passNueva}>
            <CampoPassword
              id="resetPass"
              value={passNueva}
              onChange={(e) => {
                setPassNueva(e.target.value);
                if (valPass.errores.passNueva) valPass.limpiarError('passNueva');
              }}
              placeholder="Nueva contraseña segura"
              sinLabel
            />
          </Campo>
          <MedidorPassword password={passNueva} />
          <p style={{ fontSize: '0.8rem', color: 'var(--gris-500)', marginBottom: '1rem' }}>
            Al restablecer la contraseña, si la cuenta estaba bloqueada se desbloqueará automáticamente.
          </p>
          <button className="btn btn-primario" type="submit" style={{ width: '100%' }}>Restablecer</button>
        </form>
      </Modal>

      <ModalParcelasUsuario
        usuario={usuarioParcelas}
        abierto={modalParcelas}
        onCerrar={() => setModalParcelas(false)}
      />
      <ModalConfirmar
        abierto={modalEliminar.abierto}
        onCerrar={() => setModalEliminar({ abierto: false, usuario: null, cargando: false })}
        onConfirmar={confirmarEliminar}
        titulo={`¿Eliminar a ${modalEliminar.usuario?.nombre ?? ''} ${modalEliminar.usuario?.apellido ?? ''}?`}
        descripcion="Esta acción no se puede deshacer."
        cargando={modalEliminar.cargando}
      />
    </>
  );
}