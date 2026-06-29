-- ============================================================
-- AgroSmart - Microservicio de Auditoría
-- Migración 001: Esquema inicial
-- ============================================================

-- Tipos enumerados
DO $$ BEGIN
  CREATE TYPE categoria_evento AS ENUM (
    'AUTENTICACION', 'GESTION_USUARIO', 'GESTION_PARCELA',
    'GESTION_NODO', 'CONFIGURACION_RIEGO', 'OPERACION_AFD',
    'SISTEMA_IOT', 'REPORTE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE resultado_evento AS ENUM ('EXITO', 'FALLO', 'PARCIAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tabla principal de eventos (particionada por mes)
CREATE TABLE IF NOT EXISTS log_evento (
  id                BIGSERIAL,
  evento_id         UUID NOT NULL DEFAULT gen_random_uuid(),
  timestamp_utc     TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Actor (quién realizó la acción)
  usuario_id        UUID,
  correo_usuario    VARCHAR(150),
  rol_usuario       VARCHAR(20),
  ip_origen         INET,
  user_agent        TEXT,
  empresa_id        VARCHAR(150),

  -- Evento (qué ocurrió)
  categoria         categoria_evento NOT NULL,
  accion            VARCHAR(100) NOT NULL,
  resultado         resultado_evento NOT NULL DEFAULT 'EXITO',

  -- Recurso afectado (sobre qué)
  entidad_tipo      VARCHAR(60),
  entidad_id        TEXT,
  entidad_nombre    VARCHAR(200),

  -- Contexto adicional
  ruta_http         VARCHAR(200),
  descripcion       TEXT,
  metadatos         JSONB DEFAULT '{}',

  PRIMARY KEY (id, timestamp_utc)
) PARTITION BY RANGE (timestamp_utc);

-- Crear particiones para los próximos 12 meses dinámicamente
DO $$
DECLARE
  mes_inicio DATE;
  mes_fin DATE;
  nombre_particion TEXT;
BEGIN
  FOR i IN 0..11 LOOP
    mes_inicio := date_trunc('month', CURRENT_DATE) + (i || ' months')::INTERVAL;
    mes_fin := mes_inicio + '1 month'::INTERVAL;
    nombre_particion := 'log_evento_' || to_char(mes_inicio, 'YYYY_MM');

    IF NOT EXISTS (
      SELECT 1 FROM pg_class WHERE relname = nombre_particion
    ) THEN
      EXECUTE format(
        'CREATE TABLE %I PARTITION OF log_evento FOR VALUES FROM (%L) TO (%L)',
        nombre_particion, mes_inicio, mes_fin
      );
      RAISE NOTICE 'Partición creada: %', nombre_particion;
    END IF;
  END LOOP;
END $$;

-- Índices para consultas del dashboard
CREATE INDEX IF NOT EXISTS idx_log_empresa_ts
  ON log_evento (empresa_id, timestamp_utc DESC);

CREATE INDEX IF NOT EXISTS idx_log_usuario_ts
  ON log_evento (usuario_id, timestamp_utc DESC);

CREATE INDEX IF NOT EXISTS idx_log_categoria_ts
  ON log_evento (categoria, timestamp_utc DESC);

CREATE INDEX IF NOT EXISTS idx_log_accion
  ON log_evento (accion, timestamp_utc DESC);

CREATE INDEX IF NOT EXISTS idx_log_entidad
  ON log_evento (entidad_tipo, entidad_id);

CREATE INDEX IF NOT EXISTS idx_log_fallos
  ON log_evento (resultado, timestamp_utc DESC)
  WHERE resultado = 'FALLO';

CREATE UNIQUE INDEX IF NOT EXISTS idx_log_evento_id
  ON log_evento (evento_id, timestamp_utc);

-- Vista: eventos recientes (últimos 30 días)
CREATE OR REPLACE VIEW v_eventos_recientes AS
SELECT
  id, evento_id, timestamp_utc, correo_usuario, rol_usuario,
  categoria, accion, resultado, entidad_tipo, entidad_nombre,
  ip_origen, empresa_id, descripcion, metadatos
FROM log_evento
WHERE timestamp_utc > now() - INTERVAL '30 days'
ORDER BY timestamp_utc DESC;

-- Vista: estadísticas diarias
CREATE OR REPLACE VIEW v_stats_diarias AS
SELECT
  date_trunc('day', timestamp_utc)::DATE AS dia,
  empresa_id,
  categoria,
  resultado,
  COUNT(*) AS total
FROM log_evento
WHERE timestamp_utc > now() - INTERVAL '30 days'
GROUP BY 1, 2, 3, 4
ORDER BY 1 DESC;

-- Vista: resumen por categoría
CREATE OR REPLACE VIEW v_stats_categorias AS
SELECT
  empresa_id,
  categoria,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE resultado = 'EXITO') AS exitosos,
  COUNT(*) FILTER (WHERE resultado = 'FALLO') AS fallidos,
  MIN(timestamp_utc) AS primer_evento,
  MAX(timestamp_utc) AS ultimo_evento
FROM log_evento
WHERE timestamp_utc > now() - INTERVAL '30 days'
GROUP BY 1, 2
ORDER BY total DESC;

-- Tabla de control de migraciones
CREATE TABLE IF NOT EXISTS _migraciones (
  id        SERIAL PRIMARY KEY,
  archivo   VARCHAR(255) NOT NULL UNIQUE,
  aplicada  TIMESTAMPTZ NOT NULL DEFAULT now()
);
