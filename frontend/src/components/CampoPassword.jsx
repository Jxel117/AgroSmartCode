import { useState } from 'react';

export default function CampoPassword({
  id,
  value,
  onChange,
  placeholder = '••••••••',
  required = false,
  autoFocus = false,
  label,
  sinLabel = false,
}) {
  const [mostrar, setMostrar] = useState(false);

  const input = (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type={mostrar ? 'text' : 'password'}
        value={value}
        required={required}
        autoFocus={autoFocus}
        onChange={onChange}
        placeholder={placeholder}
        style={{ width: '100%', paddingRight: '2.6rem' }}
      />
      <button
        type="button"
        onClick={() => setMostrar((v) => !v)}
        aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        style={{
          position: 'absolute',
          right: '0.5rem',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '0.3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--gris-500)',
        }}
      >
        {mostrar ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );

  // Modo "sin label": devuelve solo el input para ser usado dentro de <Campo>
  if (sinLabel) return input;

  // Modo standalone: con su propio wrapper y label
  return (
    <div className="campo">
      {label && <label htmlFor={id}>{label}</label>}
      {input}
    </div>
  );
}