-- ============================================================
-- AgroSmart - Migracion 003: multi-tenancy en entidades de negocio
-- ============================================================

-- La parcela pertenece a la empresa del administrador que la creo
ALTER TABLE parcela ADD COLUMN empresa_identificador VARCHAR(150);
CREATE INDEX idx_parcela_empresa ON parcela (empresa_identificador);

-- El nodo hereda la empresa de su parcela (o del admin que lo crea si no tiene parcela)
ALTER TABLE nodo ADD COLUMN empresa_identificador VARCHAR(150);
CREATE INDEX idx_nodo_empresa ON nodo (empresa_identificador);

-- El perfil agronomico tambien se aisla por empresa
ALTER TABLE perfil_agronomico ADD COLUMN empresa_identificador VARCHAR(150);
CREATE INDEX idx_perfil_empresa ON perfil_agronomico (empresa_identificador);