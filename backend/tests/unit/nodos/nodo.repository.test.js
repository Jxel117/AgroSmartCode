import { jest } from '@jest/globals';

/* =========================
   MOCK DB
========================= */

jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  query: jest.fn(),
  withTransaction: jest.fn()
}));

const db = await import('../../../src/db/pool.js');
const repo = await import('../../../src/modules/nodos/nodo.repository.js');

describe('Nodo Repository - cobertura completa final', () => {

  beforeEach(() => jest.clearAllMocks());

  /* =========================
     FIND BY ID (OK + NULL BRANCH)
  ========================== */

  test('findById ok', async () => {
    db.query.mockResolvedValue({ rows: [{ id_nodo: 10 }] });

    const res = await repo.findById(10);

    expect(res.id_nodo).toBe(10);
  });

  test('findById null branch', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await repo.findById(10);

    expect(res).toBeNull();
  });

  /* =========================
     FIND BY CREDENCIAL (NULL BRANCH → FIX BRANCH 87.5)
  ========================== */

  test('findByCredencialIdentificador ok', async () => {
    db.query.mockResolvedValue({
      rows: [{ id_nodo: 1, estado_nodo: 'ACTIVO' }]
    });

    const res = await repo.findByCredencialIdentificador('abc');

    expect(res.id_nodo).toBe(1);
  });

  test('findByCredencialIdentificador null branch (CLAVE)', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await repo.findByCredencialIdentificador('abc');

    expect(res).toBeNull();
  });

  /* =========================
     UPDATE (OK + NULL BRANCH → OTRO 35)
  ========================== */

  test('update ok', async () => {
    db.query.mockResolvedValue({
      rows: [{ id_nodo: 5, estado: 'ACTIVO' }]
    });

    const res = await repo.update(5, {
      parcelaId: 1,
      tipoSensor: 't',
      modeloHardware: 'm',
      ubicacionDescriptiva: 'u',
      latitud: 1,
      longitud: 1,
      protocoloComunicacion: 'MQTT',
      estado: 'ACTIVO'
    });

    expect(res.id_nodo).toBe(5);
  });

  test('update null branch (CLAVE)', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await repo.update(1, {
      parcelaId: 1,
      tipoSensor: 't',
      modeloHardware: 'm',
      ubicacionDescriptiva: 'u',
      latitud: 1,
      longitud: 1,
      protocoloComunicacion: 'MQTT',
      estado: 'ACTIVO'
    });

    expect(res).toBeNull();
  });

  /* =========================
     ACTUALIZAR ESTADO (OK + NULL BRANCH)
  ========================== */

  test('actualizarEstado ok', async () => {
    db.query.mockResolvedValue({
      rows: [{ id_nodo: 1, estado: 'ACTIVO' }]
    });

    const res = await repo.actualizarEstado(1, 'ACTIVO');

    expect(res.estado).toBe('ACTIVO');
  });

  test('actualizarEstado null branch (CLAVE)', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await repo.actualizarEstado(1, 'INACTIVO');

    expect(res).toBeNull();
  });

  /* =========================
     REMOVE (BOTH BRANCHES)
  ========================== */

  test('remove true', async () => {
    db.query.mockResolvedValue({ rowCount: 1 });

    const res = await repo.remove(1);

    expect(res).toBe(true);
  });

  test('remove false', async () => {
    db.query.mockResolvedValue({ rowCount: 0 });

    const res = await repo.remove(1);

    expect(res).toBe(false);
  });

  /* =========================
     FIND BY PARCELA / EMPRESA (SMOKE COVER)
  ========================== */

  test('findByEmpresa', async () => {
    db.query.mockResolvedValue({ rows: [{ id_nodo: 1 }] });

    const res = await repo.findByEmpresa('emp');

    expect(res.length).toBe(1);
  });

  test('findByParcela', async () => {
    db.query.mockResolvedValue({ rows: [{ id_nodo: 2 }] });

    const res = await repo.findByParcela('parcela');

    expect(res.length).toBe(1);
  });

  /* =========================
     TRANSACTION (CREATE)
  ========================== */

  test('createConCredencial branch completo', async () => {

    const fakeClient = { query: jest.fn() };

    db.withTransaction.mockImplementation(async (cb) => cb(fakeClient));

    fakeClient.query
      .mockResolvedValueOnce({ rows: [{ id_nodo: 99 }] })
      .mockResolvedValueOnce({});

    const res = await repo.createConCredencial(
      {
        parcelaId: 1,
        tipoSensor: 't',
        modeloHardware: 'm',
        ubicacionDescriptiva: 'u',
        latitud: 1,
        longitud: 1,
        protocoloComunicacion: 'MQTT',
        empresaIdentificador: 'emp'
      },
      {
        identificador: 'abc',
        secretoHash: 'hash'
      }
    );

    expect(res.id_nodo).toBe(99);
  });

});