-- ============================================================
-- AgroSmart - Migracion 007: activacion de cuenta por correo
-- ============================================================
--
-- Distingue "bloqueado por intentos fallidos" (recuperable por el propio
-- usuario o por el admin) de "pendiente de primera activacion" (el usuario
-- todavia no probo ser dueno de su correo Gmail via el enlace de activacion).
-- Sin esta columna, un admin podia "resetear contrasena" a un agricultor
-- recien creado y desbloquearlo sin que nunca hubiera validado su correo.

ALTER TABLE usuario ADD COLUMN cuenta_activada BOOLEAN NOT NULL DEFAULT true;
