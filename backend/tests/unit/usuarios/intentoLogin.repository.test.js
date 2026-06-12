import { jest } from '@jest/globals';

/* =========================
   MOCK DB
========================= */
jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  query: jest.fn(),
}));

const db = await import('../../../src/db/pool.js');
const repo = await import('../../../src/modules/usuarios/intentoLogin.repository.js');

describe('IntentoLogin Repository - 100% branches', () => {

  beforeEach(() => jest.clearAllMocks());

  /* =========================
     CASO 1: éxito (motivo null por defecto)
  ========================== */
  test('registra intento exitoso sin motivo', async () => {

    db.query.mockResolvedValue({});

    await repo.registrar({
      correo: 'user@test.com',
      ip: '127.0.0.1',
      exitoso: true
      // motivoFallo no enviado → default null
    });

    expect(db.query).toHaveBeenCalledTimes(1);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO intento_login'),
      ['user@test.com', '127.0.0.1', true, null]
    );
  });

  /* =========================
     CASO 2: fallo con motivo explícito
  ========================== */
  test('registra intento fallido con motivo', async () => {

    db.query.mockResolvedValue({});

    await repo.registrar({
      correo: 'fail@test.com',
      ip: '192.168.1.10',
      exitoso: false,
      motivoFallo: 'PASSWORD_INCORRECTA'
    });

    expect(db.query).toHaveBeenCalledTimes(1);

    const args = db.query.mock.calls[0][1];

    expect(args[2]).toBe(false);
    expect(args[3]).toBe('PASSWORD_INCORRECTA');
  });

  /* =========================
     CASO 3: fallback explícito null (rama default)
  ========================== */
  test('usa null cuando motivoFallo es undefined', async () => {

    db.query.mockResolvedValue({});

    await repo.registrar({
      correo: 'x@test.com',
      ip: '10.0.0.1',
      exitoso: false,
      motivoFallo: undefined // fuerza rama default = null
    });

    const args = db.query.mock.calls[0][1];

    expect(args[3]).toBeNull();
  });

});