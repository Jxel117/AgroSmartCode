import { jest } from '@jest/globals';

/* =========================
   MOCK DB (ESM CORRECTO)
========================= */

jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  query: jest.fn()
}));

const { query } = await import('../../../src/db/pool.js');

const {
  create,
  actualizarUltimaLecturaNodo,
  findRecientesPorParcela,
  findUltimaPorNodo
} = await import('../../../src/modules/lecturas/lectura.repository.js');

/* =========================
   TESTS
========================= */

describe('LECTURA REPOSITORY - caja blanca', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* =========================
     CREATE
  ========================== */
  test('create: inserta lectura y retorna fila', async () => {

    query.mockResolvedValue({
      rows: [{
        id_lectura: 1,
        nodo_id: 10,
        humedad: 80,
        temperatura: 25,
        timestamp_utc: '2026-01-01',
        estado_lectura: 'OK'
      }]
    });

    const res = await create({
      nodoId: 10,
      humedad: 80,
      temperatura: 25,
      estadoLectura: 'OK'
    });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO lectura'),
      [10, 80, 25, 'OK']
    );

    expect(res.id_lectura).toBe(1);
  });

  /* =========================
     UPDATE
  ========================== */
  test('actualizarUltimaLecturaNodo: ejecuta UPDATE', async () => {

    query.mockResolvedValue({});

    await actualizarUltimaLecturaNodo(5);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE nodo'),
      [5]
    );
  });

  /* =========================
     FIND RECENTES (PARCELA)
  ========================== */

  test('findRecientesPorParcela: retorna lista ordenada', async () => {

    query.mockResolvedValue({
      rows: [
        { id_lectura: 1 },
        { id_lectura: 2 }
      ]
    });

    const res = await findRecientesPorParcela(7, 50);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('FROM lectura l'),
      [7, 50]
    );

    expect(res).toHaveLength(2);
  });

  /* ===== BRANCH: límite por defecto ===== */
  test('findRecientesPorParcela: usa limite por defecto', async () => {

    query.mockResolvedValue({ rows: [] });

    await findRecientesPorParcela(10);

    expect(query).toHaveBeenCalledWith(
      expect.any(String),
      [10, 100]
    );
  });

  /* =========================
     FIND ULTIMA POR NODO
  ========================== */

  test('findUltimaPorNodo: retorna última lectura', async () => {

    query.mockResolvedValue({
      rows: [{
        id_lectura: 99,
        nodo_id: 10,
        humedad: 60,
        temperatura: 22,
        timestamp_utc: '2026-01-01',
        estado_lectura: 'OK'
      }]
    });

    const res = await findUltimaPorNodo(10);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('FROM lectura'),
      [10]
    );

    expect(res.id_lectura).toBe(99);
  });

  test('findUltimaPorNodo: retorna null si no hay datos', async () => {

    query.mockResolvedValue({ rows: [] });

    const res = await findUltimaPorNodo(10);

    expect(res).toBeNull();
  });

});