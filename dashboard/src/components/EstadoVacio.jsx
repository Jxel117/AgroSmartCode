export default function EstadoVacio({ titulo, descripcion, accion }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        gap: '0.75rem',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'var(--verde-50)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--verde-600)',
          marginBottom: '0.5rem',
          fontSize: '2rem',
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          <path d="M21 3v6h-6" />
          <path d="M12 8v4l2 2" />
        </svg>
      </div>
      <h3 style={{ fontSize: '1.15rem', color: 'var(--gris-900)' }}>{titulo}</h3>
      {descripcion && (
        <p style={{ fontSize: '0.92rem', color: 'var(--gris-500)', maxWidth: 400, lineHeight: 1.5 }}>
          {descripcion}
        </p>
      )}
      {accion && <div style={{ marginTop: '0.75rem' }}>{accion}</div>}
    </div>
  );
}
