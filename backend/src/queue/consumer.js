import amqp from 'amqplib';
import { env } from '../config/env.js';
import { batchWriter } from './batchWriter.js';

const QUEUE = 'auditoria.eventos';
const MAX_RETRIES = 10;
const RETRY_DELAY = 5000;

let connection = null;
let channel = null;

export async function iniciarConsumer() {
  let intentos = 0;

  while (intentos < MAX_RETRIES) {
    try {
      connection = await amqp.connect(env.rabbitmqUrl);
      channel = await connection.createChannel();

      // Cola durable: los mensajes sobreviven reinicios de RabbitMQ
      await channel.assertQueue(QUEUE, {
        durable: true,
        arguments: {
          'x-message-ttl': 7 * 24 * 60 * 60 * 1000, // 7 días TTL
        },
      });

      // Prefetch: procesa hasta 100 mensajes sin ACK simultáneamente
      channel.prefetch(100);

      channel.consume(QUEUE, (msg) => {
        if (!msg) return;

        try {
          const evento = JSON.parse(msg.content.toString());
          batchWriter.add(evento);
          channel.ack(msg);
        } catch (err) {
          console.error('[Consumer] Evento malformado, descartando:', err.message);
          // Rechazar sin reintentar (mensaje corrupto)
          channel.nack(msg, false, false);
        }
      });

      // Reconexión automática si se cierra la conexión
      connection.on('close', () => {
        console.warn('[Consumer] Conexión RabbitMQ cerrada. Reconectando en 5s...');
        setTimeout(() => iniciarConsumer(), RETRY_DELAY);
      });

      connection.on('error', (err) => {
        console.error('[Consumer] Error de conexión RabbitMQ:', err.message);
      });

      console.log(`[Consumer] Escuchando cola "${QUEUE}" en RabbitMQ.`);
      return;
    } catch (err) {
      intentos++;
      console.warn(
        `[Consumer] Intento ${intentos}/${MAX_RETRIES} fallido: ${err.message}`
      );
      if (intentos >= MAX_RETRIES) {
        throw new Error(
          `No se pudo conectar a RabbitMQ después de ${MAX_RETRIES} intentos.`
        );
      }
      await new Promise((r) => setTimeout(r, RETRY_DELAY));
    }
  }
}

// Cierre limpio
export async function cerrarConsumer() {
  await batchWriter.flush();
  if (channel) await channel.close();
  if (connection) await connection.close();
  console.log('[Consumer] Conexión RabbitMQ cerrada correctamente.');
}

process.on('SIGTERM', cerrarConsumer);
process.on('SIGINT', cerrarConsumer);
