import cron from 'node-cron';
import { query } from '../db/pool.js';
import { env } from '../config/env.js';

/**
 * Job de retención: elimina particiones más antiguas que RETENTION_MONTHS.
 * También crea particiones futuras para los próximos 3 meses.
 * Se ejecuta diariamente a las 3:00 AM.
 */
export function iniciarRetention() {
  cron.schedule('0 3 * * *', async () => {
    console.log('[Retention] Ejecutando job de retención...');

    try {
      // 1. Eliminar particiones antiguas
      const limite = new Date();
      limite.setMonth(limite.getMonth() - env.retentionMonths);
      const mesLimite = `log_evento_${limite.getFullYear()}_${String(limite.getMonth() + 1).padStart(2, '0')}`;

      const { rows: particiones } = await query(`
        SELECT tablename FROM pg_tables
        WHERE tablename LIKE 'log_evento_%'
          AND tablename < $1
        ORDER BY tablename
      `, [mesLimite]);

      for (const p of particiones) {
        console.log(`[Retention] Eliminando partición: ${p.tablename}`);
        await query(`DROP TABLE IF EXISTS ${p.tablename}`);
      }

      // 2. Crear particiones futuras (3 meses adelante)
      for (let i = 0; i < 3; i++) {
        const mesInicio = new Date();
        mesInicio.setMonth(mesInicio.getMonth() + i);
        mesInicio.setDate(1);
        mesInicio.setHours(0, 0, 0, 0);

        const mesFin = new Date(mesInicio);
        mesFin.setMonth(mesFin.getMonth() + 1);

        const nombre = `log_evento_${mesInicio.getFullYear()}_${String(mesInicio.getMonth() + 1).padStart(2, '0')}`;

        await query(`
          DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = '${nombre}') THEN
              CREATE TABLE ${nombre} PARTITION OF log_evento
              FOR VALUES FROM ('${mesInicio.toISOString().slice(0, 10)}')
              TO ('${mesFin.toISOString().slice(0, 10)}');
              RAISE NOTICE 'Partición creada: ${nombre}';
            END IF;
          END $$;
        `);
      }

      console.log('[Retention] Job completado.');
    } catch (err) {
      console.error('[Retention] Error:', err.message);
    }
  });

  console.log('[Retention] Job programado: diariamente a las 3:00 AM.');
}
