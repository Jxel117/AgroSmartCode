import { jest } from '@jest/globals';

/* =========================
   MOCK DB
========================= */

jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  query: jest.fn()
}));

const db = await import('../../../src/db/pool.js');
const repo = await import('../../../src/modules/parcelas/parcela.repository.js');

describe('Parcela Repository - caja blanca completa', () => {

  beforeEach(() => jest.clearAllMocks());

  /* =========================
     FIND BY EMPRESA
  ========================== */
  test('findByEmpresa retorna lista ordenada', async () => {
    db.query.mockResolvedValue({ rows: [{ id_parcela: 1 }] });

    const res = await repo.findByEmpresa('emp1');

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM parcela'),
      ['emp1']
    );

    expect(res).toEqual([{ id_parcela: 1 }]);
  });

  /* =========================
     FIND BY AGRICULTOR
  ========================== */
  test('findByAgricultor retorna parcelas asignadas', async () => {
    db.query.mockResolvedValue({ rows: [{ id_parcela: 2 }] });

    const res = await repo.findByAgricultor('user1');

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('JOIN parcela_asignada'),
      ['user1']
    );

    expect(res.length).toBe(1);
  });

  /* =========================
     FIND BY ID
  ========================== */
  test('findById retorna parcela', async () => {
    db.query.mockResolvedValue({ rows: [{ id_parcela: 10 }] });

    const res = await repo.findById(10);

    expect(res.id_parcela).toBe(10);
  });

  test('findById retorna null si no existe', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await repo.findById(10);

    expect(res).toBeNull();
  });

  /* =========================
     CREATE
  ========================== */
  test('create retorna parcela creada', async () => {
    db.query.mockResolvedValue({ rows: [{ id_parcela: 1 }] });

    const res = await repo.create({
      nombreDescriptivo: 'A',
      tipoSuelo: 'arcilloso',
      tipoCultivo: 'maiz',
      ubicacionDescriptiva: 'campo',
      latitud: 0,
      longitud: 0,
      areaM2: 100,
      empresaIdentificador: 'emp1'
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO parcela'),
      expect.any(Array)
    );

    expect(res.id_parcela).toBe(1);
  });

  /* =========================
     UPDATE
  ========================== */
  test('update retorna parcela actualizada', async () => {
    db.query.mockResolvedValue({ rows: [{ id_parcela: 1 }] });

    const res = await repo.update(1, {
      nombreDescriptivo: 'A',
      tipoSuelo: 'arcilloso',
      tipoCultivo: 'maiz',
      ubicacionDescriptiva: 'campo',
      latitud: 1,
      longitud: 1,
      areaM2: 200,
      estado: 'ACTIVO'
    });

    expect(res.id_parcela).toBe(1);
  });

  test('update retorna null si no existe', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await repo.update(1, {});

    expect(res).toBeNull();
  });

  /* =========================
     REMOVE
  ========================== */
  test('remove retorna true si elimina', async () => {
    db.query.mockResolvedValue({ rowCount: 1 });

    const res = await repo.remove(1);

    expect(res).toBe(true);
  });

  test('remove retorna false si no elimina', async () => {
    db.query.mockResolvedValue({ rowCount: 0 });

    const res = await repo.remove(1);

    expect(res).toBe(false);
  });

  /* =========================
     ASIGNAR AGRICULTOR
  ========================== */
  test('asignarAgricultor ejecuta insert', async () => {
    db.query.mockResolvedValue({});

    await repo.asignarAgricultor(1, 2);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO parcela_asignada'),
      [2, 1]
    );
  });

  /* =========================
     DESASIGNAR AGRICULTOR
  ========================== */
  test('desasignarAgricultor ejecuta delete', async () => {
    db.query.mockResolvedValue({});

    await repo.desasignarAgricultor(1, 2);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM parcela_asignada'),
      [2, 1]
    );
  });

  /* =========================
     FIND AGRICULTORES
  ========================== */
  test('findAgricultoresAsignados retorna lista', async () => {
    db.query.mockResolvedValue({ rows: [{ id_usuario: 1 }] });

    const res = await repo.findAgricultoresAsignados(1);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM usuario'),
      [1]
    );

    expect(res.length).toBe(1);
  });

});