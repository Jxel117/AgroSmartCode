import { useState } from 'react';
import { usuariosApi } from '../api/endpoints.js';
import { useFetch } from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import Modal from '../components/Modal.jsx';
import MedidorPassword from '../components/MedidorPassword.jsx';
import ModalParcelasUsuario from '../components/ModalParcelasUsuario.jsx';
import { claseBadgeEstado } from '../utils/formato.js';
import CampoPassword from '../components/CampoPassword.jsx';
import { toast } from 'sonner';
import { UserPlus, Pencil, Trash2, KeyRound, Power, PowerOff, MapPinned } from 'lucide-react';

const VACIO = { nombre: '', apellido: '', correoValidacion: '', contra: '', rol: 'AGRICULTOR' };

export default function Usuarios() {
  const { usuario: actual } = useAuth();
  const { datos, cargando, error, recargar } = useFetch(() => usuariosApi.listar().then((r) => r.data.usuarios));

  // Modal crear/editar usuario
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  // Modal de reseteo de password
  const [modalPass, setModalPass] = useState(false);
  const [usuarioPass, setUsuarioPass] = useState(null);
  const [passNueva, setPassNueva] = useState('');

  // Modal de parcelas asignadas al agricultor
  const [modalParcelas, setModalParcelas] = useState(false);
  const [usuarioParcelas, setUsuarioParcelas] = useState(null);

  function abrirNuevo() {
    setEditando(null);
    setForm(VACIO);
    setErrorForm('');
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
    setErrorForm('');
    setModal(true);
  }

  function abrirParcelas(u) {
    setUsuarioParcelas(u);
    setModalParcelas(true);
  }

  function traducirCampo(campo) {
    const traducciones = {
      nombre: 'Nombre',
      apellido: 'Apellido',
      correoValidacion: 'Correo Gmail',
      contra: 'Contraseña',
      rol: 'Rol',
    };
    return traducciones[campo] ?? campo;
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    setErrorForm('');
    try {
      if (editando) {
        await usuariosApi.actualizar(editando, { nombre: form.nombre, apellido: form.apellido });
      } else {
        await usuariosApi.crear(form);
      }
      setModal(false);
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

  async function cambiarEstado(u, estado) {
    try {
      await usuariosApi.cambiarEstado(u.id, estado);
      toast.success(`Usuario ${estado === 'ACTIVA' ? 'activado' : 'suspendido'}`);
      recargar();
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'No se pudo cambiar el estado');
    }
  }

  async function eliminar(u) {
    toast(`¿Eliminar a ${u.nombre} ${u.apellido}?`, {
      description: 'Esta acción no se puede deshacer.',
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            await usuariosApi.eliminar(u.id);
            toast.success('Usuario eliminado');
            recargar();
          } catch (err) {
            toast.error(err.response?.data?.error ?? 'No se pudo eliminar');
          }
        },
      },
    });
  }

  function abrirResetPass(u) {
    setUsuarioPass(u);
    setPassNueva('');
    setModalPass(true);
  }

  async function resetearPass(e) {
    e.preventDefault();
    try {
      await usuariosApi.resetearPassword(usuarioPass.id, passNueva);
      setModalPass(false);
      alert('Contraseña restablecida y cuenta desbloqueada');
      recargar();
    } catch (err) {
      const detalles = err.response?.data?.details;
      if (Array.isArray(detalles) && detalles.length > 0) {
        alert(detalles.map((d) => `• ${d.mensaje}`).join('\n'));
      } else {
        alert(err.response?.data?.error ?? 'Error');
      }
    }
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Usuarios"
        descripcion="Cuentas de tu empresa: administradores que gestionan el sistema y agricultores que monitorean sus terrenos asignados."
        accion={
          <button className="btn btn-primario" onClick={abrirNuevo}>
            <UserPlus size={16} strokeWidth={2} />
            Nuevo usuario
          </button>
        }
      />

      {cargando ? <div className="spinner" /> : error ? <p style={{ color: 'var(--rojo)' }}>{error}</p> : (
        <div className="tarjeta" style={{ padding: '0.5rem 1.5rem 1rem' }}>
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo acceso</th>
                  <th>Correo validación</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {datos.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>
                      {u.nombre} {u.apellido}
                      {u.id === actual.id && <span className="badge badge-gris" style={{ marginLeft: '0.5rem' }}>tú</span>}
                      {u.bloqueado && <span className="badge badge-rojo" style={{ marginLeft: '0.5rem' }}>bloqueado</span>}
                    </td>
                    <td style={{ color: 'var(--gris-700)', fontSize: '0.85rem' }}>{u.correo}</td>
                    <td style={{ color: 'var(--gris-500)', fontSize: '0.85rem' }}>{u.correoValidacion ?? '—'}</td>
                    <td><span className={`badge ${u.rol === 'ADMINISTRADOR' ? 'badge-ambar' : 'badge-gris'}`}>{u.rol}</span></td>
                    <td><span className={`badge ${claseBadgeEstado(u.estado)}`}>{u.estado}</span></td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="btn-icono" title="Editar" onClick={() => abrirEditar(u)}>
                        <Pencil size={16} strokeWidth={1.8} />
                      </button>
                      <button className="btn-icono" title="Resetear contraseña" onClick={() => abrirResetPass(u)}>
                        <KeyRound size={16} strokeWidth={1.8} />
                      </button>
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

      <Modal abierto={modal} onCerrar={() => setModal(false)} titulo={editando ? 'Editar usuario' : 'Nuevo usuario'}>
        <form onSubmit={guardar}>
          {errorForm && (
            <div className="login-error" style={{ marginBottom: '1rem', whiteSpace: 'pre-line' }}>
              {errorForm}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="campo">
              <label>Nombre</label>
              <input value={form.nombre} required onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="campo">
              <label>Apellido</label>
              <input value={form.apellido} required onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
            </div>
          </div>
          {!editando && (
            <>
              <div className="campo">
                <label>Correo Gmail (validación)</label>
                <input
                  type="email"
                  value={form.correoValidacion}
                  required
                  onChange={(e) => setForm({ ...form, correoValidacion: e.target.value })}
                  placeholder="usuario@gmail.com"
                />
                <span style={{ fontSize: '0.76rem', color: 'var(--gris-500)' }}>
                  El correo de acceso @agrosmart.ec se generará automáticamente.
                </span>
              </div>
             <CampoPassword
                id="contraNuevo"
                label="Contraseña"
                value={form.contra}
                onChange={(e) => setForm({ ...form, contra: e.target.value })}
                placeholder="Contraseña segura"
              />
              <MedidorPassword password={form.contra} />
              <div className="campo">
                <label>Rol</label>
                <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                  <option value="AGRICULTOR">AGRICULTOR</option>
                  <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                </select>
              </div>
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

      <Modal abierto={modalPass} onCerrar={() => setModalPass(false)} titulo={`Resetear contraseña de ${usuarioPass?.nombre ?? ''}`}>
        <form onSubmit={resetearPass}>
          <CampoPassword
            id="resetPass"
            label="Nueva contraseña"
            value={passNueva}
            onChange={(e) => setPassNueva(e.target.value)}
            placeholder="Nueva contraseña segura"
          />
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
    </>
  );
}