import { jest } from '@jest/globals';

/* =========================
   MOCKS (SIEMPRE PRIMERO)
========================= */

jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  query: jest.fn()
}));

jest.unstable_mockModule('node:crypto', () => ({
  randomBytes: jest.fn()
}));

/* =========================
   IMPORTS DINÁMICOS
========================= */

const pool = await import('../../../src/db/pool.js');
const crypto = await import('node:crypto');

const {
  crearToken,
  buscarTokenValido,
  marcarUsado
} = await import('../../../src/modules/auth/tokenRecuperacion.repository.js');

/* =========================
   TESTS
========================= */

describe('TOKEN RECUPERACION REPOSITORY', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('crearToken - OK', async () => {
    pool.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [{ token: 'abc123', fecha_expiracion: new Date() }]
      });

    crypto.randomBytes.mockReturnValue({
      toString: () => 'abc123'
    });

    const res = await crearToken(1);

    expect(res.token).toBe('abc123');
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  test('buscarTokenValido - no existe', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const res = await buscarTokenValido('x');

    expect(res).toBeNull();
  });

  test('buscarTokenValido - usado', async () => {
    pool.query.mockResolvedValue({
      rows: [{
        usado: true,
        fecha_expiracion: new Date(),
        id_token: 1,
        usuario_id: 1
      }]
    });

    const res = await buscarTokenValido('x');

    expect(res.motivo).toBe('YA_USADO');
  });

  test('buscarTokenValido - expirado', async () => {
    pool.query.mockResolvedValue({
      rows: [{
        usado: false,
        fecha_expiracion: new Date(Date.now() - 10000),
        id_token: 1,
        usuario_id: 1
      }]
    });

    const res = await buscarTokenValido('x');

    expect(res.motivo).toBe('EXPIRADO');
  });

  test('buscarTokenValido - válido', async () => {
    pool.query.mockResolvedValue({
      rows: [{
        usado: false,
        fecha_expiracion: new Date(Date.now() + 100000),
        id_token: 1,
        usuario_id: 1,
        nombre: 'Juan',
        correo: 'a@a.com'
      }]
    });

    const res = await buscarTokenValido('x');

    expect(res.motivo).toBeNull();
    expect(res.fila.nombre).toBe('Juan');
  });

  test('marcarUsado - update', async () => {
    pool.query.mockResolvedValue({});

    await marcarUsado(10);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE token_recuperacion'),
      [10]
    );
  });

});