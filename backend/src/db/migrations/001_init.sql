-- ============================================================
-- AgroSmart - Esquema inicial
-- Mapeo del diagrama de clases UML a PostgreSQL
-- ============================================================

-- ----------------------------
-- TIPOS ENUMERADOS
-- ----------------------------

CREATE TYPE estado_cuenta AS ENUM ('ACTIVA', 'SUSPENDIDA', 'ELIMINADA');
CREATE TYPE rol_usuario AS ENUM ('ADMINISTRADOR', 'AGRICULTOR');
CREATE TYPE estado_sesion AS ENUM ('ACTIVA', 'EXPIRADA', 'CERRADA_MANUALMENTE', 'REVOCADA');

CREATE TYPE tipo_suelo AS ENUM ('HUMIFERO', 'ARENOSO', 'ARCILLOSO');
CREATE TYPE tipo_cultivo AS ENUM ('HORTALIZAS', 'FRUTOS_ROJOS');
CREATE TYPE estado_parcela AS ENUM ('ACTIVA', 'INACTIVA');
CREATE TYPE estado_perfil AS ENUM ('ACTIVO', 'DESHABILITADO');

CREATE TYPE tipo_sensor AS ENUM ('HUMEDAD', 'TEMPERATURA', 'COMBINADO');
CREATE TYPE estado_nodo AS ENUM ('SIN_CONFIGURAR', 'ACTIVO', 'DESCONECTADO', 'FALLO', 'INACTIVO');

CREATE TYPE tipo_credencial AS ENUM ('X509', 'USUARIO_CONTRA');
CREATE TYPE estado_credencial AS ENUM ('ACTIVA', 'REVOCADA', 'EXPIRADA');

CREATE TYPE estado_lectura AS ENUM ('VALIDA', 'ERROR_FUERA_DE_RANGO', 'ERROR_SENSOR_SIN_RESPUESTA');

CREATE TYPE tipo_actuador AS ENUM ('RELE_BOMBA', 'ELECTROVALVULA');
CREATE TYPE estado_actuador AS ENUM ('ACTIVO', 'INACTIVO', 'FALLO');

CREATE TYPE modalidad_configuracion AS ENUM ('PERFIL_PREDETERMINADO', 'MANUAL');

CREATE TYPE dia_semana AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');
CREATE TYPE estado_programacion AS ENUM ('ACTIVA', 'PAUSADA', 'FINALIZADA');

CREATE TYPE estado_afd AS ENUM ('S0_MONITOREO', 'S1_EVALUACION', 'S2_RIEGO_ACTIVO', 'S3_RIEGO_DETENIDO', 'S4_FALLO');
CREATE TYPE simbolo_alfabeto AS ENUM (
  'A_LECTURA_VALIDA', 'B_HUMEDAD_BAJA', 'C_HUMEDAD_OK', 'D_HUMEDAD_ALTA',
  'E_HUMEDAD_SUFICIENTE', 'F_CONFIRMAR_DESACTIVACION', 'G_TIMEOUT_N',
  'H_SENSOR_RECUPERADO', 'I_RESET_MANUAL', 'J_LECTURA_RECIBIDA',
  'K_TEMPERATURA_OK', 'L_TEMPERATURA_ALTA'
);

CREATE TYPE tipo_alerta AS ENUM (
  'HUMEDAD_CRITICA_BAJA', 'TEMPERATURA_CRITICA_ALTA', 'FALLO_SENSOR',
  'FALLO_ACTUADOR', 'PERDIDA_CONECTIVIDAD'
);
CREATE TYPE severidad_alerta AS ENUM ('INFORMATIVA', 'ADVERTENCIA', 'CRITICA');
CREATE TYPE estado_alerta AS ENUM ('ACTIVA', 'LEIDA', 'RESUELTA');

CREATE TYPE tipo_periodo AS ENUM ('DIARIO', 'SEMANAL', 'MENSUAL');
CREATE TYPE formato_exportacion AS ENUM ('PDF', 'CSV');

-- ----------------------------
-- USUARIOS Y SEGURIDAD
-- ----------------------------

CREATE TABLE usuario (
  id_usuario        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre            VARCHAR(100) NOT NULL,
  apellido          VARCHAR(100) NOT NULL,
  correo            VARCHAR(150) NOT NULL UNIQUE,
  contra_hash       VARCHAR(255) NOT NULL,
  rol               rol_usuario  NOT NULL DEFAULT 'AGRICULTOR',
  estado            estado_cuenta NOT NULL DEFAULT 'ACTIVA',
  fecha_creacion    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  fecha_modificacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sesion_usuario (
  id_sesion         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id        UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  token_jwt         TEXT NOT NULL,
  fecha_inicio      TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_expiracion  TIMESTAMPTZ NOT NULL,
  estado            estado_sesion NOT NULL DEFAULT 'ACTIVA'
);

CREATE TABLE intento_login (
  id_intento        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correo_intentado  VARCHAR(150) NOT NULL,
  fecha             TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_origen         VARCHAR(45),
  exitoso           BOOLEAN NOT NULL,
  motivo_fallo      VARCHAR(200)
);

-- ----------------------------
-- PERFILES AGRONOMICOS
-- ----------------------------

CREATE TABLE perfil_agronomico (
  id_perfil               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_suelo              tipo_suelo   NOT NULL,
  tipo_cultivo            tipo_cultivo NOT NULL,
  umin_recomendado        NUMERIC(5,2) NOT NULL,
  umax_recomendado        NUMERIC(5,2) NOT NULL,
  umin_critico_recomendado NUMERIC(5,2) NOT NULL,
  t_maximo_recomendado    NUMERIC(5,2) NOT NULL,
  tmin_recomendado        INTEGER      NOT NULL,
  descripcion_agronomica  TEXT,
  fuente_referencia       VARCHAR(255),
  estado                  estado_perfil NOT NULL DEFAULT 'ACTIVO',
  fecha_creacion          TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_modificacion      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tipo_suelo, tipo_cultivo)
);

-- ----------------------------
-- PARCELAS
-- ----------------------------

CREATE TABLE parcela (
  id_parcela          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_descriptivo  VARCHAR(150) NOT NULL,
  tipo_suelo          tipo_suelo   NOT NULL,
  tipo_cultivo        tipo_cultivo NOT NULL,
  ubicacion_descriptiva VARCHAR(255),
  latitud             NUMERIC(9,6),
  longitud            NUMERIC(9,6),
  area_m2             NUMERIC(10,2),
  estado              estado_parcela NOT NULL DEFAULT 'ACTIVA',
  fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_modificacion  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Relacion Agricultor <-> Parcela (parcelasAsignadas, muchos a muchos)
CREATE TABLE parcela_asignada (
  usuario_id  UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  parcela_id  UUID NOT NULL REFERENCES parcela(id_parcela) ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, parcela_id)
);

CREATE TABLE historial_aplicacion_perfil (
  id_aplicacion    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcela_id       UUID NOT NULL REFERENCES parcela(id_parcela) ON DELETE CASCADE,
  perfil_id        UUID NOT NULL REFERENCES perfil_agronomico(id_perfil),
  fecha_aplicacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------
-- NODOS Y CREDENCIALES
-- ----------------------------

CREATE TABLE nodo (
  id_nodo                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcela_id              UUID REFERENCES parcela(id_parcela) ON DELETE SET NULL,
  tipo_sensor             tipo_sensor NOT NULL,
  modelo_hardware         VARCHAR(120),
  ubicacion_descriptiva   VARCHAR(255),
  latitud                 NUMERIC(9,6),
  longitud                NUMERIC(9,6),
  protocolo_comunicacion  VARCHAR(50) DEFAULT 'MQTT',
  estado                  estado_nodo NOT NULL DEFAULT 'SIN_CONFIGURAR',
  fecha_registro          TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_ultima_lectura    TIMESTAMPTZ
);

CREATE TABLE credencial_nodo (
  id_credencial     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nodo_id           UUID NOT NULL REFERENCES nodo(id_nodo) ON DELETE CASCADE,
  tipo_credencial   tipo_credencial NOT NULL,
  identificador     VARCHAR(150) NOT NULL UNIQUE,
  secreto_hash      VARCHAR(255) NOT NULL,
  fecha_emision     TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_revocacion  TIMESTAMPTZ,
  estado            estado_credencial NOT NULL DEFAULT 'ACTIVA'
);

-- ----------------------------
-- ACTUADORES
-- ----------------------------

CREATE TABLE actuador (
  id_actuador               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcela_id                UUID REFERENCES parcela(id_parcela) ON DELETE SET NULL,
  tipo                      tipo_actuador NOT NULL,
  estado                    estado_actuador NOT NULL DEFAULT 'INACTIVO',
  fecha_ultima_activacion   TIMESTAMPTZ,
  fecha_ultima_desactivacion TIMESTAMPTZ
);

-- ----------------------------
-- LECTURAS (telemetria)
-- ----------------------------

CREATE TABLE lectura (
  id_lectura      BIGSERIAL PRIMARY KEY,
  nodo_id         UUID NOT NULL REFERENCES nodo(id_nodo) ON DELETE CASCADE,
  humedad         NUMERIC(5,2),
  temperatura     NUMERIC(5,2),
  timestamp_utc   TIMESTAMPTZ NOT NULL DEFAULT now(),
  estado_lectura  estado_lectura NOT NULL DEFAULT 'VALIDA'
);

CREATE INDEX idx_lectura_nodo_tiempo ON lectura (nodo_id, timestamp_utc DESC);

-- ----------------------------
-- CONFIGURACION Y PROGRAMACION DE RIEGO
-- ----------------------------

CREATE TABLE configuracion_riego (
  id_configuracion        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcela_id              UUID NOT NULL REFERENCES parcela(id_parcela) ON DELETE CASCADE,
  umin                    NUMERIC(5,2) NOT NULL,
  umax                    NUMERIC(5,2) NOT NULL,
  umin_critico            NUMERIC(5,2) NOT NULL,
  t_maximo                NUMERIC(5,2) NOT NULL,
  tmin                    INTEGER NOT NULL,
  n_intentos_fallidos_max INTEGER NOT NULL DEFAULT 3,
  modalidad_configuracion modalidad_configuracion NOT NULL DEFAULT 'MANUAL',
  perfil_id               UUID REFERENCES perfil_agronomico(id_perfil),
  fecha_aplicacion        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE programacion_riego (
  id_programacion  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcela_id       UUID NOT NULL REFERENCES parcela(id_parcela) ON DELETE CASCADE,
  dia_semana       dia_semana NOT NULL,
  hora_inicio      TIME NOT NULL,
  duracion_minutos INTEGER NOT NULL,
  estado           estado_programacion NOT NULL DEFAULT 'ACTIVA',
  fecha_creacion   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------
-- AUTOMATA FINITO DETERMINISTA (AFD)
-- ----------------------------

CREATE TABLE afd_instancia (
  id_afd                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcela_id                  UUID NOT NULL REFERENCES parcela(id_parcela) ON DELETE CASCADE,
  estado_actual               estado_afd NOT NULL DEFAULT 'S0_MONITOREO',
  contador_intentos_fallidos  INTEGER NOT NULL DEFAULT 0,
  n_intentos_fallidos_max     INTEGER NOT NULL DEFAULT 3,
  fecha_ultimo_cambio_estado  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE transicion_afd (
  id_transicion           BIGSERIAL PRIMARY KEY,
  afd_id                  UUID NOT NULL REFERENCES afd_instancia(id_afd) ON DELETE CASCADE,
  estado_origen           estado_afd NOT NULL,
  estado_destino          estado_afd NOT NULL,
  simbolo_disparador      simbolo_alfabeto NOT NULL,
  timestamp_utc           TIMESTAMPTZ NOT NULL DEFAULT now(),
  humedad_en_transicion   NUMERIC(5,2),
  temperatura_en_transicion NUMERIC(5,2),
  causa_transicion        VARCHAR(255)
);

CREATE INDEX idx_transicion_afd_tiempo ON transicion_afd (afd_id, timestamp_utc DESC);

-- ----------------------------
-- ALERTAS
-- ----------------------------

CREATE TABLE alerta (
  id_alerta         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcela_id        UUID REFERENCES parcela(id_parcela) ON DELETE CASCADE,
  nodo_id           UUID REFERENCES nodo(id_nodo) ON DELETE SET NULL,
  tipo_alerta       tipo_alerta NOT NULL,
  severidad         severidad_alerta NOT NULL,
  mensaje           VARCHAR(255) NOT NULL,
  valor_disparador  NUMERIC(6,2),
  fecha_generacion  TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_lectura     TIMESTAMPTZ,
  estado            estado_alerta NOT NULL DEFAULT 'ACTIVA'
);

CREATE INDEX idx_alerta_estado ON alerta (estado, fecha_generacion DESC);

-- ----------------------------
-- REPORTES
-- ----------------------------

CREATE TABLE reporte (
  id_reporte               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcela_id               UUID REFERENCES parcela(id_parcela) ON DELETE CASCADE,
  tipo_periodo             tipo_periodo NOT NULL,
  fecha_inicio             DATE NOT NULL,
  fecha_fin                DATE NOT NULL,
  humedad_min              NUMERIC(5,2),
  humedad_max              NUMERIC(5,2),
  humedad_promedio         NUMERIC(5,2),
  temperatura_min          NUMERIC(5,2),
  temperatura_max          NUMERIC(5,2),
  temperatura_promedio     NUMERIC(5,2),
  num_activaciones_riego   INTEGER DEFAULT 0,
  duracion_total_riego_min INTEGER DEFAULT 0,
  fecha_generacion         TIMESTAMPTZ NOT NULL DEFAULT now(),
  formato_exportacion      formato_exportacion
);