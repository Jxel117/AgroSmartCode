export function Skeleton({ width = '100%', height = '1rem', radius = 'var(--radio-xs)', style = {} }) {
  return (
    <span
      className="skeleton"
      style={{
        display: 'inline-block',
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}

export function SkeletonFilaTabla({ columnas = 5 }) {
  return (
    <tr>
      {Array.from({ length: columnas }).map((_, i) => (
        <td key={i} style={{ padding: '0.85rem 0.75rem' }}>
          <Skeleton height="0.9rem" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTarjeta() {
  return (
    <div className="tarjeta" style={{ padding: '1.35rem' }}>
      <Skeleton width="60%" height="1.1rem" style={{ marginBottom: '0.5rem' }} />
      <Skeleton width="40%" height="0.85rem" style={{ marginBottom: '1rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
        <Skeleton height="2.5rem" />
        <Skeleton height="2.5rem" />
        <Skeleton height="2.5rem" />
        <Skeleton height="2.5rem" />
      </div>
      <Skeleton height="2rem" />
    </div>
  );
}