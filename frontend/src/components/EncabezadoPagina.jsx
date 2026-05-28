export default function EncabezadoPagina({ titulo, descripcion, accion }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
      <div>
        <h1 style={{ fontSize: '1.9rem' }}>{titulo}</h1>
        {descripcion && <p style={{ color: 'var(--gris-500)', marginTop: '0.25rem' }}>{descripcion}</p>}
      </div>
      {accion}
    </div>
  );
}