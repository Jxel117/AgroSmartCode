import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

/* =========================
   MOCK MIDDLEWARES
========================= */
jest.unstable_mockModule('../../../src/middlewares/auth.middleware.js', () => ({
  authenticate: (req, res, next) => next(),
}));

jest.unstable_mockModule('../../../src/middlewares/validate.middleware.js', () => ({
  validate: () => (req, res, next) => next(),
}));

jest.unstable_mockModule('../../../src/utils/asyncHandler.js', () => ({
  asyncHandler: (fn) => fn,
}));

/* =========================
   MOCK CONTROLLER
========================= */
jest.unstable_mockModule('../../../src/modules/reportes/reporte.controller.js', () => ({
  generar: (req, res) =>
    res.status(200).json({
      ok: true,
      parcelaId: req.params.parcelaId,
    }),
}));

/* =========================
   IMPORT ROUTES
========================= */
const routerModule = await import(
  '../../../src/modules/reportes/reporte.routes.js'
);

const reporteRoutes = routerModule.default;

/* =========================
   APP EXPRESS
========================= */
const app = express();
app.use(express.json());
app.use('/reportes', reporteRoutes);

/* =========================
   TESTS
========================= */
describe('Reporte Routes - caja blanca', () => {

  test('POST /:parcelaId/generar ejecuta flujo completo', async () => {

    const res = await request(app)
      .post('/reportes/123e4567-e89b-12d3-a456-426614174000/generar')
      .send({
        tipoPeriodo: 'MENSUAL',
        fechaInicio: '2026-01-01T00:00:00Z',
        fechaFin: '2026-01-31T00:00:00Z',
        persistir: true
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.parcelaId).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  test('router tiene ruta definida correctamente', () => {

    const paths = reporteRoutes.stack
      .filter(r => r.route)
      .map(r => r.route.path);

    expect(paths).toContain('/:parcelaId/generar');
  });

});