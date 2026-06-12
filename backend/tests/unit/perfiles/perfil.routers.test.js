import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

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
   MOCK CONTROLLER
========================= */
jest.unstable_mockModule('../../../src/modules/perfiles/perfil.controller.js', () => ({
  listar: (req, res) => res.json({ ok: 'listar' }),
  obtener: (req, res) => res.json({ ok: 'obtener' }),
  crear: (req, res) => res.status(201).json({ ok: 'crear' }),
  actualizar: (req, res) => res.json({ ok: 'actualizar' }),
  eliminar: (req, res) => res.status(204).send(),
}));

/* =========================
   IMPORT ROUTES (IMPORT DESPUÉS DE MOCKS)
========================= */
const routerModule = await import(
  '../../../src/modules/perfiles/perfil.routes.js'
);
const perfilRoutes = routerModule.default;

/* =========================
   APP EXPRESS
========================= */
const app = express();
app.use(express.json());
app.use('/perfiles', perfilRoutes);

/* =========================
   TESTS
========================= */
describe('Perfil Routes - caja blanca', () => {

  test('GET /perfiles ejecuta listar', async () => {
    const res = await request(app).get('/perfiles');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe('listar');
  });

  test('GET /perfiles/:id ejecuta obtener', async () => {
    const res = await request(app).get('/perfiles/1');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe('obtener');
  });

  test('POST /perfiles ejecuta crear', async () => {
    const res = await request(app)
      .post('/perfiles')
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe('crear');
  });

  test('PUT /perfiles/:id ejecuta actualizar', async () => {
    const res = await request(app)
      .put('/perfiles/1')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe('actualizar');
  });

  test('DELETE /perfiles/:id ejecuta eliminar', async () => {
    const res = await request(app).delete('/perfiles/1');

    expect(res.status).toBe(204);
  });

  test('router tiene rutas definidas (cobertura estructura)', () => {
    const paths = perfilRoutes.stack
      .filter(r => r.route)
      .map(r => r.route.path);

    expect(paths).toContain('/');
    expect(paths).toContain('/:id');
  });

});