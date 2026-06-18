import { jest } from '@jest/globals';

/* =========================
   MOCK DB
========================= */
jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  query: jest.fn(),
}));

const db = await import('../../../src/db/pool.js');
const repo = await import('../../../src/modules/usuarios/sesion.repository.js');

describe('Sesion Repository - 100% branches', () => {

  beforeEach(() => jest.clearAllMocks());

  /* =========================
     CREAR SESION
  ========================== */
  test('crearSesion inserta y retorna id_sesion', async () => {

    db.query.mockResolvedValue({
      rows: [{ id_sesion: 'ses-1' }]
    });

    const res = await repo.crearSesion({
      usuarioId: 'user-1',
      token: 'jwt-token',
      fechaExpiracion: '2026-12-31'
    });

    expect(db.query).toHaveBeenCalledTimes(1);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO sesion_usuario'),
      ['user-1', 'jwt-token', '2026-12-31']
    );

    expect(res).toEqual({ id_sesion: 'ses-1' });
  });

  /* =========================
     REVOCAR TOKEN (CASO 1)
     token válido
  ========================== */
  test('revocarPorToken ejecuta update correctamente', async () => {

    db.query.mockResolvedValue({});

    await repo.revocarPorToken('jwt-token');

    expect(db.query).toHaveBeenCalledTimes(1);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE sesion_usuario'),
      ['jwt-token']
    );
  });

  /* =========================
     REVOCAR TOKEN (CASO 2)
     asegura rama con estado ACTIVA
  ========================== */
  test('revocarPorToken solo afecta sesiones activas', async () => {

    db.query.mockResolvedValue({});

    await repo.revocarPorToken('token-2');

    const sql = db.query.mock.calls[0][0];
    const params = db.query.mock.calls[0][1];

    expect(sql).toContain("estado = 'ACTIVA'");
    expect(params[0]).toBe('token-2');
  });

});