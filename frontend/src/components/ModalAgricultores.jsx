import { useState, useEffect } from 'react';
import { parcelasApi } from '../api/endpoints.js';
import Modal from './Modal.jsx';

export default function ModalAgricultores({ parcela, abierto, onCerrar }) {
  const [asignados, setAsignados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function cargar() {
    if (!parcela) return;
    setCargando(true);
    setError('');
    try {
      const res = await parcelasApi.agricultores(parcela.id_parcela);
      setAsignados(res.data.agricultores);
    } catch (err) {
      setError(err.response?.data?.error ?? 'No se pudo cargar la información');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (abierto) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, parcela?.id_parcela]);

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={`Agricultores de ${parcela?.nombre_descriptivo ?? ''}`}>
      {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <p style={{ fontSize: '0.85rem', color: 'var(--gris-700)', marginBottom: '1rem' }}>
        Para asignar o quitar agricultores de este terreno, ve a <strong>Usuarios</strong> y edita las parcelas asignadas a cada agricultor.
      </p>

      <h4 style={{ fontSize: '0.95rem', marginBottom: '0.6rem', color: 'var(--gris-700)' }}>
        Agricultores asignados ({asignados.length})
      </h4>

      {cargando ? (
        <div className="spinner" />
      ) : asignados.length === 0 ? (
        <p style={{ color: 'var(--gris-500)', fontSize: '0.88rem' }}>
          Este terreno aún no tiene agricultores asignados.
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
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}