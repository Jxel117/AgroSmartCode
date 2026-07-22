-- La temperatura minima se guardaba como INTEGER mientras el resto de umbrales
-- (umin, umax, umin_critico, t_maximo) son NUMERIC(5,2). Esto hacia que el
-- formulario (que permite decimales, step=0.1) fallara con un error de tipo
-- al ingresar valores como 12.5.
ALTER TABLE perfil_agronomico ALTER COLUMN tmin_recomendado TYPE NUMERIC(5,2);
ALTER TABLE configuracion_riego ALTER COLUMN tmin TYPE NUMERIC(5,2);
