import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';

/* =========================
   MOCK REPOSITORY
========================= */
jest.unstable_mockModule('../../../src/modules/perfiles/perfil.repository.js', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));

const repo = await import('../../../src/modules/perfiles/perfil.repository.js');
const controller = await import('../../../src/modules/perfiles/perfil.controller.js');

/* =========================
   APP EXPRESS
========================= */
const app = express();
app.use(express.json());

app.get('/perfiles', controller.listar);
app.get('/perfiles/:id', controller.obtener);
app.post('/perfiles', controller.crear);
app.put('/perfiles/:id', controller.actualizar);
app.delete('/perfiles/:id', controller.eliminar);

/* =========================
   TESTS
========================= */
describe('Perfil Controller - caja blanca', () => {

  beforeEach(() => jest.clearAllMocks());

  /* =========================
     LISTAR
  ========================== */
  test('listar retorna perfiles', async () => {
    repo.findAll.mockResolvedValue([{ id: 1 }]);

    const res = await request(app).get('/perfiles');

    expect(res.body.perfiles).toHaveLength(1);
  });

  /* =========================
     OBTENER (OK)
  ========================== */
  test('obtener retorna perfil', async () => {
    repo.findById.mockResolvedValue({ id: 1 });

    const res = await request(app).get('/perfiles/1');

    expect(res.body.perfil.id).toBe(1);
  });

  /* =========================
     OBTENER (NOT FOUND)
  ========================== */
  test('obtener lanza error si no existe', async () => {
    repo.findById.mockResolvedValue(null);

    const res = await request(app).get('/perfiles/999');

    // como AppError depende de middleware global, Express normalmente responde 500
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  /* =========================
     CREAR
  ========================== */
  test('crear retorna 201', async () => {
    repo.create.mockResolvedValue({ id: 1 });

    const res = await request(app)
      .post('/perfiles')
      .send({ nombre: 'admin' });

    expect(res.status).toBe(201);
    expect(res.body.perfil.id).toBe(1);
  });

  /* =========================
     ACTUALIZAR (OK)
  ========================== */
  test('actualizar retorna perfil', async () => {
    repo.update.mockResolvedValue({ id: 1 });

    const res = await request(app)
      .put('/perfiles/1')
      .send({ nombre: 'editado' });

    expect(res.body.perfil.id).toBe(1);
  });

  /* =========================
     ACTUALIZAR (NOT FOUND)
  ========================== */
  test('actualizar lanza error si no existe', async () => {
    repo.update.mockResolvedValue(null);

    const res = await request(app)
      .put('/perfiles/999')
      .send({ nombre: 'x' });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  /* =========================
     ELIMINAR (OK)
  ========================== */
  test('eliminar retorna 204', async () => {
    repo.remove.mockResolvedValue(true);

    const res = await request(app).delete('/perfiles/1');

    expect(res.status).toBe(204);
  });

  /* =========================
     ELIMINAR (NOT FOUND)
  ========================== */
  test('eliminar lanza error si no existe', async () => {
    repo.remove.mockResolvedValue(false);

    const res = await request(app).delete('/perfiles/999');

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

});