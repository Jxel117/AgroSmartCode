import { iniciales } from '../utils/avatar.js';
import './Avatar.css';

export default function Avatar({ usuario, tamano = 'md', className = '', onClick }) {
  const tieneAvatar = Boolean(usuario?.avatar_id);
  const titulo = usuario ? `${usuario.nombre ?? ''} ${usuario.apellido ?? ''}`.trim() : '';

  if (!tieneAvatar) {
    return (
      <div
        className={`avatar avatar-${tamano} ${className} ${onClick ? 'avatar-clickeable' : ''}`}
        onClick={onClick}
        title={titulo}
      >
        <span className="avatar-iniciales">{iniciales(usuario)}</span>
      </div>
    );
  }

  return (
    <div
      className={`avatar avatar-${tamano} avatar-con-imagen ${className} ${onClick ? 'avatar-clickeable' : ''}`}
      onClick={onClick}
      title={titulo}
    >
      <img
        className="avatar-img"
        src={`/img/avatares/${usuario.avatar_id}.jpg`}
        alt={`Avatar de ${usuario.nombre ?? 'usuario'}`}
        loading="lazy"
      />
    </div>
  );
}
