import { useState } from 'react';
import { iniciales } from '../utils/avatar.js';
import './Avatar.css';

/**
 * Icono SVG minimalista de silueta humana (fallback default).
 */
function IconoSilueta({ rol }) {
  const esAdmin = rol === 'ADMINISTRADOR';
  return (
    <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="avatar-svg" aria-hidden="true">
      <circle cx="256" cy="256" r="240" stroke="currentColor" strokeWidth="18" fill="none" />
      <circle cx="256" cy="200" r="70" stroke="currentColor" strokeWidth="18" fill="none" />
      <path d="M 116 420 C 116 350 175 295 256 295 C 337 295 396 350 396 420"
        stroke="currentColor" strokeWidth="18" fill="none" strokeLinecap="round" />
      {esAdmin && (
        <path d="M 250 320 L 256 380 L 262 320"
          stroke="currentColor" strokeWidth="10" fill="none" strokeLinejoin="round" />
      )}
    </svg>
  );
}

/**
 * Avatar circular del usuario.
 * - Si tiene avatar_id valido, muestra el SVG del catalogo.
 * - Si no, muestra silueta SVG por defecto.
 * - Si la imagen falla, fallback a iniciales.
 */
export default function Avatar({ usuario, tamano = 'md', className = '', onClick }) {
  const [errorImagen, setErrorImagen] = useState(false);

  const tieneAvatar = usuario?.avatar_id && !errorImagen;

  return (
    <div
      className={`avatar avatar-${tamano} ${className} ${onClick ? 'avatar-clickeable' : ''}`}
      onClick={onClick}
      title={usuario ? `${usuario.nombre ?? ''} ${usuario.apellido ?? ''}`.trim() : ''}
    >
      {tieneAvatar ? (
        <img
          src={`/img/avatares/${usuario.avatar_id}.jpg`}
          alt={`Avatar de ${usuario.nombre ?? 'usuario'}`}
          onError={() => setErrorImagen(true)}
          loading="lazy"
        />
      ) : errorImagen ? (
        <span className="avatar-iniciales">{iniciales(usuario)}</span>
      ) : (
        <IconoSilueta rol={usuario?.rol} />
      )}
    </div>
  );
}