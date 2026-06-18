import { jest } from '@jest/globals';
import express from 'express';

/* =========================
   MOCK CONTROLLER
========================= */
jest.unstable_mockModule("../../../src/modules/alertas/alerta.controller.js", () => ({
  listar: jest.fn((req, res) => res.json({ ok: "listar" })),
  marcarLeida: jest.fn((req, res) => res.json({ ok: "leida" })),
  marcarResuelta: jest.fn((req, res) => res.json({ ok: "resuelta" }))
}));

/* =========================
   MOCK MIDDLEWARES
========================= */
jest.unstable_mockModule("../../../src/middlewares/auth.middleware.js", () => ({
  authenticate: (req, res, next) => next()
}));

jest.unstable_mockModule("../../../src/middlewares/validate.middleware.js", () => ({
  validate: () => (req, res, next) => next()
}));

/* =========================
   IMPORT ROUTER (DESPUÉS MOCKS)
========================= */
const router = (await import("../../../src/modules/alertas/alerta.routes.js")).default;

describe("Alertas Routes - Caja Blanca", () => {

  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      json: jest.fn()
    };
    next = jest.fn();
  });

  /* =========================
     1. LISTAR
  ========================== */
  test("GET / ejecuta listar", () => {

    const route = router.stack.find(r => r.route?.path === "/");

    route.route.stack[0].handle(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ ok: "listar" });
  });

  /* =========================
     2. MARCAR LEIDA
  ========================== */
  test("PATCH /leida ejecuta controller", () => {

    const route = router.stack.find(r => r.route?.path === "/:id/leida");

    route.route.stack[1].handle(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ ok: "leida" });
  });

  /* =========================
     3. MARCAR RESUELTA
  ========================== */
  test("PATCH /resuelta ejecuta controller", () => {

    const route = router.stack.find(r => r.route?.path === "/:id/resuelta");

    route.route.stack[1].handle(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ ok: "resuelta" });
  });

});