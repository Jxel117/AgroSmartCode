import { createApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import { iniciarMqtt, cerrarMqtt } from './mqtt/client.js';
import { iniciarRealtime, cerrarRealtime } from './realtime/index.js';
import { conectarAuditoria, cerrarAuditoria } from './audit/audit.emitter.js';

const app = createApp();
const server = app.listen(env.port, () => {
  console.log(`AgroSmart API escuchando en http://localhost:${env.port}`);
  console.log(`Entorno: ${env.nodeEnv}`);
});

// Iniciar WebSocket sobre el servidor HTTP
iniciarRealtime(server);

// Iniciar MQTT (cliente al broker)
iniciarMqtt();

// Iniciar auditoría (conexión a RabbitMQ)
conectarAuditoria();

// Cierre ordenado
async function shutdown(signal) {
  console.log(`\n${signal} recibido. Cerrando servidor...`);
  server.close(async () => {
    await cerrarRealtime();
    await cerrarMqtt();
    await cerrarAuditoria();
    await pool.end();
    console.log('Conexiones cerradas. Adios.');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));