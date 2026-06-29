import pg from 'pg';
import { env } from '../config/env.js';

const pool = new pg.Pool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err.message);
});

export function query(text, params) {
  return pool.query(text, params);
}

export function getPool() {
  return pool;
}

export default pool;
