-- Nuevo rol AUDITOR: super usuario de solo lectura para el panel de
-- auditoria, con visibilidad de todas las empresas (no de monitoreo).
ALTER TYPE rol_usuario ADD VALUE IF NOT EXISTS 'AUDITOR';
