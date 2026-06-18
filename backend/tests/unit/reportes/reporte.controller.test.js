import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

/* =========================
   MOCK SERVICE
========================= */
jest.unstable_mockModule('../../../src/modules/reportes/reporte.service.js', () => ({
  generar: jest.fn(),
}));

const service = await import('../../../src/modules/reportes/reporte.service.js');
const controller = await import('../../../src/modules/reportes/reporte.controller.js');

/* =========================
   APP EXPRESS
========================= */
const app = express();
app.use(express.json());

app.post('/reportes/:parcelaId', controller.generar);

/* =========================
   TESTS
========================= */
describe('Reporte Controller - caja blanca', () => {

  beforeEach(() => jest.clearAllMocks());

  test('debería generar reporte correctamente', async () => {

    service.generar.mockResolvedValue({
      id: 'rep-1',
      total: 10
    });

    const res = await request(app)
      .post('/reportes/123')
      .send({ tipo: 'mensual' });

    expect(service.generar).toHaveBeenCalledWith(
      '123',
      { tipo: 'mensual' }
    );

    expect(res.status).toBe(200);
    expect(res.body.reporte).toEqual({
      id: 'rep-1',
      total: 10
    });
  });

});