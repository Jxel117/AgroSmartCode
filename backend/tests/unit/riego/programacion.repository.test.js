import { jest } from '@jest/globals';

/* =========================
   MOCK DB
========================= */
jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  query: jest.fn(),
}));

const db = await import('../../../src/db/pool.js');
const repo = await import('../../../src/modules/riego/programacion.repository.js');

describe('Programacion Repository - caja blanca', () => {

  beforeEach(() => jest.clearAllMocks());

  /* =========================
     FIND BY PARCELA
  ========================== */
  test('findByParcela retorna lista ordenada', async () => {
    db.query.mockResolvedValue({ rows: [{ id_programacion: 1 }] });

    const res = await repo.findByParcela('p1');

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM programacion_riego'),
      ['p1']
    );

    expect(res).toEqual([{ id_programacion: 1 }]);
  });

  /* =========================
     CREATE
  ========================== */
  test('create inserta programacion y retorna fila', async () => {
    db.query.mockResolvedValue({ rows: [{ id_programacion: 10 }] });

    const data = {
      parcelaId: 'p1',
      diaSemana: 'LUNES',
      horaInicio: '08:00',
      duracionMinutos: 30
    };

    const res = await repo.create(data);

    expect(db.query).toHaveBeenCalledTimes(1);

    const params = db.query.mock.calls[0][1];

    expect(params[0]).toBe('p1');
    expect(params[1]).toBe('LUNES');
    expect(params[2]).toBe('08:00');
    expect(params[3]).toBe(30);

    expect(res).toEqual({ id_programacion: 10 });
  });

  /* =========================
     UPDATE ESTADO - OK
  ========================== */
  test('updateEstado retorna programacion actualizada', async () => {
    db.query.mockResolvedValue({
      rows: [{ id_programacion: 1, estado: 'ACTIVO' }]
    });

    const res = await repo.updateEstado(1, 'ACTIVO');

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE programacion_riego'),
      [1, 'ACTIVO']
    );

    expect(res.estado).toBe('ACTIVO');
  });

  /* =========================
     UPDATE ESTADO - NULL
  ========================== */
  test('updateEstado retorna null si no existe', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await repo.updateEstado(1, 'INACTIVO');

    expect(res).toBeNull();
  });

  /* =========================
     REMOVE - TRUE
  ========================== */
  test('remove retorna true si elimina', async () => {
    db.query.mockResolvedValue({ rowCount: 1 });

    const res = await repo.remove(1);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM programacion_riego'),
      [1]
    );

    expect(res).toBe(true);
  });

  /* =========================
     REMOVE - FALSE
  ========================== */
  test('remove retorna false si no elimina', async () => {
    db.query.mockResolvedValue({ rowCount: 0 });

    const res = await repo.remove(1);

    expect(res).toBe(false);
  });

});