const REGLAS = [
  { test: (s) => s.length >= 8, label: 'Mínimo 8 caracteres' },
  { test: (s) => /[A-Z]/.test(s), label: 'Una mayúscula' },
  { test: (s) => /[a-z]/.test(s), label: 'Una minúscula' },
  { test: (s) => /[0-9]/.test(s), label: 'Un número' },
  { test: (s) => /[^A-Za-z0-9]/.test(s), label: 'Un carácter especial' },
];

export default function MedidorPassword({ password }) {
  if (!password) return null;

  const cumplidas = REGLAS.filter((r) => r.test(password)).length;
  const porcentaje = (cumplidas / REGLAS.length) * 100;
  const color = porcentaje < 40 ? 'var(--rojo)' : porcentaje < 80 ? 'var(--ambar)' : 'var(--verde-600)';
  const etiqueta = porcentaje < 40 ? 'Débil' : porcentaje < 80 ? 'Media' : 'Fuerte';

  return (
    <div style={{ marginTop: '0.4rem' }}>
      <div style={{ height: 6, background: 'var(--gris-100)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${porcentaje}%`, height: '100%', background: color, transition: 'all 0.25s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
        <span style={{ fontSize: '0.75rem', color }}>{etiqueta}</span>
      </div>
      <ul style={{ listStyle: 'none', margin: '0.4rem 0 0', padding: 0, display: 'flex', flexWrap: 'wrap', gap: '0.3rem 0.8rem' }}>
        {REGLAS.map((r) => {
          const ok = r.test(password);
          return (
            <li key={r.label} style={{ fontSize: '0.72rem', color: ok ? 'var(--verde-600)' : 'var(--gris-500)' }}>
              {ok ? '✓' : '○'} {r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}