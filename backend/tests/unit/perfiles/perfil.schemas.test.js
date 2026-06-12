import {
  crearPerfilSchema,
  actualizarPerfilSchema,
  idParamSchema
} from '../../../src/modules/perfiles/perfil.schemas.js';

describe('Perfil Schemas - caja blanca', () => {

  /* =========================
     CREAR PERFIL
  ========================== */
  describe('crearPerfilSchema', () => {

    test('debería validar datos correctos', () => {
      const data = {
        tipoSuelo: 'ARENOSO',
        tipoCultivo: 'HORTALIZAS',
        uminRecomendado: 20,
        umaxRecomendado: 80,
        uminCriticoRecomendado: 10,
        tMaximoRecomendado: 40,
        tminRecomendado: 5
      };

      const res = crearPerfilSchema.safeParse(data);
      expect(res.success).toBe(true);
    });

    test('debería fallar si uminCritico > umin (primer refine)', () => {
      const data = {
        tipoSuelo: 'ARENOSO',
        tipoCultivo: 'HORTALIZAS',
        uminRecomendado: 20,
        umaxRecomendado: 80,
        uminCriticoRecomendado: 30, // ❌ inválido
        tMaximoRecomendado: 40,
        tminRecomendado: 5
      };

      const res = crearPerfilSchema.safeParse(data);

      expect(res.success).toBe(false);
      expect(res.error.issues[0].path).toContain('uminCriticoRecomendado');
      expect(res.error.issues[0].message).toMatch(/menor o igual/i);
    });

    test('debería fallar si umin >= umax (segundo refine)', () => {
      const data = {
        tipoSuelo: 'ARENOSO',
        tipoCultivo: 'HORTALIZAS',
        uminRecomendado: 80,
        umaxRecomendado: 60, // ❌ inválido
        uminCriticoRecomendado: 10,
        tMaximoRecomendado: 40,
        tminRecomendado: 5
      };

      const res = crearPerfilSchema.safeParse(data);

      expect(res.success).toBe(false);
      expect(res.error.issues[0].path).toContain('uminRecomendado');
      expect(res.error.issues[0].message).toMatch(/menor que umax/i);
    });

    test('debería fallar por valores fuera de rango', () => {
      const data = {
        tipoSuelo: 'ARENOSO',
        tipoCultivo: 'HORTALIZAS',
        uminRecomendado: 200, // ❌
        umaxRecomendado: 300, // ❌
        uminCriticoRecomendado: 10,
        tMaximoRecomendado: 40,
        tminRecomendado: 5
      };

      const res = crearPerfilSchema.safeParse(data);

      expect(res.success).toBe(false);
    });

  });

  /* =========================
     ACTUALIZAR PERFIL
  ========================== */
  describe('actualizarPerfilSchema', () => {

    test('debería aceptar estado por defecto ACTIVO', () => {
      const data = {
        tipoSuelo: 'ARENOSO',
        tipoCultivo: 'HORTALIZAS',
        uminRecomendado: 20,
        umaxRecomendado: 80,
        uminCriticoRecomendado: 10,
        tMaximoRecomendado: 40,
        tminRecomendado: 5
      };

      const res = actualizarPerfilSchema.safeParse(data);

      expect(res.success).toBe(true);
      expect(res.data.estado).toBe('ACTIVO');
    });

    test('debería aceptar estado DESHABILITADO', () => {
      const data = {
        tipoSuelo: 'ARENOSO',
        tipoCultivo: 'HORTALIZAS',
        uminRecomendado: 20,
        umaxRecomendado: 80,
        uminCriticoRecomendado: 10,
        tMaximoRecomendado: 40,
        tminRecomendado: 5,
        estado: 'DESHABILITADO'
      };

      const res = actualizarPerfilSchema.safeParse(data);

      expect(res.success).toBe(true);
      expect(res.data.estado).toBe('DESHABILITADO');
    });

  });

  /* =========================
     ID PARAM
  ========================== */
  describe('idParamSchema', () => {

    test('debería validar UUID correcto', () => {
      const res = idParamSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000'
      });

      expect(res.success).toBe(true);
    });

    test('debería fallar con UUID inválido', () => {
      const res = idParamSchema.safeParse({
        id: '123-invalid'
      });

      expect(res.success).toBe(false);
      expect(res.error.issues[0].path).toContain('id');
    });

  });

});