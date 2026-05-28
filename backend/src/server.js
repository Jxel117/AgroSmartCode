import { createApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import { iniciarMqtt, cerrarMqtt } from './mqtt/client.js';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`AgroSmart API escuchando en http://localhost:${env.port}`);
  console.log(`Entorno: ${env.nodeEnv}`);
});

iniciarMqtt();

// Cierre ordenado
async function shutdown(signal) {
  console.log(`\n${signal} recibido. Cerrando servidor...`);
  server.close(async () => {
    await cerrarMqtt();
    await pool.end();
    console.log('Conexiones cerradas. Adios.');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));