import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

// 1. Mocks de los Middlewares y Controladores
// NOTA: Si usas Jest con ESM, asegúrate de que los paths coincidan exactamente
jest.unstable_mockModule('../../../src/middlewares/auth.middleware.js', () => ({
  authenticate: (req, res, next) => {
    if (req.headers.authorization === 'Bearer token-valido') return next();
    return res.status(401).json({ error: 'No autorizado' });
  }
}));

jest.unstable_mockModule('../../../src/middlewares/deviceAuth.middleware.js', () => ({
  authenticateDevice: (req, res, next) => {
    if (req.headers['x-device-token'] === 'device-valido') return next();
    return res.status(401).json({ error: 'Dispositivo no autorizado' });
  }
}));

jest.unstable_mockModule('../../../src/middlewares/validate.middleware.js', () => ({
  validate: (schema, type = 'body') => (req, res, next) => {
    // Simulación simple de validación basada en la existencia de datos requeridos
    if (type === 'params' && req.params.parcelaId === 'invalido') {
      return res.status(400).json({ error: 'Validación de params falló' });
    }
    if (type === 'body' && (!req.body || Object.keys(req.body).length === 0)) {
      return res.status(400).json({ error: 'Validación de body falló' });
    }
    next();
  }
}));

jest.unstable_mockModule('../../../src/modules/lecturas/lectura.controller.js', () => ({
  ingestar: (req, res) => res.status(201).json({ ok: true, msg: 'Ingestado' }),
  recientes: (req, res) => res.status(200).json({ ok: true, data: [] })
}));

// Importamos el router después de definir los mocks
const { default: router } = await import('../../../src/modules/lecturas/lectura.routes.js');

describe('Lectura Routes - Cobertura de Caminos', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/lecturas', router);
  });

  describe('POST /ingesta (IoT Device)', () => {
    it('Debería procesar la ingesta si el dispositivo y el body son válidos (Camino Feliz)', async () => {
      const response = await request(app)
        .post('/api/lecturas/ingesta')
        .set('x-device-token', 'device-valido')
        .send({ temperatura: 24.5 });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ ok: true, msg: 'Ingestado' });
    });

    it('Debería rechazar si falla la autenticación del dispositivo', async () => {
      const response = await request(app)
        .post('/api/lecturas/ingesta')
        .set('x-device-token', 'token-falso')
        .send({ temperatura: 24.5 });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Dispositivo no autorizado');
    });

    it('Debería rechazar si la validación del esquema del body falla', async () => {
      const response = await request(app)
        .post('/api/lecturas/ingesta')
        .set('x-device-token', 'device-valido')
        .send({}); // Body vacío para forzar error simulado

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validación de body falló');
    });
  });

  describe('GET /parcela/:parcelaId (Frontend User)', () => {
    it('Debería retornar las lecturas recientes si el usuario está autenticado y el ID es válido', async () => {
      const response = await request(app)
        .get('/api/lecturas/parcela/123')
        .set('Authorization', 'Bearer token-valido');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true, data: [] });
    });

    it('Debería rechazar si el usuario no está autenticado', async () => {
      const response = await request(app)
        .get('/api/lecturas/parcela/123')
        .set('Authorization', 'Bearer token-invalido');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No autorizado');
    });

    it('Debería rechazar si el parámetro de la parcela no es válido', async () => {
      const response = await request(app)
        .get('/api/lecturas/parcela/invalido')
        .set('Authorization', 'Bearer token-valido');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validación de params falló');
    });
  });
});