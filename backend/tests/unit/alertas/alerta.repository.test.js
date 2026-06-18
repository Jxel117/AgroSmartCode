import { jest } from '@jest/globals';

/* =========================
   MOCK DE DB (POOL)
========================= */
jest.unstable_mockModule("../../../src/db/pool.js", () => ({
  query: jest.fn()
}));

const { query } = await import("../../../src/db/pool.js");
const repo = await import("../../../src/modules/alertas/alerta.repository.js");

describe("Alerta Repository - Caja Blanca Completo", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* =========================
     1. CREATE
  ========================== */
  test("create inserta alerta y retorna registro", async () => {

    query.mockResolvedValue({
      rows: [{ id_alerta: 1, mensaje: "test" }]
    });

    const data = {
      parcelaId: 1,
      nodoId: 2,
      tipoAlerta: "HUMEDAD",
      severidad: "ALTA",
      mensaje: "Suelo seco",
      valorDisparador: 20
    };

    const result = await repo.create(data);

    expect(query).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result.id_alerta).toBe(1);
  });

  /* =========================
     2. FIND ALL SIN FILTRO
  ========================== */
  test("findAll sin estado retorna alertas", async () => {

    query.mockResolvedValue({
      rows: [{ id_alerta: 1 }, { id_alerta: 2 }]
    });

    const result = await repo.findAll();

    expect(query).toHaveBeenCalled();
    expect(result.length).toBe(2);
  });

  /* =========================
     3. FIND ALL CON FILTRO
  ========================== */
  test("findAll con estado filtra resultados", async () => {

    query.mockResolvedValue({
      rows: [{ id_alerta: 3, estado: "LEIDA" }]
    });

    const result = await repo.findAll("LEIDA");

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE estado = $1"),
      ["LEIDA"]
    );

    expect(result[0].estado).toBe("LEIDA");
  });

  /* =========================
     4. MARCAR LEIDA OK
  ========================== */
  test("marcarLeida actualiza alerta a LEIDA", async () => {

    query.mockResolvedValue({
      rows: [{ id_alerta: 1, estado: "LEIDA" }]
    });

    const result = await repo.marcarLeida(1);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE alerta SET estado = 'LEIDA'"),
      [1]
    );

    expect(result.estado).toBe("LEIDA");
  });

  /* =========================
     5. MARCAR LEIDA NO EXISTE
  ========================== */
  test("marcarLeida retorna null si no existe", async () => {

    query.mockResolvedValue({ rows: [] });

    const result = await repo.marcarLeida(999);

    expect(result).toBeNull();
  });

  /* =========================
     6. MARCAR RESUELTA OK
  ========================== */
  test("marcarResuelta actualiza estado", async () => {

    query.mockResolvedValue({
      rows: [{ id_alerta: 2, estado: "RESUELTA" }]
    });

    const result = await repo.marcarResuelta(2);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("RESUELTA"),
      [2]
    );

    expect(result.estado).toBe("RESUELTA");
  });

  /* =========================
     7. MARCAR RESUELTA NO EXISTE
  ========================== */
  test("marcarResuelta retorna null si no existe", async () => {

    query.mockResolvedValue({ rows: [] });

    const result = await repo.marcarResuelta(404);

    expect(result).toBeNull();
  });

});