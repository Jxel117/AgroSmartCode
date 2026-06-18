import { jest } from '@jest/globals';

jest.unstable_mockModule("../../../src/modules/alertas/alerta.repository.js", () => ({
  findAll: jest.fn(),
  marcarLeida: jest.fn(),
  marcarResuelta: jest.fn()
}));

const repo = await import("../../../src/modules/alertas/alerta.repository.js");
const controller = await import("../../../src/modules/alertas/alerta.controller.js");

describe("ALERTA Controller - Caja Blanca Completo", () => {

  let req, res;

  beforeEach(() => {
    req = { query: {}, params: {} };

    res = {
      json: jest.fn()
    };

    jest.clearAllMocks();
  });

  // -------------------------
  // 1. LISTAR
  // -------------------------
  test("listar retorna alertas", async () => {

    repo.findAll.mockResolvedValue([{ id: 1 }]);

    await controller.listar(req, res);

    expect(repo.findAll).toHaveBeenCalledWith(undefined);

    expect(res.json).toHaveBeenCalledWith({
      alertas: [{ id: 1 }]
    });
  });

  // -------------------------
  // 2. MARCAR LEIDA (OK)
  // -------------------------
  test("marcarLeida OK", async () => {

    req.params.id = 1;

    repo.marcarLeida.mockResolvedValue({ id: 1, leida: true });

    await controller.marcarLeida(req, res);

    expect(res.json).toHaveBeenCalledWith({
      alerta: { id: 1, leida: true }
    });
  });

  // -------------------------
  // 3. MARCAR LEIDA (ERROR)
  // -------------------------
  test("marcarLeida alerta no existe", async () => {

    req.params.id = 99;

    repo.marcarLeida.mockResolvedValue(null);

    await expect(controller.marcarLeida(req, res))
      .rejects
      .toThrow("Alerta no encontrada o ya leida");
  });

  // -------------------------
  // 4. MARCAR RESUELTA (OK)
  // -------------------------
  test("marcarResuelta OK", async () => {

    req.params.id = 2;

    repo.marcarResuelta.mockResolvedValue({ id: 2, resuelta: true });

    await controller.marcarResuelta(req, res);

    expect(res.json).toHaveBeenCalledWith({
      alerta: { id: 2, resuelta: true }
    });
  });

  // -------------------------
  // 5. MARCAR RESUELTA (ERROR)
  // -------------------------
  test("marcarResuelta alerta no existe", async () => {

    req.params.id = 404;

    repo.marcarResuelta.mockResolvedValue(null);

    await expect(controller.marcarResuelta(req, res))
      .rejects
      .toThrow("Alerta no encontrada");
  });

});