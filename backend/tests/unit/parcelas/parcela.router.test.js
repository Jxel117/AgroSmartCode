import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

/* =========================
   MOCK MIDDLEWARES (ESM SAFE)
========================= */

jest.unstable_mockModule('../../../src/middlewares/auth.middleware.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { empresa: 'emp1', id: 'u1' };
    next();
  },
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

jest.unstable_mockModule('../../../src/modules/parcelas/parcela.controller.js', () => ({
  listar: (req, res) => res.json({ route: 'listar' }),
  obtener: (req, res) => res.json({ route: 'obtener' }),
  crear: (req, res) => res.status(201).json({ route: 'crear' }),
  actualizar: (req, res) => res.json({ route: 'actualizar' }),
  eliminar: (req, res) => res.status(204).send(),
  asignar: (req, res) => res.json({ route: 'asignar' }),
  desasignar: (req, res) => res.json({ route: 'desasignar' }),
  listarAgricultores: (req, res) => res.json({ route: 'listarAgricultores' })
}));

/* =========================
   IMPORT ROUTER (DESPUÉS DE MOCKS)
========================= */

const router = (await import('../../../src/modules/parcelas/parcela.routes.js')).default;

/* =========================
   EXPRESS APP
========================= */

const app = express();
app.use(express.json());
app.use('/parcelas', router);

/* =========================
   TESTS
========================= */

describe('Parcela Router - cobertura completa', () => {

  test('GET /', async () => {
    const res = await request(app).get('/parcelas/');
    expect(res.body.route).toBe('listar');
  });

  test('GET /:id', async () => {
    const res = await request(app).get('/parcelas/1');
    expect(res.body.route).toBe('obtener');
  });

  test('POST /', async () => {
    const res = await request(app).post('/parcelas').send({});
    expect(res.status).toBe(201);
    expect(res.body.route).toBe('crear');
  });

  test('PUT /:id', async () => {
    const res = await request(app).put('/parcelas/1').send({});
    expect(res.body.route).toBe('actualizar');
  });

  test('DELETE /:id', async () => {
    const res = await request(app).delete('/parcelas/1');
    expect(res.status).toBe(204);
  });

  test('POST /:id/agricultores', async () => {
    const res = await request(app)
      .post('/parcelas/1/agricultores')
      .send({ usuarioId: 'u1' });

    expect(res.body.route).toBe('asignar');
  });

  test('DELETE /:id/agricultores', async () => {
    const res = await request(app)
      .delete('/parcelas/1/agricultores')
      .send({ usuarioId: 'u1' });

    expect(res.body.route).toBe('desasignar');
  });

  test('GET /:id/agricultores', async () => {
    const res = await request(app).get('/parcelas/1/agricultores');

    expect(res.body.route).toBe('listarAgricultores');
  });

  test('router tiene rutas definidas (branch coverage indirecto)', () => {
    const paths = router.stack
      .filter(r => r.route)
      .map(r => r.route.path);

    expect(paths).toContain('/');
    expect(paths).toContain('/:id');
    expect(paths).toContain('/:id/agricultores');
  });

});