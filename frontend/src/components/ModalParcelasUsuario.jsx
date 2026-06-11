import { useState, useEffect } from 'react';
import { usuariosApi } from '../api/endpoints.js';
import Modal from './Modal.jsx';

export default function ModalParcelasUsuario({ usuario, abierto, onCerrar }) {
  const [parcelas, setParcelas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function cargar() {
    if (!usuario) return;
    setCargando(true);
    setError('');
    try {
      const res = await usuariosApi.parcelas(usuario.id);
      setParcelas(res.data.parcelas);
    } catch (err) {
      setError(err.response?.data?.error ?? 'No se pudo cargar la información');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (abierto) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, usuario?.id]);

  async function alternar(parcela) {
    try {
      if (parcela.asignada) {
        await usuariosApi.desasignarParcela(usuario.id, parcela.id_parcela);
      } else {
        await usuariosApi.asignarParcela(usuario.id, parcela.id_parcela);
      }
      cargar();
    } catch (err) {
      setError(err.response?.data?.error ?? 'No se pudo actualizar');
    }
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={`Terrenos asignados a ${usuario?.nombre ?? ''}`}>
      {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <p style={{ fontSize: '0.85rem', color: 'var(--gris-700)', marginBottom: '1rem' }}>
        Activa las casillas de los terrenos que este agricultor podrá ver y gestionar.
      </p>

      {cargando ? <div className="spinner" /> : parcelas.length === 0 ? (
        <p style={{ color: 'var(--gris-500)', fontSize: '0.88rem' }}>
          No hay terrenos creados aún en tu empresa.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {parcelas.map((p) => (
            <label key={p.id_parcela} style={{
              display: 'flex', alignItems: 'center', gap: '0.7rem',
              padding: '0.65rem 0.9rem', background: 'var(--crema)', borderRadius: 'var(--radio-sm)',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={p.asignada}
                onChange={() => alternar(p)}
              />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.nombre_descriptivo}</span>
            </label>
          ))}
        </div>
      )}
    </Modal>
  );
}