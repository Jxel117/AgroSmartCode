import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '..', '..', '.env') });

function required(name) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT ?? '4001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5434', 10),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME'),
  },

  rabbitmqUrl: process.env.RABBITMQ_URL ?? 'amqp://audit_user:audit_pass@localhost:5672',

  jwtSecret: required('JWT_SECRET'),

  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',

  // Retención: meses de antigüedad antes de purgar
  retentionMonths: parseInt(process.env.RETENTION_MONTHS ?? '12', 10),
};
