import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { query } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(__dirname, 'migrations');

export async function runMigrations() {
  // Asegurar que la tabla de control existe
  await query(`
    CREATE TABLE IF NOT EXISTS _migraciones (
      id        SERIAL PRIMARY KEY,
      archivo   VARCHAR(255) NOT NULL UNIQUE,
      aplicada  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const archivos = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const archivo of archivos) {
    const { rows } = await query(
      'SELECT 1 FROM _migraciones WHERE archivo = $1',
      [archivo]
    );

    if (rows.length > 0) {
      console.log(`  ✓ ${archivo} (ya aplicada)`);
      continue;
    }

    const sql = readFileSync(resolve(MIGRATIONS_DIR, archivo), 'utf-8');
    console.log(`  ▶ Aplicando ${archivo}...`);

    await query(sql);
    await query('INSERT INTO _migraciones (archivo) VALUES ($1)', [archivo]);
    console.log(`  ✓ ${archivo} aplicada correctamente.`);
  }
}

// Ejecutar directamente si se invoca como script
if (process.argv[1]?.endsWith('migrate.js')) {
  runMigrations()
    .then(() => {
      console.log('Migraciones completadas.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error en migraciones:', err);
      process.exit(1);
    });
}
