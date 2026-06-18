import { jest } from '@jest/globals';

/* =========================
   MOCK DB
========================= */
jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  query: jest.fn(),
}));

const db = await import('../../../src/db/pool.js');
const repo = await import('../../../src/modules/riego/actuador.repository.js');

describe('Actuador Repository - caja blanca', () => {

  beforeEach(() => jest.clearAllMocks());

  /* =========================================================
     FIND BY PARCELA
  ========================================================= */
  test('findByParcela retorna lista de actuadores', async () => {

    db.query.mockResolvedValue({
      rows: [
        { id_actuador: 1, estado: 'ACTIVO' },
        { id_actuador: 2, estado: 'INACTIVO' }
      ]
    });

    const res = await repo.findByParcela('parcela-1');

    expect(db.query).toHaveBeenCalledTimes(1);

    const [sql, params] = db.query.mock.calls[0];

    expect(sql).toContain('FROM actuador');
    expect(sql).toContain('parcela_id = $1');
    expect(params).toEqual(['parcela-1']);

    expect(res).toHaveLength(2);
  });

  /* =========================================================
     CREATE
  ========================================================= */
  test('create inserta actuador y retorna fila', async () => {

    db.query.mockResolvedValue({
      rows: [{
        id_actuador: 10,
        parcela_id: 'p1',
        tipo: 'RIEGO',
        estado: 'INACTIVO'
      }]
    });

    const res = await repo.create({
      parcelaId: 'p1',
      tipo: 'RIEGO'
    });

    expect(db.query).toHaveBeenCalledTimes(1);

    const [sql, params] = db.query.mock.calls[0];

    expect(sql).toContain('INSERT INTO actuador');
    expect(params).toEqual(['p1', 'RIEGO']);

    expect(res.id_actuador).toBe(10);
  });

  /* =========================================================
     SET ESTADO - ENCENDER (rama TRUE)
  ========================================================= */
  test('setEstado encender ACTIVO y usa fecha_ultima_activacion', async () => {

    db.query.mockResolvedValue({ rowCount: 1 });

    await repo.setEstado('p1', true);

    expect(db.query).toHaveBeenCalledTimes(1);

    const [sql, params] = db.query.mock.calls[0];

    expect(sql).toContain('estado = $2');
    expect(sql).toContain('fecha_ultima_activacion = now()');
    expect(sql).not.toContain('fecha_ultima_desactivacion');

    expect(params).toEqual(['p1', 'ACTIVO']);
  });

  /* =========================================================
     SET ESTADO - APAGAR (rama FALSE)
  ========================================================= */
  test('setEstado apagar INACTIVO y usa fecha_ultima_desactivacion', async () => {

    db.query.mockResolvedValue({ rowCount: 1 });

    await repo.setEstado('p2', false);

    const [sql, params] = db.query.mock.calls[0];

    expect(sql).toContain('fecha_ultima_desactivacion = now()');
    expect(sql).not.toContain('fecha_ultima_activacion');

    expect(params).toEqual(['p2', 'INACTIVO']);
  });

});