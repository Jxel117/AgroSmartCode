import { useState, useEffect } from 'react';
import { notif } from '../utils/notif.js';
import { Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { usuariosApi } from '../api/endpoints.js';
import Modal from './Modal.jsx';
import './ModalAvatar.css';

// Lista de avatares disponibles. Debe coincidir con el backend.
const AVATARES = [
  { id: 'avatar-1', label: 'Avatar 1' },
  { id: 'avatar-2', label: 'Avatar 2' },
  { id: 'avatar-3', label: 'Avatar 3' },
  { id: 'avatar-4', label: 'Avatar 4' },
];

export default function ModalAvatar({ abierto, alCerrar }) {
  const { usuario, actualizarUsuario } = useAuth();
  const [seleccionado, setSeleccionado] = useState(usuario?.avatar_id ?? '');
  const [guardando, setGuardando] = useState(false);

  // Sincronizar la seleccion con el avatar actual cada vez que se abre
  useEffect(() => {
    if (abierto) setSeleccionado(usuario?.avatar_id ?? '');
  }, [abierto, usuario?.avatar_id]);

  async function aplicar(avatarId) {
    if (avatarId === usuario?.avatar_id) {
      alCerrar();
      return;
    }
    setGuardando(true);
    setSeleccionado(avatarId);
    try {
      const { data } = await usuariosApi.actualizarPerfilPropio({ avatar_id: avatarId });
      actualizarUsuario(data.usuario);
      notif.exito('Avatar actualizado');
      alCerrar();
    } catch (err) {
      notif.error(err.response?.data?.error ?? 'No se pudo cambiar el avatar');
      setSeleccionado(usuario?.avatar_id ?? '');
    } finally {
      setGuardando(false);
    }
  }

  async function restablecer() {
    setGuardando(true);
    try {
      const { data } = await usuariosApi.actualizarPerfilPropio({ avatar_id: '' });
      actualizarUsuario(data.usuario);
      notif.exito('Avatar restablecido al predeterminado');
      setSeleccionado('');
      alCerrar();
    } catch (err) {
      notif.error('No se pudo restablecer');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal abierto={abierto} onCerrar={alCerrar} titulo="Elige tu avatar">
      <p style={{ fontSize: '0.86rem', color: 'var(--gris-500)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
        Selecciona uno de los avatares disponibles. Tu elección se guardará automáticamente.
      </p>

      <div className="galeria-avatares">
        {AVATARES.map((avatar) => (
          <button
            key={avatar.id}
            type="button"
            className={`opcion-avatar ${seleccionado === avatar.id ? 'seleccionado' : ''}`}
            onClick={() => aplicar(avatar.id)}
            disabled={guardando}
            title={avatar.label}
          >
            <img src={`/img/avatares/${avatar.id}.jpg`} alt={avatar.label} />
            {seleccionado === avatar.id && (
              <div className="opcion-avatar-check">
                <Check size={14} strokeWidth={3} />
              </div>
            )}
          </button>
        ))}
      </div>

      {usuario?.avatar_id && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gris-100)' }}>
          <button
            type="button"
            className="btn btn-secundario"
            onClick={restablecer}
            disabled={guardando}
          >
            Restablecer al predeterminado
          </button>
        </div>
      )}
    </Modal>
  );
}