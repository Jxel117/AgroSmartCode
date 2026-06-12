import { jest } from '@jest/globals';

/* =========================
   MOCK SERVICE (ESM SAFE)
========================= */

jest.unstable_mockModule('../../../src/modules/nodos/nodo.service.js', () => ({
  listar: jest.fn(),
  obtener: jest.fn(),
  crear: jest.fn(),
  actualizar: jest.fn(),
  cambiarEstado: jest.fn(),
  eliminar: jest.fn(),
}));

/* =========================
   IMPORTS (DESPUÉS DE MOCKS)
========================= */

const service = await import('../../../src/modules/nodos/nodo.service.js');
const controller = await import('../../../src/modules/nodos/nodo.controller.js');

/* =========================
   MOCK RESPONSE
========================= */

const mockRes = () => {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

/* =========================
   TESTS
========================= */

describe('Nodo Controller - caja blanca', () => {

  beforeEach(() => jest.clearAllMocks());

  test('listar', async () => {
    service.listar.mockResolvedValue([{ id: 1 }]);

    const req = { user: { empresa: 'emp' } };
    const res = mockRes();

    await controller.listar(req, res);

    expect(service.listar).toHaveBeenCalledWith('emp');
    expect(res.json).toHaveBeenCalled();
  });

  test('obtener', async () => {
    service.obtener.mockResolvedValue({ id: 1 });

    const req = { params: { id: 1 } };
    const res = mockRes();

    await controller.obtener(req, res);

    expect(service.obtener).toHaveBeenCalledWith(1);
  });

  test('crear', async () => {
    service.crear.mockResolvedValue({ id: 1 });

    const req = {
      body: {},
      user: { empresa: 'emp' }
    };

    const res = mockRes();

    await controller.crear(req, res);

    expect(service.crear).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('actualizar', async () => {
    service.actualizar.mockResolvedValue({ id: 1 });

    const req = { params: { id: 1 }, body: {} };
    const res = mockRes();

    await controller.actualizar(req, res);

    expect(service.actualizar).toHaveBeenCalledWith(1, {});
  });

  test('cambiarEstado', async () => {
    service.cambiarEstado.mockResolvedValue({ id: 1 });

    const req = { params: { id: 1 }, body: { estado: 'ACTIVO' } };
    const res = mockRes();

    await controller.cambiarEstado(req, res);

    expect(service.cambiarEstado).toHaveBeenCalledWith(1, 'ACTIVO');
  });

  test('eliminar', async () => {
    service.eliminar.mockResolvedValue();

    const req = { params: { id: 1 } };
    const res = mockRes();

    await controller.eliminar(req, res);

    expect(service.eliminar).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(204);
  });

});