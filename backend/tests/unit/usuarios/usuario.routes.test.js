import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  query: jest.fn(),
}));

const db = await import('../../../src/db/pool.js');
const repo = await import('../../../src/modules/usuarios/usuario.repository.js');

describe('Usuario Repository - 100% coverage', () => {

  beforeEach(() => jest.clearAllMocks());

  /* =========================
     findByCorreo
  ========================== */
  test('findByCorreo retorna usuario', async () => {
    db.query.mockResolvedValue({ rows: [{ id_usuario: 1 }] });

    const res = await repo.findByCorreo('a@mail.com');

    expect(res).toEqual({ id_usuario: 1 });
  });

  test('findByCorreo retorna null', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await repo.findByCorreo('x@mail.com');

    expect(res).toBeNull();
  });

  /* =========================
     findByCorreoValidacion
  ========================== */
  test('findByCorreoValidacion retorna usuario', async () => {
    db.query.mockResolvedValue({ rows: [{ id_usuario: 1 }] });

    const res = await repo.findByCorreoValidacion('token');

    expect(res).toEqual({ id_usuario: 1 });
  });

  test('findByCorreoValidacion null', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await repo.findByCorreoValidacion('token');

    expect(res).toBeNull();
  });

  /* =========================
     findByGoogleId
  ========================== */
  test('findByGoogleId retorna usuario', async () => {
    db.query.mockResolvedValue({ rows: [{ id_usuario: 1 }] });

    const res = await repo.findByGoogleId('gid');

    expect(res).toEqual({ id_usuario: 1 });
  });

  test('findByGoogleId null', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await repo.findByGoogleId('gid');

    expect(res).toBeNull();
  });

  /* =========================
     findById + null branch
  ========================== */
  test('findById retorna usuario', async () => {
    db.query.mockResolvedValue({ rows: [{ id_usuario: 10 }] });

    const res = await repo.findById('10');

    expect(res.id_usuario).toBe(10);
  });

  test('findById null', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await repo.findById('10');

    expect(res).toBeNull();
  });

  /* =========================
     findByIdConHash
  ========================== */
  test('findByIdConHash retorna data', async () => {
    db.query.mockResolvedValue({ rows: [{ contra_hash: 'x' }] });

    const res = await repo.findByIdConHash('1');

    expect(res.contra_hash).toBe('x');
  });

  /* =========================
     findAll (FULL BRANCH COVERAGE)
  ========================== */
  test('findAll con empresa', async () => {
    db.query.mockResolvedValue({ rows: [{ id_usuario: 1 }] });

    const res = await repo.findAll('emp1');

    expect(res).toEqual([{ id_usuario: 1 }]);
  });

  test('findAll null empresa branch', async () => {
    db.query.mockResolvedValue({ rows: [{ id_usuario: 2 }] });

    const res = await repo.findAll(null);

    expect(res).toEqual([{ id_usuario: 2 }]);
  });

  test('findAll undefined empresa branch', async () => {
    db.query.mockResolvedValue({ rows: [{ id_usuario: 3 }] });

    const res = await repo.findAll(undefined);

    expect(res).toEqual([{ id_usuario: 3 }]);
  });

  /* =========================
     create
  ========================== */
  test('create usuario', async () => {
    db.query.mockResolvedValue({ rows: [{ id_usuario: 1 }] });

    const res = await repo.create({
      nombre: 'a',
      apellido: 'b',
      correo: 'c',
      correoValidacion: 'v',
      contraHash: 'h',
      rol: 'AGRICULTOR',
      empresaIdentificador: 'emp'
    });

    expect(res.id_usuario).toBe(1);
  });

  /* =========================
     update
  ========================== */
  test('update ok', async () => {
    db.query.mockResolvedValue({ rows: [{ id_usuario: 1 }] });

    const res = await repo.update('1', { nombre: 'x', apellido: 'y' });

    expect(res.id_usuario).toBe(1);
  });

  test('update null', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await repo.update('1', { nombre: 'x', apellido: 'y' });

    expect(res).toBeNull();
  });

  /* =========================
     updateEstado
  ========================== */
  test('updateEstado ok', async () => {
    db.query.mockResolvedValue({ rows: [{ id_usuario: 1 }] });

    const res = await repo.updateEstado('1', 'ACTIVA');

    expect(res.id_usuario).toBe(1);
  });

  test('updateEstado null', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await repo.updateEstado('1', 'ACTIVA');

    expect(res).toBeNull();
  });

  /* =========================
     remove (branches)
  ========================== */
  test('remove true', async () => {
    db.query.mockResolvedValue({ rowCount: 1 });

    const res = await repo.remove('1');

    expect(res).toBe(true);
  });

  test('remove false', async () => {
    db.query.mockResolvedValue({ rowCount: 0 });

    const res = await repo.remove('1');

    expect(res).toBe(false);
  });

  /* =========================
     existeAlgunAdmin
  ========================== */
  test('admin true', async () => {
    db.query.mockResolvedValue({ rows: [{}] });

    const res = await repo.existeAlgunAdmin();

    expect(res).toBe(true);
  });

  test('admin false', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await repo.existeAlgunAdmin();

    expect(res).toBe(false);
  });

  /* =========================
     password update
  ========================== */
  test('actualizarPassword ejecuta', async () => {
    db.query.mockResolvedValue({});

    await repo.actualizarPassword('1', 'hash');

    expect(db.query).toHaveBeenCalled();
  });

  /* =========================
     intentos fallidos (CRITICAL BRANCH)
  ========================== */
  test('incrementarIntentosFallidos con valor', async () => {
    db.query.mockResolvedValue({ rows: [{ intentos_fallidos: 5 }] });

    const res = await repo.incrementarIntentosFallidos('1');

    expect(res).toBe(5);
  });

  test('incrementarIntentosFallidos undefined -> 0 branch', async () => {
    db.query.mockResolvedValue({ rows: [{}] });

    const res = await repo.incrementarIntentosFallidos('1');

    expect(res).toBe(0);
  });

  /* =========================
     bloqueo
  ========================== */
  test('bloquear', async () => {
    db.query.mockResolvedValue({});

    await repo.bloquear('1');

    expect(db.query).toHaveBeenCalled();
  });

  test('desbloquear', async () => {
    db.query.mockResolvedValue({});

    await repo.desbloquear('1');

    expect(db.query).toHaveBeenCalled();
  });

  test('resetearIntentos', async () => {
    db.query.mockResolvedValue({});

    await repo.resetearIntentos('1');

    expect(db.query).toHaveBeenCalled();
  });

  /* =========================
     agricultores (FULL BRANCH)
  ========================== */
  test('findAgricultores con empresa', async () => {
    db.query.mockResolvedValue({ rows: [{ id_usuario: 1 }] });

    const res = await repo.findAgricultores('emp1');

    expect(res).toEqual([{ id_usuario: 1 }]);
  });

  test('findAgricultores sin empresa', async () => {
    db.query.mockResolvedValue({ rows: [{ id_usuario: 2 }] });

    const res = await repo.findAgricultores(null);

    expect(res).toEqual([{ id_usuario: 2 }]);
  });

  /* =========================
   FIX LINEA 43 (findAll / findAgricultores)
========================= */

test('findAll null + undefined branch', async () => {
  db.query.mockResolvedValue({ rows: [{ id_usuario: 1 }] });

  await repo.findAll(null);
  await repo.findAll(undefined);

  expect(db.query).toHaveBeenCalled();
});

test('findAgricultores null + undefined branch', async () => {
  db.query.mockResolvedValue({ rows: [{ id_usuario: 1 }] });

  await repo.findAgricultores(null);
  await repo.findAgricultores(undefined);

  expect(db.query).toHaveBeenCalled();
});

/* =========================
   FIX LINEA 137 (?? + ?.)
========================= */

test('incrementarIntentosFallidos full branch coverage', async () => {

  db.query.mockResolvedValueOnce({ rows: [{ intentos_fallidos: 5 }] });
  expect(await repo.incrementarIntentosFallidos('1')).toBe(5);

  db.query.mockResolvedValueOnce({ rows: [{}] });
  expect(await repo.incrementarIntentosFallidos('1')).toBe(0);

  db.query.mockResolvedValueOnce({ rows: [] });
  expect(await repo.incrementarIntentosFallidos('1')).toBe(0);
});

});