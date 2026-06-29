import { insertBatch } from '../modules/eventos/evento.repository.js';

const BATCH_SIZE = 50;
const FLUSH_INTERVAL_MS = 3000;

let buffer = [];
let flushTimer = null;

export const batchWriter = {
  add(evento) {
    buffer.push(evento);
    if (buffer.length >= BATCH_SIZE) {
      this.flush();
    }
  },

  async flush() {
    if (buffer.length === 0) return;

    const batch = buffer.splice(0, buffer.length);
    try {
      const insertados = await insertBatch(batch);
      if (insertados > 0) {
        console.log(`[BatchWriter] ${insertados} eventos persistidos.`);
      }
    } catch (err) {
      console.error('[BatchWriter] Error al persistir batch:', err.message);
      // Devolver al buffer para reintentar en el próximo flush
      buffer.unshift(...batch);
      // Limitar el tamaño del buffer para evitar memory leaks
      if (buffer.length > 5000) {
        const descartados = buffer.length - 5000;
        buffer = buffer.slice(-5000);
        console.warn(`[BatchWriter] Buffer overflow: ${descartados} eventos descartados.`);
      }
    }
  },

  getBufferSize() {
    return buffer.length;
  },
};

// Flush periódico
flushTimer = setInterval(() => batchWriter.flush(), FLUSH_INTERVAL_MS);

// Flush al cerrar
process.on('SIGTERM', () => {
  clearInterval(flushTimer);
  batchWriter.flush();
});
process.on('SIGINT', () => {
  clearInterval(flushTimer);
  batchWriter.flush();
});
