import { crearParcelaSchema, actualizarParcelaSchema, idParamSchema, asignacionSchema } 
from '../../../src/modules/parcelas/parcela.schemas.js';

describe('Parcela Schemas - Cobertura completa', () => {

  /* =========================
     CREAR PARCELA
  ========================== */
  describe('crearParcelaSchema', () => {

    test('camino feliz (válido completo)', () => {
      const data = {
        nombreDescriptivo: 'Parcela 1',
        tipoSuelo: 'ARENOSO',
        tipoCultivo: 'HORTALIZAS',
        ubicacionDescriptiva: 'Zona norte',
        latitud: 0,
        longitud: 0,
        areaM2: 100
      };

      const res = crearParcelaSchema.safeParse(data);

      expect(res.success).toBe(true);
    });

    test('error: nombre corto (min 2)', () => {
      const res = crearParcelaSchema.safeParse({
        nombreDescriptivo: 'A',
        tipoSuelo: 'ARENOSO',
        tipoCultivo: 'HORTALIZAS'
      });

      expect(res.success).toBe(false);
      expect(res.error.issues[0].path).toContain('nombreDescriptivo');
    });

    test('error: enum tipoSuelo inválido', () => {
      const res = crearParcelaSchema.safeParse({
        nombreDescriptivo: 'Parcela',
        tipoSuelo: 'INVALIDO',
        tipoCultivo: 'HORTALIZAS'
      });

      expect(res.success).toBe(false);
      expect(res.error.issues[0].path).toContain('tipoSuelo');
    });

    test('error: latitud fuera de rango', () => {
      const res = crearParcelaSchema.safeParse({
        nombreDescriptivo: 'Parcela',
        tipoSuelo: 'ARENOSO',
        tipoCultivo: 'HORTALIZAS',
        latitud: 200
      });

      expect(res.success).toBe(false);
    });

    test('error: area negativa', () => {
      const res = crearParcelaSchema.safeParse({
        nombreDescriptivo: 'Parcela',
        tipoSuelo: 'ARENOSO',
        tipoCultivo: 'HORTALIZAS',
        areaM2: -10
      });

      expect(res.success).toBe(false);
    });

  });

  /* =========================
     ACTUALIZAR PARCELA
  ========================== */
  describe('actualizarParcelaSchema', () => {

    test('camino feliz con estado default', () => {
      const res = actualizarParcelaSchema.safeParse({
        nombreDescriptivo: 'Parcela 2',
        tipoSuelo: 'HUMIFERO',
        tipoCultivo: 'FRUTOS_ROJOS'
      });

      expect(res.success).toBe(true);
      expect(res.data.estado).toBe('ACTIVA'); // default
    });

    test('estado INACTIVA válido', () => {
      const res = actualizarParcelaSchema.safeParse({
        nombreDescriptivo: 'Parcela 2',
        tipoSuelo: 'HUMIFERO',
        tipoCultivo: 'FRUTOS_ROJOS',
        estado: 'INACTIVA'
      });

      expect(res.success).toBe(true);
      expect(res.data.estado).toBe('INACTIVA');
    });

    test('estado inválido', () => {
      const res = actualizarParcelaSchema.safeParse({
        nombreDescriptivo: 'Parcela 2',
        tipoSuelo: 'HUMIFERO',
        tipoCultivo: 'FRUTOS_ROJOS',
        estado: 'INVALIDO'
      });

      expect(res.success).toBe(false);
    });

  });

  /* =========================
     ID PARAM SCHEMA
  ========================== */
  describe('idParamSchema', () => {

    test('UUID válido', () => {
      const res = idParamSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000'
      });

      expect(res.success).toBe(true);
    });

    test('UUID inválido', () => {
      const res = idParamSchema.safeParse({
        id: '123-invalid'
      });

      expect(res.success).toBe(false);
      expect(res.error.issues[0].path).toContain('id');
    });

  });

  /* =========================
     ASIGNACION SCHEMA
  ========================== */
  describe('asignacionSchema', () => {

    test('UUID válido usuario', () => {
      const res = asignacionSchema.safeParse({
        usuarioId: '123e4567-e89b-12d3-a456-426614174000'
      });

      expect(res.success).toBe(true);
    });

    test('UUID inválido usuario', () => {
      const res = asignacionSchema.safeParse({
        usuarioId: 'bad-id'
      });

      expect(res.success).toBe(false);
      expect(res.error.issues[0].path).toContain('usuarioId');
    });

  });

});