import { jest } from '@jest/globals';

/* =========================
   MOCK CONTROLLER
========================= */
jest.unstable_mockModule('../../../src/modules/riego/riego.controller.js', () => ({
  listarConfiguracionesEmpresa: jest.fn((req, res) => res.json({ ok: 'empresa' })),
  obtenerConfig: jest.fn((req, res) => res.json({ ok: 'config' })),
  historialConfig: jest.fn((req, res) => res.json({ ok: 'historial' })),
  aplicarManual: jest.fn((req, res) => res.status(201).json({ ok: 'manual' })),
  aplicarPerfil: jest.fn((req, res) => res.status(201).json({ ok: 'perfil' })),
  estadoActuadores: jest.fn((req, res) => res.json({ ok: 'actuadores' })),
  crearActuador: jest.fn((req, res) => res.status(201).json({ ok: 'crear' })),
  estadoAfd: jest.fn((req, res) => res.json({ ok: 'afd' })),
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
const routerModule = await import('../../../src/modules/riego/riego.routes.js');

describe('Riego Routes - caja blanca', () => {

  test('router se carga correctamente', () => {
    expect(routerModule.default).toBeDefined();
  });

});