export default function Skeleton({ width = '100%', height = '1rem', borderRadius, style }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: borderRadius ?? 'var(--radio-xs)', ...style }}
    />
  );
}
