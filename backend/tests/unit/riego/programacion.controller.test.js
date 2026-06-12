import { jest } from '@jest/globals';

/* =========================
   MOCK REPOSITORY
========================= */
jest.unstable_mockModule('../../../src/modules/riego/programacion.repository.js', () => ({
  findByParcela: jest.fn(),
  create: jest.fn(),
  updateEstado: jest.fn(),
  remove: jest.fn(),
}));

const repo = await import('../../../src/modules/riego/programacion.repository.js');
const controller = await import('../../../src/modules/riego/programacion.controller.js');

describe('Programacion Controller - caja blanca', () => {

  beforeEach(() => jest.clearAllMocks());

  /* =========================
     LISTAR
  ========================== */
  test('listar retorna programaciones por parcela', async () => {
    repo.findByParcela.mockResolvedValue([{ id: 1 }]);

    const req = { params: { parcelaId: 'p1' } };
    const res = { json: jest.fn() };

    await controller.listar(req, res);

    expect(repo.findByParcela).toHaveBeenCalledWith('p1');
    expect(res.json).toHaveBeenCalledWith({
      programaciones: [{ id: 1 }]
    });
  });

  /* =========================
     CREAR
  ========================== */
  test('crear retorna programacion creada (201)', async () => {
    repo.create.mockResolvedValue({ id: 10 });

    const req = {
      params: { parcelaId: 'p1' },
      body: { hora: '08:00' }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await controller.crear(req, res);

    expect(repo.create).toHaveBeenCalledWith({
      parcelaId: 'p1',
      hora: '08:00'
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      programacion: { id: 10 }
    });
  });

  /* =========================
     CAMBIAR ESTADO - OK
  ========================== */
  test('cambiarEstado retorna programacion actualizada', async () => {
    repo.updateEstado.mockResolvedValue({ id: 1, estado: 'ACTIVO' });

    const req = {
      params: { id: '1' },
      body: { estado: 'ACTIVO' }
    };

    const res = { json: jest.fn() };

    await controller.cambiarEstado(req, res);

    expect(repo.updateEstado).toHaveBeenCalledWith('1', 'ACTIVO');
    expect(res.json).toHaveBeenCalledWith({
      programacion: { id: 1, estado: 'ACTIVO' }
    });
  });

  /* =========================
     CAMBIAR ESTADO - NOT FOUND
  ========================== */
  test('cambiarEstado lanza error si no existe', async () => {
    repo.updateEstado.mockResolvedValue(null);

    const req = {
      params: { id: '1' },
      body: { estado: 'INACTIVO' }
    };

    const res = { json: jest.fn() };

    await expect(controller.cambiarEstado(req, res))
      .rejects
      .toThrow('Programacion no encontrada');
  });

  /* =========================
     ELIMINAR - OK
  ========================== */
  test('eliminar retorna 204 si se borra', async () => {
    repo.remove.mockResolvedValue(true);

    const req = { params: { id: '1' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    await controller.eliminar(req, res);

    expect(repo.remove).toHaveBeenCalledWith('1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  /* =========================
     ELIMINAR - NOT FOUND
  ========================== */
  test('eliminar lanza error si no existe', async () => {
    repo.remove.mockResolvedValue(false);

    const req = { params: { id: '1' } };
    const res = {
      status: jest.fn(),
      send: jest.fn()
    };

    await expect(controller.eliminar(req, res))
      .rejects
      .toThrow('Programacion no encontrada');
  });

});