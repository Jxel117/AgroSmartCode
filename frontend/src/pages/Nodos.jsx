import { useState } from 'react';
import { nodosApi, parcelasApi } from '../api/endpoints.js';
import { useFetch } from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import Modal from '../components/Modal.jsx';
import { fechaHora, claseBadgeEstado } from '../utils/formato.js';

const SENSORES = ['HUMEDAD', 'TEMPERATURA', 'COMBINADO'];

export default function Nodos() {
  const { esAdmin } = useAuth();
  const { datos: nodos, cargando, recargar } = useFetch(() => nodosApi.listar().then((r) => r.data.nodos));
  const { datos: parcelas } = useFetch(() => parcelasApi.listar().then((r) => r.data.parcelas));
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ tipoSensor: 'COMBINADO', modeloHardware: '', parcelaId: '' });
  const [credenciales, setCredenciales] = useState(null);
  const [guardando, setGuardando] = useState(false);

  async function crear(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      const payload = { ...form, parcelaId: form.parcelaId || null };
      const { data } = await nodosApi.crear(payload);
      setCredenciales(data.credenciales);
      recargar();
    } catch (err) {
      alert(err.response?.data?.error ?? 'Error al crear nodo');
    } finally {
      setGuardando(false);
    }
  }

  function cerrar() {
    setModal(false);
    setCredenciales(null);
    setForm({ tipoSensor: 'COMBINADO', modeloHardware: '', parcelaId: '' });
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Nodos"
        descripcion="Dispositivos sensores en campo"
        accion={esAdmin && <button className="btn btn-primario" onClick={() => setModal(true)}>+ Registrar nodo</button>}
      />

      {cargando ? <div className="spinner" /> : (
        <div className="tarjeta" style={{ padding: '0.5rem 1.5rem 1rem' }}>
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr><th>Sensor</th><th>Modelo</th><th>Estado</th><th>Ultima lectura</th></tr>
              </thead>
              <tbody>
                {nodos?.map((n) => (
                  <tr key={n.id_nodo}>
                    <td style={{ fontWeight: 600 }}>{n.tipo_sensor}</td>
                    <td>{n.modelo_hardware ?? '—'}</td>
                    <td><span className={`badge ${claseBadgeEstado(n.estado)}`}>{n.estado}</span></td>
                    <td style={{ color: 'var(--gris-500)' }}>{fechaHora(n.fecha_ultima_lectura)}</td>
                  </tr>
                ))}
                {nodos?.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--gris-500)', padding: '2rem' }}>No hay nodos registrados.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal abierto={modal} onCerrar={cerrar} titulo={credenciales ? 'Nodo registrado' : 'Registrar nodo'}>
        {credenciales ? (
          <div>
            <p style={{ marginBottom: '1rem', color: 'var(--gris-700)' }}>
              Guarda estas credenciales ahora. El secreto no se volvera a mostrar. Tu dispositivo debe enviarlas en cada lectura.
            </p>
            <div className="credenciales-caja">
              <div><span>x-node-id</span><code>{credenciales.identificador}</code></div>
              <div><span>x-node-secret</span><code>{credenciales.secreto}</code></div>
            </div>
            <button className="btn btn-primario" onClick={cerrar} style={{ width: '100%', marginTop: '1.25rem' }}>Entendido</button>
          </div>
        ) : (
          <form onSubmit={crear}>
            <div className="campo">
              <label>Tipo de sensor</label>
              <select value={form.tipoSensor} onChange={(e) => setForm({ ...form, tipoSensor: e.target.value })}>
                {SENSORES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="campo">
              <label>Modelo de hardware</label>
              <input value={form.modeloHardware} onChange={(e) => setForm({ ...form, modeloHardware: e.target.value })} placeholder="ESP32-DHT22" />
            </div>
            <div className="campo">
              <label>Parcela (opcional)</label>
              <select value={form.parcelaId} onChange={(e) => setForm({ ...form, parcelaId: e.target.value })}>
                <option value="">Sin asignar</option>
                {parcelas?.map((p) => <option key={p.id_parcela} value={p.id_parcela}>{p.nombre_descriptivo}</option>)}
              </select>
            </div>
            <button className="btn btn-primario" type="submit" disabled={guardando} style={{ width: '100%', marginTop: '0.5rem' }}>
              {guardando ? 'Registrando...' : 'Registrar'}
            </button>
          </form>
        )}
      </Modal>
    </>
  );
}