import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

/* =========================
   MOCK SERVICE
========================= */

jest.unstable_mockModule('../../../src/modules/parcelas/parcela.service.js', () => ({
  listar: jest.fn(),
  obtener: jest.fn(),
  crear: jest.fn(),
  actualizar: jest.fn(),
  eliminar: jest.fn(),
  asignar: jest.fn(),
  desasignar: jest.fn(),
  listarAgricultores: jest.fn()
}));

/* =========================
   IMPORT CONTROLLER (DESPUÉS DE MOCK)
========================= */

const service = await import('../../../src/modules/parcelas/parcela.service.js');
const controller = await import('../../../src/modules/parcelas/parcela.controller.js');

/* =========================
   EXPRESS APP MOCK
========================= */

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  req.user = { empresa: 'emp1', id: 'user1' };
  next();
});

/* ROUTES SOLO PARA PROBAR CONTROLADOR */
app.get('/parcelas', controller.listar);
app.get('/parcelas/:id', controller.obtener);
app.post('/parcelas', controller.crear);
app.put('/parcelas/:id', controller.actualizar);
app.delete('/parcelas/:id', controller.eliminar);
app.post('/parcelas/:id/asignar', controller.asignar);
app.post('/parcelas/:id/desasignar', controller.desasignar);
app.get('/parcelas/:id/agricultores', controller.listarAgricultores);

/* =========================
   TESTS
========================= */

describe('Parcela Controller - cobertura completa', () => {

  beforeEach(() => jest.clearAllMocks());

  test('listar parcelas', async () => {
    service.listar.mockResolvedValue([{ id: 1 }]);

    const res = await request(app).get('/parcelas');

    expect(res.body.parcelas).toHaveLength(1);
    expect(service.listar).toHaveBeenCalled();
  });

  test('obtener parcela', async () => {
    service.obtener.mockResolvedValue({ id: 1 });

    const res = await request(app).get('/parcelas/1');

    expect(res.body.parcela.id).toBe(1);
  });

  test('crear parcela', async () => {
    service.crear.mockResolvedValue({ id: 1 });

    const res = await request(app)
      .post('/parcelas')
      .send({ nombre: 'A' });

    expect(res.status).toBe(201);
    expect(res.body.parcela.id).toBe(1);
  });

  test('actualizar parcela', async () => {
    service.actualizar.mockResolvedValue({ id: 1 });

    const res = await request(app)
      .put('/parcelas/1')
      .send({ nombre: 'B' });

    expect(res.body.parcela.id).toBe(1);
  });

  test('eliminar parcela', async () => {
    service.eliminar.mockResolvedValue();

    const res = await request(app).delete('/parcelas/1');

    expect(res.status).toBe(204);
  });

  test('asignar agricultor', async () => {
    service.asignar.mockResolvedValue();

    const res = await request(app)
      .post('/parcelas/1/asignar')
      .send({ usuarioId: 'u1' });

    expect(res.body.mensaje).toBe('Agricultor asignado');
  });

  test('desasignar agricultor', async () => {
    service.desasignar.mockResolvedValue();

    const res = await request(app)
      .post('/parcelas/1/desasignar')
      .send({ usuarioId: 'u1' });

    expect(res.body.mensaje).toBe('Agricultor desasignado');
  });

  test('listar agricultores', async () => {
    service.listarAgricultores.mockResolvedValue([{ id: 1 }]);

    const res = await request(app).get('/parcelas/1/agricultores');

    expect(res.body.agricultores).toHaveLength(1);
  });

});