import { useState, useEffect } from 'react';
import { parcelasApi, usuariosApi } from '../api/endpoints.js';
import Modal from './Modal.jsx';

export default function ModalAgricultores({ parcela, abierto, onCerrar }) {
  const [asignados, setAsignados] = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [seleccionado, setSeleccionado] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function cargar() {
    if (!parcela) return;
    setCargando(true);
    setError('');
    try {
      const [resAsig, resTodos] = await Promise.all([
        parcelasApi.agricultores(parcela.id_parcela),
        usuariosApi.listarAgricultores(),
      ]);
      setAsignados(resAsig.data.agricultores);

      // Los disponibles son los agricultores que aun NO estan asignados a esta parcela
      const idsAsignados = new Set(resAsig.data.agricultores.map((a) => a.id_usuario));
      setDisponibles(resTodos.data.agricultores.filter((a) => !idsAsignados.has(a.id_usuario)));
      setSeleccionado('');
    } catch (err) {
      setError(err.response?.data?.error ?? 'No se pudo cargar la informacion');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (abierto) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, parcela?.id_parcela]);

  async function asignar() {
    if (!seleccionado) return;
    try {
      await parcelasApi.asignarAgricultor(parcela.id_parcela, seleccionado);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error ?? 'No se pudo asignar');
    }
  }

  async function desasignar(usuarioId) {
    if (!confirm('¿Quitar a este agricultor de la parcela?')) return;
    try {
      await parcelasApi.desasignarAgricultor(parcela.id_parcela, usuarioId);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error ?? 'No se pudo desasignar');
    }
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={`Agricultores de ${parcela?.nombre_descriptivo ?? ''}`}>
      {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gris-700)', display: 'block', marginBottom: '0.35rem' }}>
          Asignar nuevo agricultor
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            value={seleccionado}
            onChange={(e) => setSeleccionado(e.target.value)}
            style={{ flex: 1, padding: '0.6rem 0.75rem', border: '1px solid var(--gris-300)', borderRadius: 'var(--radio-sm)' }}
          >
            <option value="">Selecciona un agricultor...</option>
            {disponibles.map((a) => (
              <option key={a.id_usuario} value={a.id_usuario}>
                {a.nombre} {a.apellido} ({a.correo})
              </option>
            ))}
          </select>
          <button className="btn btn-primario" onClick={asignar} disabled={!seleccionado}>
            Asignar
          </button>
        </div>
        {disponibles.length === 0 && !cargando && (
          <p style={{ fontSize: '0.8rem', color: 'var(--gris-500)', marginTop: '0.4rem' }}>
            No hay agricultores disponibles para asignar.
          </p>
        )}
      </div>

      <div>
        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.6rem', color: 'var(--gris-700)' }}>
          Agricultores asignados ({asignados.length})
        </h4>
        {cargando ? (
          <div className="spinner" />
        ) : asignados.length === 0 ? (
          <p style={{ color: 'var(--gris-500)', fontSize: '0.88rem' }}>
            Esta parcela aun no tiene agricultores asignados.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {asignados.map((a) => (
              <div key={a.id_usuario}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.65rem 0.9rem', background: 'var(--crema)', borderRadius: 'var(--radio-sm)',
                }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.nombre} {a.apellido}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gris-500)' }}>{a.correo}</div>
                </div>
                <button className="btn btn-peligro" style={{ padding: '0.35rem 0.65rem', fontSize: '0.82rem' }}
                  onClick={() => desasignar(a.id_usuario)}>
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}