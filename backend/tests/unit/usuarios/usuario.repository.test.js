import { jest } from '@jest/globals';

/* =========================
   MOCK DB
========================= */
jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  query: jest.fn(),
}));

const db = await import('../../../src/db/pool.js');
const repo = await import('../../../src/modules/usuarios/usuario.repository.js');

describe('Usuario Repository - caja blanca', () => {

  beforeEach(() => jest.clearAllMocks());

  /* =========================
     FIND BY CORREO
  ========================== */
  test('findByCorreo retorna usuario o null', async () => {
    db.query.mockResolvedValue({
      rows: [{ id_usuario: 1 }]
    });

    const res = await repo.findByCorreo('test@mail.com');

    expect(db.query).toHaveBeenCalled();
    expect(res.id_usuario).toBe(1);
  });

  test('findByCorreo retorna null si no existe', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await repo.findByCorreo('x@mail.com');

    expect(res).toBeNull();
  });

  /* =========================
     FIND BY CORREO VALIDACION
  ========================== */
  test('findByCorreoValidacion retorna usuario', async () => {
    db.query.mockResolvedValue({
      rows: [{ id_usuario: 1 }]
    });

    const res = await repo.findByCorreoValidacion('a@a.com');

    expect(res.id_usuario).toBe(1);
  });

  /* =========================
     FIND BY GOOGLE ID
  ========================== */
  test('findByGoogleId retorna usuario o null', async () => {
    db.query.mockResolvedValue({
      rows: [{ id_usuario: 1 }]
    });

    const res = await repo.findByGoogleId('google-1');

    expect(res.id_usuario).toBe(1);
  });

  test('findByGoogleId retorna null', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await repo.findByGoogleId('x');

    expect(res).toBeNull();
  });

  /* =========================
     FIND BY ID
  ========================== */
  test('findById retorna usuario', async () => {
    db.query.mockResolvedValue({
      rows: [{ id_usuario: 10 }]
    });

    const res = await repo.findById('10');

    expect(res.id_usuario).toBe(10);
  });

  test('findById retorna null', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await repo.findById('10');

    expect(res).toBeNull();
  });

  /* =========================
     FIND BY ID CON HASH
  ========================== */
  test('findByIdConHash retorna hash', async () => {
    db.query.mockResolvedValue({
      rows: [{ id_usuario: 1, contra_hash: 'abc' }]
    });

    const res = await repo.findByIdConHash('1');

    expect(res.contra_hash).toBe('abc');
  });

  /* =========================
     FIND ALL (BRANCH TRUE/FALSE)
  ========================== */
  test('findAll con empresa (branch TRUE)', async () => {
    db.query.mockResolvedValue({ rows: [{ id_usuario: 1 }] });

    const res = await repo.findAll('emp1');

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('empresa_identificador'),
      ['emp1']
    );

    expect(res.length).toBe(1);
  });

  test('findAll sin empresa (branch FALSE)', async () => {
    db.query.mockResolvedValue({ rows: [{ id_usuario: 2 }] });

    const res = await repo.findAll();

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY'),
    );

    expect(res.length).toBe(1);
  });

  /* =========================
     CREATE
  ========================== */
  test('create usuario', async () => {
    db.query.mockResolvedValue({
      rows: [{ id_usuario: 1 }]
    });

    const data = {
      nombre: 'a',
      apellido: 'b',
      correo: 'c',
      correoValidacion: 'cv',
      contraHash: 'h',
      rol: 'AGRICULTOR',
      empresaIdentificador: 'emp'
    };

    const res = await repo.create(data);

    expect(res.id_usuario).toBe(1);
    expect(db.query).toHaveBeenCalled();
  });

  /* =========================
     UPDATE (EXISTE / NULL)
  ========================== */
  test('update retorna usuario', async () => {
    db.query.mockResolvedValue({
      rows: [{ id_usuario: 1 }]
    });

    const res = await repo.update('1', {
      nombre: 'x',
      apellido: 'y'
    });

    expect(res.id_usuario).toBe(1);
  });

  test('update retorna null', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await repo.update('1', {
      nombre: 'x',
      apellido: 'y'
    });

    expect(res).toBeNull();
  });

  /* =========================
     UPDATE ESTADO
  ========================== */
  test('updateEstado retorna usuario', async () => {
    db.query.mockResolvedValue({
      rows: [{ id_usuario: 1 }]
    });

    const res = await repo.updateEstado('1', 'ACTIVO');

    expect(res.id_usuario).toBe(1);
  });

  /* =========================
     REMOVE (TRUE / FALSE)
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
     EXISTE ADMIN (TRUE / FALSE)
  ========================== */
  test('existeAlgunAdmin true', async () => {
    db.query.mockResolvedValue({ rows: [{}] });

    const res = await repo.existeAlgunAdmin();

    expect(res).toBe(true);
  });

  test('existeAlgunAdmin false', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await repo.existeAlgunAdmin();

    expect(res).toBe(false);
  });

  /* =========================
     INTENTOS FALLIDOS
  ========================== */
  test('incrementarIntentosFallidos', async () => {
    db.query.mockResolvedValue({
      rows: [{ intentos_fallidos: 3 }]
    });

    const res = await repo.incrementarIntentosFallidos('1');

    expect(res).toBe(3);
  });

  test('incrementarIntentos retorna 0 si undefined', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await repo.incrementarIntentosFallidos('1');

    expect(res).toBe(0);
  });

  /* =========================
     BLOQUEAR / DESBLOQUEAR / RESET
  ========================== */
  test('bloquear ejecuta query', async () => {
    db.query.mockResolvedValue({});

    await repo.bloquear('1');

    expect(db.query).toHaveBeenCalled();
  });

  test('desbloquear ejecuta query', async () => {
    db.query.mockResolvedValue({});

    await repo.desbloquear('1');

    expect(db.query).toHaveBeenCalled();
  });

  test('resetearIntentos ejecuta query', async () => {
    db.query.mockResolvedValue({});

    await repo.resetearIntentos('1');

    expect(db.query).toHaveBeenCalled();
  });

  /* =========================
     FIND AGRICULTORES (BRANCH TRUE/FALSE)
  ========================== */
  test('findAgricultores con empresa', async () => {
    db.query.mockResolvedValue({ rows: [{ id_usuario: 1 }] });

    const res = await repo.findAgricultores('emp1');

    expect(res.length).toBe(1);
  });

  test('findAgricultores sin empresa', async () => {
    db.query.mockResolvedValue({ rows: [{ id_usuario: 2 }] });

    const res = await repo.findAgricultores();

    expect(res.length).toBe(1);
  });

});