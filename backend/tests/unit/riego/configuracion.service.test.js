import { jest } from '@jest/globals';

/* =========================
   MOCKS
========================= */
jest.unstable_mockModule('../../../src/modules/riego/configuracion.repository.js', () => ({
  findVigente: jest.fn(),
  create: jest.fn(),
  findHistorial: jest.fn(),
  findVigentesPorEmpresa: jest.fn(),
}));

jest.unstable_mockModule('../../../src/modules/perfiles/perfil.repository.js', () => ({
  findById: jest.fn(),
}));

jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  query: jest.fn(),
}));

const configRepo = await import('../../../src/modules/riego/configuracion.repository.js');
const perfilRepo = await import('../../../src/modules/perfiles/perfil.repository.js');
const db = await import('../../../src/db/pool.js');

const service = await import('../../../src/modules/riego/configuracion.service.js');

describe('Configuracion Service - caja blanca', () => {

  beforeEach(() => jest.clearAllMocks());

  /* =========================
     obtenerVigente - OK
  ========================== */
  test('obtiene configuracion vigente', async () => {
    configRepo.findVigente.mockResolvedValue({ id_configuracion: 1 });

    const res = await service.obtenerVigente('parcela-1');

    expect(configRepo.findVigente).toHaveBeenCalledWith('parcela-1');
    expect(res.id_configuracion).toBe(1);
  });

  /* =========================
     obtenerVigente - NOT FOUND
  ========================== */
  test('lanza error si no hay config vigente', async () => {
    configRepo.findVigente.mockResolvedValue(null);

    await expect(service.obtenerVigente('parcela-1'))
      .rejects
      .toThrow('La parcela no tiene configuracion de riego');
  });

  /* =========================
     aplicarManual
  ========================== */
  test('aplicarManual crea configuracion manual con defaults', async () => {
    configRepo.create.mockResolvedValue({ id_configuracion: 10 });

    const res = await service.aplicarManual('p1', {
      umin: 10,
      umax: 80,
      uminCritico: 5,
      tMaximo: 40,
      tmin: 10,
    });

    expect(configRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      parcelaId: 'p1',
      modalidadConfiguracion: 'MANUAL',
      perfilId: null,
      nIntentosFallidosMax: 3,
    }));

    expect(res.id_configuracion).toBe(10);
  });

  /* =========================
     aplicarPerfil - OK
  ========================== */
  test('aplicarPerfil crea config desde perfil y registra historial', async () => {
    perfilRepo.findById.mockResolvedValue({
      umin_recomendado: 10,
      umax_recomendado: 80,
      umin_critico_recomendado: 5,
      t_maximo_recomendado: 40,
      tmin_recomendado: 12,
    });

    configRepo.create.mockResolvedValue({ id_configuracion: 20 });
    db.query.mockResolvedValue({ rows: [] });

    const res = await service.aplicarPerfil('p1', 'perfil-1');

    expect(perfilRepo.findById).toHaveBeenCalledWith('perfil-1');
    expect(configRepo.create).toHaveBeenCalled();
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('historial_aplicacion_perfil'),
      ['p1', 'perfil-1']
    );

    expect(res.id_configuracion).toBe(20);
  });

  /* =========================
     aplicarPerfil - PERFIL NOT FOUND
  ========================== */
  test('lanza error si perfil no existe', async () => {
    perfilRepo.findById.mockResolvedValue(null);

    await expect(service.aplicarPerfil('p1', 'perfil-x'))
      .rejects
      .toThrow('Perfil no encontrado');

    expect(configRepo.create).not.toHaveBeenCalled();
  });

  /* =========================
     obtenerHistorial
  ========================== */
  test('obtenerHistorial llama repository', async () => {
    configRepo.findHistorial.mockResolvedValue([{ id: 1 }]);

    const res = await service.obtenerHistorial('p1');

    expect(configRepo.findHistorial).toHaveBeenCalledWith('p1');
    expect(res).toEqual([{ id: 1 }]);
  });

  /* =========================
     listarVigentesPorEmpresa
  ========================== */
  test('listarVigentesPorEmpresa retorna datos', async () => {
    configRepo.findVigentesPorEmpresa.mockResolvedValue([{ id: 1 }]);

    const res = await service.listarVigentesPorEmpresa('emp1');

    expect(configRepo.findVigentesPorEmpresa).toHaveBeenCalledWith('emp1');
    expect(res).toEqual([{ id: 1 }]);
  });

});