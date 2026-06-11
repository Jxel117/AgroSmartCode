-- ============================================================
-- AgroSmart - Migracion 002: mejoras de seguridad y multi-tenancy
-- ============================================================

-- ----------------------------
-- Nuevas columnas en usuario
-- ----------------------------

-- Correo Gmail usado para validar identidad (via Google OAuth)
ALTER TABLE usuario ADD COLUMN correo_validacion VARCHAR(150);

-- Identificador unico de Google (sub del token OAuth). Nulo si la cuenta no se vinculo con Google.
ALTER TABLE usuario ADD COLUMN google_id VARCHAR(255) UNIQUE;

-- Identificador de empresa/terrenos para aislamiento multi-tenant.
-- Cada administrador tiene el suyo; sus agricultores heredan el mismo.
ALTER TABLE usuario ADD COLUMN empresa_identificador VARCHAR(150);

-- Control de intentos fallidos de login y bloqueo
ALTER TABLE usuario ADD COLUMN intentos_fallidos INTEGER NOT NULL DEFAULT 0;
ALTER TABLE usuario ADD COLUMN bloqueado BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE usuario ADD COLUMN fecha_bloqueo TIMESTAMPTZ;

-- ----------------------------
-- Tabla de tokens de recuperacion de contrasena
-- ----------------------------

CREATE TABLE token_recuperacion (
  id_token       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id     UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  token          VARCHAR(255) NOT NULL UNIQUE,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_expiracion TIMESTAMPTZ NOT NULL,
  usado          BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_token_recuperacion_token ON token_recuperacion (token);

-- ----------------------------
-- Indice para busquedas por empresa (multi-tenancy)
-- ----------------------------

CREATE INDEX idx_usuario_empresa ON usuario (empresa_identificador);
CREATE INDEX idx_usuario_correo_validacion ON usuario (correo_validacion);