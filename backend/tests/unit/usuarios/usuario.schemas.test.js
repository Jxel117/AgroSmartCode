import { crearUsuarioSchema, actualizarUsuarioSchema, estadoUsuarioSchema, cambiarPasswordSchema, idParamSchema } from '../../../src/modules/usuarios/usuario.schemas.js';

describe('Usuario Schemas - validación completa', () => {

  /* =========================
     crearUsuarioSchema
  ========================== */
  test('crearUsuarioSchema válido', () => {
    const data = {
      nombre: 'Juan',
      apellido: 'Perez',
      correoValidacion: 'test@gmail.com',
      contra: 'Abc12345!',
      rol: 'AGRICULTOR',
    };

    const res = crearUsuarioSchema.parse(data);

    expect(res.nombre).toBe('Juan');
  });

  test('crearUsuarioSchema correo inválido (@gmail)', () => {
    const data = {
      nombre: 'Juan',
      apellido: 'Perez',
      correoValidacion: 'test@yahoo.com',
      contra: 'Abc12345!',
      rol: 'AGRICULTOR',
    };

    expect(() => crearUsuarioSchema.parse(data)).toThrow();
  });

  test('crearUsuarioSchema password inválida', () => {
    const data = {
      nombre: 'Juan',
      apellido: 'Perez',
      correoValidacion: 'test@gmail.com',
      contra: '123',
      rol: 'AGRICULTOR',
    };

    expect(() => crearUsuarioSchema.parse(data)).toThrow();
  });

  test('crearUsuarioSchema rol default AGRICULTOR', () => {
    const data = {
      nombre: 'Juan',
      apellido: 'Perez',
      correoValidacion: 'test@gmail.com',
      contra: 'Abc12345!',
    };

    const res = crearUsuarioSchema.parse(data);

    expect(res.rol).toBe('AGRICULTOR');
  });

  /* =========================
     actualizarUsuarioSchema
  ========================== */
  test('actualizarUsuarioSchema válido', () => {
    const data = {
      nombre: 'Juan',
      apellido: 'Perez',
    };

    const res = actualizarUsuarioSchema.parse(data);

    expect(res.nombre).toBe('Juan');
  });

  test('actualizarUsuarioSchema inválido (nombre corto)', () => {
    const data = {
      nombre: 'J',
      apellido: 'Perez',
    };

    expect(() => actualizarUsuarioSchema.parse(data)).toThrow();
  });

  /* =========================
     estadoUsuarioSchema
  ========================== */
  test('estadoUsuarioSchema válido', () => {
    const res = estadoUsuarioSchema.parse({ estado: 'ACTIVA' });

    expect(res.estado).toBe('ACTIVA');
  });

  test('estadoUsuarioSchema inválido', () => {
    expect(() =>
      estadoUsuarioSchema.parse({ estado: 'INVALIDO' })
    ).toThrow();
  });

  /* =========================
     cambiarPasswordSchema
  ========================== */
  test('cambiarPasswordSchema válido', () => {
    const res = cambiarPasswordSchema.parse({
      passwordActual: 'abc',
      passwordNueva: 'Abc12345!'
    });

    expect(res.passwordActual).toBe('abc');
  });

  test('cambiarPasswordSchema inválido password nueva', () => {
    expect(() =>
      cambiarPasswordSchema.parse({
        passwordActual: 'abc',
        passwordNueva: '123'
      })
    ).toThrow();
  });

  /* =========================
     idParamSchema
  ========================== */
  test('idParamSchema válido UUID', () => {
    const res = idParamSchema.parse({
      id: '550e8400-e29b-41d4-a716-446655440000'
    });

    expect(res.id).toBeDefined();
  });

  test('idParamSchema inválido', () => {
    expect(() =>
      idParamSchema.parse({ id: '123' })
    ).toThrow();
  });

});