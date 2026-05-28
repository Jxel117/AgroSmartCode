import { useState } from 'react';
import { parcelasApi } from '../api/endpoints.js';
import { useFetch } from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import Modal from '../components/Modal.jsx';
import { claseBadgeEstado } from '../utils/formato.js';

const SUELOS = ['HUMIFERO', 'ARENOSO', 'ARCILLOSO'];
const CULTIVOS = ['HORTALIZAS', 'FRUTOS_ROJOS'];
const VACIO = { nombreDescriptivo: '', tipoSuelo: 'HUMIFERO', tipoCultivo: 'HORTALIZAS', ubicacionDescriptiva: '', estado: 'ACTIVA' };

export default function Parcelas() {
  const { esAdmin } = useAuth();
  const { datos, cargando, error, recargar } = useFetch(() => parcelasApi.listar().then((r) => r.data.parcelas));
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);

  function abrirNuevo() { setEditando(null); setForm(VACIO); setModal(true); }
  function abrirEditar(p) {
    setEditando(p.id_parcela);
    setForm({
      nombreDescriptivo: p.nombre_descriptivo, tipoSuelo: p.tipo_suelo,
      tipoCultivo: p.tipo_cultivo, ubicacionDescriptiva: p.ubicacion_descriptiva ?? '',
      estado: p.estado,
    });
    setModal(true);
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editando) await parcelasApi.actualizar(editando, form);
      else await parcelasApi.crear(form);
      setModal(false);
      recargar();
    } catch (err) {
      alert(err.response?.data?.error ?? 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar esta parcela? Se borraran sus nodos y lecturas.')) return;
    await parcelasApi.eliminar(id);
    recargar();
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Parcelas"
        descripcion="Terrenos monitoreados por el sistema"
        accion={esAdmin && <button className="btn btn-primario" onClick={abrirNuevo}>+ Nueva parcela</button>}
      />

      {cargando ? <div className="spinner" /> : error ? <p style={{ color: 'var(--rojo)' }}>{error}</p> : (
        <div className="tarjeta" style={{ padding: '0.5rem 1.5rem 1rem' }}>
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr><th>Nombre</th><th>Suelo</th><th>Cultivo</th><th>Ubicacion</th><th>Estado</th>{esAdmin && <th></th>}</tr>
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
                        <button className="btn btn-secundario" style={{ padding: '0.4rem 0.7rem', marginRight: '0.4rem' }} onClick={() => abrirEditar(p)}>Editar</button>
                        <button className="btn btn-peligro" style={{ padding: '0.4rem 0.7rem' }} onClick={() => eliminar(p.id_parcela)}>Eliminar</button>
                      </td>
                    )}
                  </tr>
                ))}
                {datos.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gris-500)', padding: '2rem' }}>No hay parcelas.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal abierto={modal} onCerrar={() => setModal(false)} titulo={editando ? 'Editar parcela' : 'Nueva parcela'}>
        <form onSubmit={guardar}>
          <div className="campo">
            <label>Nombre descriptivo</label>
            <input value={form.nombreDescriptivo} required onChange={(e) => setForm({ ...form, nombreDescriptivo: e.target.value })} />
          </div>
          <div className="campo">
            <label>Tipo de suelo</label>
            <select value={form.tipoSuelo} onChange={(e) => setForm({ ...form, tipoSuelo: e.target.value })}>
              {SUELOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="campo">
            <label>Tipo de cultivo</label>
            <select value={form.tipoCultivo} onChange={(e) => setForm({ ...form, tipoCultivo: e.target.value })}>
              {CULTIVOS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="campo">
            <label>Ubicacion</label>
            <input value={form.ubicacionDescriptiva} onChange={(e) => setForm({ ...form, ubicacionDescriptiva: e.target.value })} />
          </div>
          {editando && (
            <div className="campo">
              <label>Estado</label>
              <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                <option value="ACTIVA">ACTIVA</option>
                <option value="INACTIVA">INACTIVA</option>
              </select>
            </div>
          )}
          <button className="btn btn-primario" type="submit" disabled={guardando} style={{ width: '100%', marginTop: '0.5rem' }}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </Modal>
    </>
  );
}