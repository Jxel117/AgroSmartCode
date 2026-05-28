import { useState } from 'react';
import { usuariosApi } from '../api/endpoints.js';
import { useFetch } from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import Modal from '../components/Modal.jsx';
import { fechaHora, claseBadgeEstado } from '../utils/formato.js';

const VACIO = { nombre: '', apellido: '', correo: '', contra: '', rol: 'AGRICULTOR' };

export default function Usuarios() {
  const { usuario: actual } = useAuth();
  const { datos, cargando, error, recargar } = useFetch(() => usuariosApi.listar().then((r) => r.data.usuarios));
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  function abrirNuevo() { setEditando(null); setForm(VACIO); setErrorForm(''); setModal(true); }
  function abrirEditar(u) {
    setEditando(u.id);
    setForm({ nombre: u.nombre, apellido: u.apellido, correo: u.correo, contra: '', rol: u.rol });
    setErrorForm('');
    setModal(true);
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    setErrorForm('');
    try {
      if (editando) {
        await usuariosApi.actualizar(editando, { nombre: form.nombre, apellido: form.apellido, rol: form.rol });
      } else {
        await usuariosApi.crear(form);
      }
      setModal(false);
      recargar();
    } catch (err) {
      setErrorForm(err.response?.data?.error ?? err.response?.data?.details?.[0]?.mensaje ?? 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(u, estado) {
    await usuariosApi.cambiarEstado(u.id, estado);
    recargar();
  }

  async function eliminar(u) {
    if (!confirm(`¿Eliminar al usuario ${u.nombre} ${u.apellido}?`)) return;
    try {
      await usuariosApi.eliminar(u.id);
      recargar();
    } catch (err) {
      alert(err.response?.data?.error ?? 'No se pudo eliminar');
    }
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Usuarios"
        descripcion="Gestion de cuentas del sistema"
        accion={<button className="btn btn-primario" onClick={abrirNuevo}>+ Nuevo usuario</button>}
      />

      {cargando ? <div className="spinner" /> : error ? <p style={{ color: 'var(--rojo)' }}>{error}</p> : (
        <div className="tarjeta" style={{ padding: '0.5rem 1.5rem 1rem' }}>
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Creado</th><th></th></tr>
              </thead>
              <tbody>
                {datos.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>
                      {u.nombre} {u.apellido}
                      {u.id === actual.id && <span className="badge badge-gris" style={{ marginLeft: '0.5rem' }}>tu</span>}
                    </td>
                    <td style={{ color: 'var(--gris-500)' }}>{u.correo}</td>
                    <td><span className={`badge ${u.rol === 'ADMINISTRADOR' ? 'badge-ambar' : 'badge-gris'}`}>{u.rol}</span></td>
                    <td><span className={`badge ${claseBadgeEstado(u.estado)}`}>{u.estado}</span></td>
                    <td style={{ color: 'var(--gris-500)', fontSize: '0.84rem' }}>{fechaHora(u.fechaCreacion)}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="btn btn-secundario" style={{ padding: '0.4rem 0.7rem', marginRight: '0.4rem' }} onClick={() => abrirEditar(u)}>Editar</button>
                      {u.estado === 'ACTIVA'
                        ? <button className="btn btn-secundario" style={{ padding: '0.4rem 0.7rem', marginRight: '0.4rem' }} onClick={() => cambiarEstado(u, 'SUSPENDIDA')}>Suspender</button>
                        : <button className="btn btn-secundario" style={{ padding: '0.4rem 0.7rem', marginRight: '0.4rem' }} onClick={() => cambiarEstado(u, 'ACTIVA')}>Activar</button>}
                      {u.id !== actual.id && <button className="btn btn-peligro" style={{ padding: '0.4rem 0.7rem' }} onClick={() => eliminar(u)}>Eliminar</button>}
                    </td>
                  </tr>
                ))}
                {datos.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gris-500)', padding: '2rem' }}>No hay usuarios.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal abierto={modal} onCerrar={() => setModal(false)} titulo={editando ? 'Editar usuario' : 'Nuevo usuario'}>
        <form onSubmit={guardar}>
          {errorForm && <div className="login-error" style={{ marginBottom: '1rem' }}>{errorForm}</div>}
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
          <div className="campo">
            <label>Correo</label>
            <input type="email" value={form.correo} required disabled={!!editando}
              onChange={(e) => setForm({ ...form, correo: e.target.value })} />
            {editando && <span style={{ fontSize: '0.76rem', color: 'var(--gris-500)' }}>El correo no se puede cambiar.</span>}
          </div>
          {!editando && (
            <div className="campo">
              <label>Contraseña</label>
              <input type="password" value={form.contra} required minLength={8}
                onChange={(e) => setForm({ ...form, contra: e.target.value })} placeholder="Minimo 8 caracteres" />
            </div>
          )}
          <div className="campo">
            <label>Rol</label>
            <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
              <option value="AGRICULTOR">AGRICULTOR</option>
              <option value="ADMINISTRADOR">ADMINISTRADOR</option>
            </select>
          </div>
          <button className="btn btn-primario" type="submit" disabled={guardando} style={{ width: '100%', marginTop: '0.5rem' }}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </Modal>
    </>
  );
}