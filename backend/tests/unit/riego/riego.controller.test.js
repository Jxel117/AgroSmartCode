import { jest } from '@jest/globals';

/* =========================
   MOCK SERVICES / REPOS
========================= */
jest.unstable_mockModule('../../../src/modules/riego/configuracion.service.js', () => ({
  obtenerVigente: jest.fn(),
  aplicarManual: jest.fn(),
  aplicarPerfil: jest.fn(),
  obtenerHistorial: jest.fn(),
  listarVigentesPorEmpresa: jest.fn(),
}));

jest.unstable_mockModule('../../../src/modules/riego/actuador.repository.js', () => ({
  findByParcela: jest.fn(),
  create: jest.fn(),
}));

jest.unstable_mockModule('../../../src/modules/afd/afd.repository.js', () => ({
  findOrCreateByParcela: jest.fn(),
  findTransiciones: jest.fn(),
}));

const configService = await import('../../../src/modules/riego/configuracion.service.js');
const actuadorRepo = await import('../../../src/modules/riego/actuador.repository.js');
const afdRepo = await import('../../../src/modules/afd/afd.repository.js');

const controller = await import('../../../src/modules/riego/riego.controller.js');

describe('Configuracion Controller - caja blanca', () => {

  beforeEach(() => jest.clearAllMocks());

  /* =========================
     OBTENER CONFIG
  ========================== */
  test('obtenerConfig retorna configuracion vigente', async () => {
    configService.obtenerVigente.mockResolvedValue({ id: 1 });

    const req = { params: { parcelaId: 'p1' } };
    const res = { json: jest.fn() };

    await controller.obtenerConfig(req, res);

    expect(configService.obtenerVigente).toHaveBeenCalledWith('p1');
    expect(res.json).toHaveBeenCalledWith({
      configuracion: { id: 1 }
    });
  });

  /* =========================
     APLICAR MANUAL
  ========================== */
  test('aplicarManual retorna configuracion creada (201)', async () => {
    configService.aplicarManual.mockResolvedValue({ id: 10 });

    const req = {
      params: { parcelaId: 'p1' },
      body: { umin: 10 }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await controller.aplicarManual(req, res);

    expect(configService.aplicarManual).toHaveBeenCalledWith('p1', { umin: 10 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      configuracion: { id: 10 }
    });
  });

  /* =========================
     APLICAR PERFIL
  ========================== */
  test('aplicarPerfil retorna configuracion desde perfil', async () => {
    configService.aplicarPerfil.mockResolvedValue({ id: 20 });

    const req = {
      params: { parcelaId: 'p1' },
      body: { perfilId: 'perfil-1' }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await controller.aplicarPerfil(req, res);

    expect(configService.aplicarPerfil).toHaveBeenCalledWith('p1', 'perfil-1');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      configuracion: { id: 20 }
    });
  });

  /* =========================
     ACTUADORES
  ========================== */
  test('estadoActuadores retorna lista', async () => {
    actuadorRepo.findByParcela.mockResolvedValue([{ id: 1 }]);

    const req = { params: { parcelaId: 'p1' } };
    const res = { json: jest.fn() };

    await controller.estadoActuadores(req, res);

    expect(actuadorRepo.findByParcela).toHaveBeenCalledWith('p1');
    expect(res.json).toHaveBeenCalledWith({
      actuadores: [{ id: 1 }]
    });
  });

  /* =========================
     CREAR ACTUADOR
  ========================== */
  test('crearActuador crea actuador', async () => {
    actuadorRepo.create.mockResolvedValue({ id: 5 });

    const req = {
      params: { parcelaId: 'p1' },
      body: { tipo: 'VALVULA' }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await controller.crearActuador(req, res);

    expect(actuadorRepo.create).toHaveBeenCalledWith({
      parcelaId: 'p1',
      tipo: 'VALVULA'
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      actuador: { id: 5 }
    });
  });

  /* =========================
     AFD
  ========================== */
  test('estadoAfd retorna afd y transiciones', async () => {
    afdRepo.findOrCreateByParcela.mockResolvedValue({ id: 1 });
    afdRepo.findTransiciones.mockResolvedValue([{ id: 10 }]);

    const req = { params: { parcelaId: 'p1' } };
    const res = { json: jest.fn() };

    await controller.estadoAfd(req, res);

    expect(afdRepo.findOrCreateByParcela).toHaveBeenCalledWith('p1');
    expect(afdRepo.findTransiciones).toHaveBeenCalledWith('p1', 50);

    expect(res.json).toHaveBeenCalledWith({
      afd: { id: 1 },
      transiciones: [{ id: 10 }]
    });
  });

  /* =========================
     HISTORIAL CONFIG
  ========================== */
  test('historialConfig retorna historial', async () => {
    configService.obtenerHistorial.mockResolvedValue([{ id: 1 }]);

    const req = { params: { parcelaId: 'p1' } };
    const res = { json: jest.fn() };

    await controller.historialConfig(req, res);

    expect(configService.obtenerHistorial).toHaveBeenCalledWith('p1');
    expect(res.json).toHaveBeenCalledWith({
      historial: [{ id: 1 }]
    });
  });

  /* =========================
     LISTAR EMPRESA
  ========================== */
  test('listarConfiguracionesEmpresa retorna datos', async () => {
    configService.listarVigentesPorEmpresa.mockResolvedValue([{ id: 1 }]);

    const req = { user: { empresa: 'emp1' } };
    const res = { json: jest.fn() };

    await controller.listarConfiguracionesEmpresa(req, res);

    expect(configService.listarVigentesPorEmpresa).toHaveBeenCalledWith('emp1');
    expect(res.json).toHaveBeenCalledWith({
      configuraciones: [{ id: 1 }]
    });
  });

});