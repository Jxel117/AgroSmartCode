import { jest } from '@jest/globals';

/* =========================
   MOCK DB
========================= */
jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  query: jest.fn(),
}));

const db = await import('../../../src/db/pool.js');
const repo = await import('../../../src/modules/reportes/reporte.repository.js');

describe('Reporte Repository - caja blanca', () => {

  beforeEach(() => jest.clearAllMocks());

  /* =========================
     ESTADISTICAS LECTURAS
  ========================== */
  test('estadisticasLecturas ejecuta query y retorna fila', async () => {

    db.query.mockResolvedValue({
      rows: [{
        humedad_min: 10,
        humedad_max: 80,
        humedad_promedio: 45,
        temperatura_min: 15,
        temperatura_max: 35,
        temperatura_promedio: 25,
        total_lecturas: 5
      }]
    });

    const res = await repo.estadisticasLecturas(
      'parcela-1',
      '2026-01-01',
      '2026-01-31'
    );

    expect(db.query).toHaveBeenCalledTimes(1);

    expect(db.query.mock.calls[0][1]).toEqual([
      'parcela-1',
      '2026-01-01',
      '2026-01-31'
    ]);

    expect(res.total_lecturas).toBe(5);
  });

  /* =========================
     ACTIVACIONES RIEGO
  ========================== */
  test('activacionesRiego retorna número parseado', async () => {

    db.query.mockResolvedValue({
      rows: [{ num_activaciones: '7' }]
    });

    const res = await repo.activacionesRiego(
      'parcela-1',
      '2026-01-01',
      '2026-01-31'
    );

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('S2_RIEGO_ACTIVO'),
      ['parcela-1', '2026-01-01', '2026-01-31']
    );

    expect(res).toBe(7);
  });

  /* =========================
     GUARDAR REPORTE
  ========================== */
  test('guardar inserta reporte y retorna id', async () => {

    db.query.mockResolvedValue({
      rows: [{ id_reporte: 'rep-1' }]
    });

    const data = {
      parcelaId: 'p1',
      tipoPeriodo: 'MENSUAL',
      fechaInicio: '2026-01-01',
      fechaFin: '2026-01-31',
      humedadMin: 10,
      humedadMax: 80,
      humedadPromedio: 45,
      temperaturaMin: 15,
      temperaturaMax: 35,
      temperaturaPromedio: 25,
      numActivaciones: 3,
      formatoExportacion: 'PDF'
    };

    const res = await repo.guardar(data);

    expect(db.query).toHaveBeenCalledTimes(1);

    const params = db.query.mock.calls[0][1];

    expect(params[0]).toBe('p1');
    expect(params[10]).toBe(3);

    expect(res).toEqual({ id_reporte: 'rep-1' });
  });

});