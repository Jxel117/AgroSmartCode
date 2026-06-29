import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import eventoRoutes from './modules/eventos/evento.routes.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

  // Ruta de salud
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      servicio: 'agrosmart-audit',
      timestamp: new Date().toISOString(),
    });
  });

  // Rutas del módulo de eventos
  app.use('/api/audit', eventoRoutes);

  // Manejo de errores
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
