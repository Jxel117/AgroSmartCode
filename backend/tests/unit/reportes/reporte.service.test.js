import { jest } from '@jest/globals';

/* =========================
   MOCK REPOSITORY
========================= */
jest.unstable_mockModule('../../../src/modules/reportes/reporte.repository.js', () => ({
  estadisticasLecturas: jest.fn(),
  activacionesRiego: jest.fn(),
  guardar: jest.fn(),
}));

const repo = await import('../../../src/modules/reportes/reporte.repository.js');
const service = await import('../../../src/modules/reportes/reporte.service.js');

describe('Reporte Service - caja blanca', () => {

  beforeEach(() => jest.clearAllMocks());

  /* =========================================================
     1. CAMINO FELIZ SIN PERSISTIR
  ========================================================= */
  test('generar retorna reporte sin guardar', async () => {

    repo.estadisticasLecturas.mockResolvedValue({
      total_lecturas: '10',
      humedad_min: 10,
      humedad_max: 80,
      humedad_promedio: 45.678,
      temperatura_min: 12,
      temperatura_max: 30,
      temperatura_promedio: 20.444,
    });

    repo.activacionesRiego.mockResolvedValue(3);

    const res = await service.generar('p1', {
      tipoPeriodo: 'DIARIO',
      fechaInicio: '2026-01-01T00:00:00Z',
      fechaFin: '2026-01-02T00:00:00Z',
      persistir: false,
    });

    expect(repo.estadisticasLecturas).toHaveBeenCalledTimes(1);
    expect(repo.activacionesRiego).toHaveBeenCalledTimes(1);
    expect(repo.guardar).not.toHaveBeenCalled();

    expect(res.totalLecturas).toBe(10);
    expect(res.numActivaciones).toBe(3);

    // redondeo
    expect(res.humedadPromedio).toBe(45.68);
    expect(res.temperaturaPromedio).toBe(20.44);

    expect(res.idReporte).toBeUndefined();
  });

  /* =========================================================
     2. CAMINO PERSISTIR = TRUE
  ========================================================= */
  test('generar guarda reporte cuando persistir=true', async () => {

    repo.estadisticasLecturas.mockResolvedValue({
      total_lecturas: '1',
      humedad_min: 1,
      humedad_max: 1,
      humedad_promedio: 1,
      temperatura_min: 1,
      temperatura_max: 1,
      temperatura_promedio: 1,
    });

    repo.activacionesRiego.mockResolvedValue(0);
    repo.guardar.mockResolvedValue({ id_reporte: 'rep-99' });

    const res = await service.generar('p2', {
      tipoPeriodo: 'MENSUAL',
      fechaInicio: '2026-01-01T00:00:00Z',
      fechaFin: '2026-01-31T00:00:00Z',
      persistir: true,
    });

    expect(repo.guardar).toHaveBeenCalledTimes(1);

    const args = repo.guardar.mock.calls[0][0];

    expect(args.parcelaId).toBe('p2');
    expect(args.numActivaciones).toBe(0);
    expect(args.tipoPeriodo).toBe('MENSUAL');

    expect(res.idReporte).toBe('rep-99');
  });

  /* =========================================================
     3. RAMA NULLS (redondeo seguro)
  ========================================================= */
  test('maneja valores null sin romper redondeo', async () => {

    repo.estadisticasLecturas.mockResolvedValue({
      total_lecturas: '0',
      humedad_min: null,
      humedad_max: null,
      humedad_promedio: null,
      temperatura_min: null,
      temperatura_max: null,
      temperatura_promedio: null,
    });

    repo.activacionesRiego.mockResolvedValue(0);

    const res = await service.generar('p3', {
      tipoPeriodo: 'DIARIO',
      fechaInicio: '2026-01-01T00:00:00Z',
      fechaFin: '2026-01-02T00:00:00Z',
    });

    expect(res.humedadMin).toBeNull();
    expect(res.temperaturaMax).toBeNull();
    expect(res.totalLecturas).toBe(0);
  });

  /* =========================================================
     4. EDGE: parseInt seguridad
  ========================================================= */
  test('convierte total_lecturas correctamente con parseInt', async () => {

    repo.estadisticasLecturas.mockResolvedValue({
      total_lecturas: '15',
      humedad_min: 1,
      humedad_max: 2,
      humedad_promedio: 1,
      temperatura_min: 1,
      temperatura_max: 2,
      temperatura_promedio: 1,
    });

    repo.activacionesRiego.mockResolvedValue(5);

    const res = await service.generar('p4', {
      tipoPeriodo: 'DIARIO',
      fechaInicio: '2026-01-01T00:00:00Z',
      fechaFin: '2026-01-02T00:00:00Z',
    });

    expect(res.totalLecturas).toBe(15);
  });

});