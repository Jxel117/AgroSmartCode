import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

/* =========================
   MOCK MIDDLEWARES (ESM SAFE)
========================= */

jest.unstable_mockModule('../../../src/middlewares/auth.middleware.js', () => ({
  authenticate: (req, res, next) => next(),
  authorize: () => (req, res, next) => next()
}));

jest.unstable_mockModule('../../../src/middlewares/validate.middleware.js', () => ({
  validate: () => (req, res, next) => next()
}));

jest.unstable_mockModule('../../../src/utils/asyncHandler.js', () => ({
  asyncHandler: (fn) => fn
}));

/* =========================
   MOCK CONTROLLER
========================= */

jest.unstable_mockModule('../../../src/modules/nodos/nodo.controller.js', () => ({
  listar: (req, res) => res.json({ route: 'listar' }),
  obtener: (req, res) => res.json({ route: 'obtener' }),
  crear: (req, res) => res.status(201).json({ route: 'crear' }),
  actualizar: (req, res) => res.json({ route: 'actualizar' }),
  cambiarEstado: (req, res) => res.json({ route: 'estado' }),
  eliminar: (req, res) => res.status(204).send()
}));

/* =========================
   IMPORT ROUTES (DESPUÉS DE MOCKS)
========================= */

const router = (await import('../../../src/modules/nodos/nodo.routes.js')).default;

/* =========================
   APP EXPRESS
========================= */

const app = express();
app.use(express.json());
app.use('/nodos', router);

/* =========================
   TESTS
========================= */

describe('Nodo Routes - cobertura completa', () => {

  test('GET /', async () => {
    const res = await request(app).get('/nodos/');
    expect(res.body.route).toBe('listar');
  });

  test('GET /:id', async () => {
    const res = await request(app).get('/nodos/1');
    expect(res.body.route).toBe('obtener');
  });

  test('POST /', async () => {
    const res = await request(app).post('/nodos').send({});
    expect(res.status).toBe(201);
    expect(res.body.route).toBe('crear');
  });

  test('PUT /:id', async () => {
    const res = await request(app).put('/nodos/1').send({});
    expect(res.body.route).toBe('actualizar');
  });

  test('PATCH /:id/estado', async () => {
    const res = await request(app)
      .patch('/nodos/1/estado')
      .send({ estado: 'ACTIVO' });

    expect(res.body.route).toBe('estado');
  });

  test('DELETE /:id', async () => {
    const res = await request(app).delete('/nodos/1');
    expect(res.status).toBe(204);
  });

  test('routes definidas', () => {
    const paths = router.stack
      .filter(r => r.route)
      .map(r => r.route.path);

    expect(paths).toContain('/');
    expect(paths).toContain('/:id');
    expect(paths).toContain('/:id/estado');
  });

});