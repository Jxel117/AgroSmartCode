import { ingestaSchema, parcelaParamSchema } from "../../../src/modules/lecturas/lectura.schemas.js";

describe('Lectura Schemas - Cobertura de Caminos y Líneas', () => {

  describe('ingestaSchema', () => {
    // --- CAMINOS FELICES (ÉXITO) ---
    it('Debería validar correctamente un objeto con todos los datos válidos', () => {
      const datosValidos = {
        humedad: 45.5,
        temperatura: 22.1,
        timestamp: '2026-06-12T12:00:00Z'
      };
      
      const resultado = ingestaSchema.safeParse(datosValidos);
      expect(resultado.success).toBe(true);
    });

    it('Debería ser válido solo con humedad (gracias al .refine())', () => {
      const resultado = ingestaSchema.safeParse({ humedad: 30 });
      expect(resultado.success).toBe(true);
    });

    it('Debería ser válido solo con temperatura (gracias al .refine())', () => {
      const resultado = ingestaSchema.safeParse({ temperatura: 15 });
      expect(resultado.success).toBe(true);
    });

    it('Debería permitir valores null u opcionales si se cumple el refine', () => {
      const resultado = ingestaSchema.safeParse({ humedad: null, temperatura: 20 });
      expect(resultado.success).toBe(true);
    });

    // --- CAMINOS ALTERNATIVOS (ERRORES / BRANCHES DE VALIDACIÓN) ---
    it('Debería fallar si no se envía ni humedad ni temperatura (Camino refine = false)', () => {
      const resultado = ingestaSchema.safeParse({ timestamp: '2026-06-12T12:00:00Z' });
      
      expect(resultado.success).toBe(false);
      expect(resultado.error.issues[0].message).toBe('Debe incluir al menos humedad o temperatura');
    });

    it('Debería fallar si los valores numéricos exceden los límites máximos', () => {
      const resultado = ingestaSchema.safeParse({
        humedad: 151, // Max 150
        temperatura: 101 // Max 100
      });

      expect(resultado.success).toBe(false);
      expect(resultado.error.issues).toHaveLength(2); // Dos errores de validación
    });

    it('Debería fallar si los valores numéricos son menores a los límites mínimos', () => {
      const resultado = ingestaSchema.safeParse({
        humedad: -51, // Min -50
        temperatura: -51 // Min -50
      });

      expect(resultado.success).toBe(false);
      expect(resultado.error.issues).toHaveLength(2);
    });

    it('Debería fallar si el formato del timestamp no es un ISO datetime válido', () => {
      const resultado = ingestaSchema.safeParse({
        temperatura: 20,
        timestamp: '12-06-2026 12:00:00' // Formato incorrecto
      });

      expect(resultado.success).toBe(false);
      expect(resultado.error.issues[0].path).toContain('timestamp');
    });
  });

  describe('parcelaParamSchema', () => {
    // --- CAMINO FELIZ ---
    it('Debería validar correctamente un UUID válido', () => {
      const idValido = { parcelaId: '123e4567-e89b-12d3-a456-426614174000' };
      const resultado = parcelaParamSchema.safeParse(idValido);
      
      expect(resultado.success).toBe(true);
    });

    // --- CAMINOS ALTERNATIVOS ---
    it('Debería fallar si el parcelaId no tiene formato UUID', () => {
      const idInvalido = { parcelaId: '123-id-invalido' };
      const resultado = parcelaParamSchema.safeParse(idInvalido);

      expect(resultado.success).toBe(false);
      // CORRECCIÓN AQUÍ: Evaluamos el código nativo de Zod para fallos de string con formato estricto
      
      expect(resultado.error.issues[0].message).toMatch(/uuid/i);
    });

    it('Debería fallar si el parcelaId no tiene formato UUID', () => {
  const idInvalido = { parcelaId: '123-id-invalido' };
  const resultado = parcelaParamSchema.safeParse(idInvalido);

  expect(resultado.success).toBe(false);

  expect(resultado.error.issues[0].path).toContain('parcelaId');
  expect(resultado.error.issues[0].message).toMatch(/uuid/i);
});
  });
});