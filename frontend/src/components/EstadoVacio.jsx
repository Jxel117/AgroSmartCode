import { Inbox } from 'lucide-react';

export default function EstadoVacio({
  icono: Icono = Inbox,
  titulo,
  descripcion,
  accion,
}) {
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
        }}
      >
        <Icono size={36} strokeWidth={1.5} />
      </div>
      <h3 style={{ fontSize: '1.15rem', color: 'var(--gris-900)' }}>{titulo}</h3>
      {descripcion && (
        <p
          style={{
            fontSize: '0.92rem',
            color: 'var(--gris-500)',
            maxWidth: 400,
            lineHeight: 1.5,
          }}
        >
          {descripcion}
        </p>
      )}
      {accion && <div style={{ marginTop: '0.75rem' }}>{accion}</div>}
    </div>
  );
}