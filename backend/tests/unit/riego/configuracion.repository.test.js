import { jest } from '@jest/globals';

/* =========================
   MOCK DB
========================= */
jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  query: jest.fn(),
}));

const db = await import('../../../src/db/pool.js');
const repo = await import('../../../src/modules/riego/configuracion.repository.js');

describe('Configuracion Repository - caja blanca', () => {

  beforeEach(() => jest.clearAllMocks());

  /* =========================================================
     FIND VIGENTE - FOUND
  ========================================================= */
  test('findVigente retorna última configuración', async () => {

    db.query.mockResolvedValue({
      rows: [{
        id_configuracion: 1,
        parcela_id: 'p1',
        umin: 10
      }]
    });

    const res = await repo.findVigente('p1');

    expect(db.query).toHaveBeenCalledTimes(1);

    const [sql, params] = db.query.mock.calls[0];

    expect(sql).toContain('ORDER BY fecha_aplicacion DESC');
    expect(sql).toContain('LIMIT 1');
    expect(params).toEqual(['p1']);

    expect(res.id_configuracion).toBe(1);
  });

  /* =========================================================
     FIND VIGENTE - NULL
  ========================================================= */
  test('findVigente retorna null si no existe', async () => {

    db.query.mockResolvedValue({ rows: [] });

    const res = await repo.findVigente('p1');

    expect(res).toBeNull();
  });

  /* =========================================================
     CREATE
  ========================================================= */
  test('create inserta configuración correctamente', async () => {

    db.query.mockResolvedValue({
      rows: [{
        id_configuracion: 99,
        parcela_id: 'p1'
      }]
    });

    const data = {
      parcelaId: 'p1',
      umin: 10,
      umax: 80,
      uminCritico: 5,
      tMaximo: 35,
      tmin: 10,
      nIntentosFallidosMax: 3,
      modalidadConfiguracion: 'AUTO',
      perfilId: 'perfil-1'
    };

    const res = await repo.create(data);

    expect(db.query).toHaveBeenCalledTimes(1);

    const [sql, params] = db.query.mock.calls[0];

    expect(sql).toContain('INSERT INTO configuracion_riego');
    expect(params).toEqual([
      'p1', 10, 80, 5, 35, 10, 3, 'AUTO', 'perfil-1'
    ]);

    expect(res.id_configuracion).toBe(99);
  });

  /* =========================================================
     FIND HISTORIAL - DEFAULT LIMIT
  ========================================================= */
  test('findHistorial usa límite por defecto y retorna filas', async () => {

    db.query.mockResolvedValue({
      rows: [
        { id_configuracion: 1 },
        { id_configuracion: 2 }
      ]
    });

    const res = await repo.findHistorial('p1');

    expect(db.query).toHaveBeenCalledTimes(1);

    const [sql, params] = db.query.mock.calls[0];

    expect(sql).toContain('FROM configuracion_riego');
    expect(sql).toContain('LEFT JOIN perfil_agronomico');
    expect(params).toEqual(['p1', 50]);

    expect(res).toHaveLength(2);
  });

  /* =========================================================
     FIND HISTORIAL - CUSTOM LIMIT
  ========================================================= */
  test('findHistorial respeta límite personalizado', async () => {

    db.query.mockResolvedValue({ rows: [] });

    await repo.findHistorial('p1', 10);

    const params = db.query.mock.calls[0][1];

    expect(params).toEqual(['p1', 10]);
  });

  /* =========================================================
     FIND VIGENTES POR EMPRESA
  ========================================================= */
  test('findVigentesPorEmpresa retorna configuraciones agrupadas', async () => {

    db.query.mockResolvedValue({
      rows: [
        { id_configuracion: 1, parcela_id: 'p1' }
      ]
    });

    const res = await repo.findVigentesPorEmpresa('emp1');

    expect(db.query).toHaveBeenCalledTimes(1);

    const [sql, params] = db.query.mock.calls[0];

    expect(sql).toContain('DISTINCT ON (c.parcela_id)');
    expect(sql).toContain('JOIN parcela p');
    expect(params).toEqual(['emp1']);

    expect(res[0].id_configuracion).toBe(1);
  });

});