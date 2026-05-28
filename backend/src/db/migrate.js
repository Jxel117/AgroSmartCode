import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, 'migrations');

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migracion (
      id          SERIAL PRIMARY KEY,
      archivo     VARCHAR(255) NOT NULL UNIQUE,
      ejecutada_en TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getApplied(client) {
  const { rows } = await client.query('SELECT archivo FROM _migracion;');
  return new Set(rows.map((r) => r.archivo));
}

async function run() {
  const client = await pool.connect();
  try {
    await ensureMigrationTable(client);
    const applied = await getApplied(client);

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`- ${file} (ya aplicada, se omite)`);
        continue;
      }
      const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf-8');
      console.log(`> Aplicando ${file} ...`);
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO _migracion (archivo) VALUES ($1);', [file]);
        await client.query('COMMIT');
        count++;
        console.log(`  OK ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`  FALLO en ${file}:`, error.message);
        throw error;
      }
    }

    console.log(count === 0 ? 'No hay migraciones pendientes.' : `${count} migracion(es) aplicada(s).`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Error ejecutando migraciones:', err);
  process.exit(1);
});