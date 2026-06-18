import { jest } from '@jest/globals';

/* =========================
   MOCK CONTROLLER
========================= */
jest.unstable_mockModule('../../../src/modules/riego/programacion.controller.js', () => ({
  listar: jest.fn((req, res) => res.json({ ok: 'listar' })),
  crear: jest.fn((req, res) => res.status(201).json({ ok: 'crear' })),
  cambiarEstado: jest.fn((req, res) => res.json({ ok: 'estado' })),
  eliminar: jest.fn((req, res) => res.status(204).send()),
}));

/* =========================
   MOCK MIDDLEWARES
========================= */
jest.unstable_mockModule('../../../src/middlewares/auth.middleware.js', () => ({
  authenticate: (req, res, next) => next(),
  authorize: () => (req, res, next) => next(),
}));

jest.unstable_mockModule('../../../src/middlewares/validate.middleware.js', () => ({
  validate: () => (req, res, next) => next(),
}));

jest.unstable_mockModule('../../../src/utils/asyncHandler.js', () => ({
  asyncHandler: (fn) => fn,
}));

/* =========================
   IMPORT ROUTER
========================= */
const router = await import('../../../src/modules/riego/programacion.routes.js');

describe('Programacion Routes - caja blanca', () => {

  test('router está definido correctamente', () => {
    expect(router.default).toBeDefined();
  });

});