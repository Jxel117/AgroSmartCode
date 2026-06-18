import { jest } from '@jest/globals';

/* =========================
   MOCK SERVICES
========================= */
jest.unstable_mockModule("../../../src/modules/auth/auth.service.js", () => ({
  registrar: jest.fn(),
  login: jest.fn(),
  logout: jest.fn()
}));

jest.unstable_mockModule("../../../src/modules/auth/registroEmpresa.service.js", () => ({
  registrarEmpresa: jest.fn()
}));

const authService = await import("../../../src/modules/auth/auth.service.js");
const empresaService = await import("../../../src/modules/auth/registroEmpresa.service.js");
const controller = await import("../../../src/modules/auth/auth.controller.js");

describe("Auth Controller - Caja Blanca Completo", () => {

  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      headers: {},
      ip: undefined
    };

    res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    jest.clearAllMocks();
  });

  /* =========================
     1. REGISTRAR (OK)
  ========================== */
  test("registrar usuario retorna 201", async () => {

    authService.registrar.mockResolvedValue({ id: 1 });

    await controller.registrar(req, res);

    expect(authService.registrar).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ usuario: { id: 1 } });
  });

  /* =========================
     2. LOGIN CON req.ip
  ========================== */
  test("login usa req.ip como prioridad", async () => {

    req.ip = "127.0.0.1";
    req.body = {
      correo: "test@mail.com",
      contra: "123",
      captchaToken: "abc"
    };

    authService.login.mockResolvedValue({ token: "jwt" });

    await controller.login(req, res);

    expect(authService.login.mock.calls[0][1]).toBe("127.0.0.1");
  });

  /* =========================
     3. LOGIN CON x-forwarded-for
  ========================== */
  test("login usa x-forwarded-for si no hay req.ip", async () => {

    req.ip = undefined;
    req.headers["x-forwarded-for"] = "10.0.0.1, 10.0.0.2";

    authService.login.mockResolvedValue({ token: "jwt" });

    await controller.login(req, res);

    expect(authService.login.mock.calls[0][1]).toBe("10.0.0.1");
  });

  /* =========================
     4. LOGIN SIN IP (NULL)
  ========================== */
  test("login sin ip ni header envía null", async () => {

    req.ip = undefined;
    req.headers["x-forwarded-for"] = undefined;

    authService.login.mockResolvedValue({ token: "jwt" });

    await controller.login(req, res);

    expect(authService.login.mock.calls[0][1]).toBeNull();
  });

  /* =========================
     5. LOGIN RESPONSE
  ========================== */
  test("login retorna respuesta del servicio", async () => {

    req.body = {
      correo: "a@a.com",
      contra: "123",
      captchaToken: "x"
    };

    authService.login.mockResolvedValue({ token: "ok" });

    await controller.login(req, res);

    expect(res.json).toHaveBeenCalledWith({ token: "ok" });
  });

  /* =========================
     6. LOGOUT OK
  ========================== */
  test("logout extrae token correctamente", async () => {

    req.headers.authorization = "Bearer abc123";

    authService.logout.mockResolvedValue(true);

    await controller.logout(req, res);

    expect(authService.logout).toHaveBeenCalledWith("abc123");
    expect(res.json).toHaveBeenCalledWith({ mensaje: "Sesion cerrada" });
  });

  /* =========================
     7. LOGOUT SIN HEADER (BRANCH)
  ========================== */
  test("logout sin authorization lanza error", async () => {

    req.headers.authorization = undefined;

    await expect(controller.logout(req, res)).rejects.toThrow();
  });

  /* =========================
     8. PERFIL
  ========================== */
  test("perfil retorna usuario autenticado", async () => {

    req.user = { id: 1, nombre: "test" };

    await controller.perfil(req, res);

    expect(res.json).toHaveBeenCalledWith({
      usuario: { id: 1, nombre: "test" }
    });
  });

  /* =========================
     9. REGISTRAR EMPRESA
  ========================== */
  test("registrarEmpresa retorna datos completos", async () => {

    empresaService.registrarEmpresa.mockResolvedValue({
      correoInstitucional: "a@empresa.com",
      correoValidacion: "b@empresa.com",
      empresa: { id: 1 }
    });

    await controller.registrarEmpresa(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      mensaje: "Tu empresa ha sido registrada. Revisa tu correo Gmail para activar tu cuenta.",
      correoInstitucional: "a@empresa.com",
      correoValidacion: "b@empresa.com",
      empresa: { id: 1 }
    });
  });

});