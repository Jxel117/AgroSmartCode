-- Anade columna avatar_id a usuario para almacenar el ID del avatar elegido.
-- NULL = usuario sin avatar custom (mostrara silueta por defecto).
ALTER TABLE usuario
ADD COLUMN IF NOT EXISTS avatar_id VARCHAR(50);

COMMENT ON COLUMN usuario.avatar_id IS 'ID del avatar predefinido elegido por el usuario (ej: agricultor-1, admin-3). NULL = silueta default.';