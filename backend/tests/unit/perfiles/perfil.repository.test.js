import { jest } from '@jest/globals';

/* =========================
   MOCK DB
========================= */
jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  query: jest.fn(),
}));

const db = await import('../../../src/db/pool.js');
const repo = await import('../../../src/modules/perfiles/perfil.repository.js');

describe('Perfil Repository - caja blanca', () => {

  beforeEach(() => jest.clearAllMocks());

  test('findAll retorna lista ordenada', async () => {
    db.query.mockResolvedValue({ rows: [{ id_perfil: 1 }] });

    const res = await repo.findAll();

    expect(db.query).toHaveBeenCalledTimes(1);

    expect(db.query.mock.calls[0][0])
      .toEqual(expect.stringContaining('FROM perfil_agronomico'));

    expect(res).toEqual([{ id_perfil: 1 }]);
  });

  test('findById retorna perfil', async () => {
    db.query.mockResolvedValue({ rows: [{ id_perfil: 10 }] });

    const res = await repo.findById(10);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id_perfil'),
      [10]
    );

    expect(res.id_perfil).toBe(10);
  });

  test('findById retorna null si no existe', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await repo.findById(10);

    expect(res).toBeNull();
  });

  test('create inserta perfil y retorna fila', async () => {
    db.query.mockResolvedValue({ rows: [{ id_perfil: 1 }] });

    const data = {
      tipoSuelo: 'ARENOSO',
      tipoCultivo: 'HORTALIZAS',
      uminRecomendado: 10,
      umaxRecomendado: 30,
      uminCriticoRecomendado: 5,
      tMaximoRecomendado: 40,
      tminRecomendado: 10,
      descripcionAgronomica: 'test',
      fuenteReferencia: 'manual'
    };

    const res = await repo.create(data);

    expect(db.query).toHaveBeenCalled();
    expect(res.id_perfil).toBe(1);
  });

  test('update retorna perfil actualizado', async () => {
    db.query.mockResolvedValue({ rows: [{ id_perfil: 1 }] });

    const res = await repo.update(1, {
      tipoSuelo: 'ARENOSO',
      tipoCultivo: 'HORTALIZAS',
      estado: 'ACTIVO'
    });

    expect(res.id_perfil).toBe(1);
  });

  test('update retorna null si no existe', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await repo.update(1, {
      tipoSuelo: 'ARENOSO',
      tipoCultivo: 'HORTALIZAS',
      estado: 'ACTIVO'
    });

    expect(res).toBeNull();
  });

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

});