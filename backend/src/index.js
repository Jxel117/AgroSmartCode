import { createApp } from './app.js';
import { env } from './config/env.js';
import { runMigrations } from './db/migrate.js';
import { iniciarConsumer } from './queue/consumer.js';
import { iniciarRetention } from './jobs/retention.job.js';

async function main() {
  // 1. Ejecutar migraciones de BD
  await runMigrations();
  console.log('Migraciones ejecutadas correctamente.');

  // 2. Iniciar consumer de RabbitMQ
  await iniciarConsumer();

  // 3. Iniciar job de retención
  iniciarRetention();

  // 4. Levantar servidor Express
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Microservicio de auditoría escuchando en puerto ${env.port}`);
    console.log(`Entorno: ${env.nodeEnv}`);
  });
}

main().catch((err) => {
  console.error('Error fatal al iniciar el microservicio:', err);
  process.exit(1);
});
