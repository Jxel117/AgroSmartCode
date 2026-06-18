import { jest } from '@jest/globals';

/* =========================
   MOCK SERVICE
========================= */

jest.unstable_mockModule('../../../src/modules/lecturas/lectura.service.js', () => ({
  ingestar: jest.fn(),
  lecturasRecientes: jest.fn()
}));

/* =========================
   IMPORTS
========================= */

const service = await import(
  '../../../src/modules/lecturas/lectura.service.js'
);

const {
  ingestar,
  recientes
} = await import(
  '../../../src/modules/lecturas/lectura.controller.js'
);

const { AppError } = await import(
  '../../../src/utils/AppError.js'
);

/* =========================
   TESTS
========================= */

describe('LECTURA CONTROLLER - caja blanca', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* =========================
     INGESTAR
  ========================== */

  test('❌ ingestar: nodo no encontrado => AppError.notFound', async () => {

    service.ingestar.mockResolvedValue(null);

    const req = {
      nodo: { id: 1 },
      body: { temp: 25 }
    };

    await expect(ingestar(req, {})).rejects.toThrow(AppError);
  });

  test('✅ ingestar: éxito 201', async () => {

    service.ingestar.mockResolvedValue({
      id: 10,
      valor: 25
    });

    const json = jest.fn();
    const status = jest.fn(() => ({ json }));

    const req = {
      nodo: { id: 1 },
      body: { temp: 25 }
    };

    const res = { status };

    await ingestar(req, res);

    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({
      id: 10,
      valor: 25
    });
  });

  /* =========================
     RECIENTES
  ========================== */

  test('✅ recientes: con limite en query', async () => {

    service.lecturasRecientes.mockResolvedValue([
      { id: 1 },
      { id: 2 }
    ]);

    const json = jest.fn();
    const req = {
      params: { parcelaId: 5 },
      query: { limite: '50' }
    };

    const res = { json };

    await recientes(req, res);

    expect(service.lecturasRecientes).toHaveBeenCalledWith(5, 50);
    expect(json).toHaveBeenCalledWith({
      lecturas: [{ id: 1 }, { id: 2 }]
    });
  });

  test('✅ recientes: sin limite usa default 100', async () => {

    service.lecturasRecientes.mockResolvedValue([]);

    const json = jest.fn();

    const req = {
      params: { parcelaId: 10 },
      query: {}
    };

    const res = { json };

    await recientes(req, res);

    expect(service.lecturasRecientes).toHaveBeenCalledWith(10, 100);
    expect(json).toHaveBeenCalledWith({ lecturas: [] });
  });

});