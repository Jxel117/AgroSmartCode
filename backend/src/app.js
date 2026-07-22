import authRoutes from './modules/auth/auth.routes.js';
import usuarioRoutes from './modules/usuarios/usuario.routes.js';
import parcelaRoutes from './modules/parcelas/parcela.routes.js';
import perfilRoutes from './modules/perfiles/perfil.routes.js';
import nodoRoutes from './modules/nodos/nodo.routes.js';
import lecturaRoutes from './modules/lecturas/lectura.routes.js';
import riegoRoutes from './modules/riego/riego.routes.js';
import alertaRoutes from './modules/alertas/alerta.routes.js';
import programacionRoutes from './modules/riego/programacion.routes.js';
import reporteRoutes from './modules/reportes/reporte.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { z } from 'zod';
import { env } from './config/env.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';
import { contextoAuditoria } from './audit/audit.context.js';

// Mensajes de validacion de zod en espanol (afecta a todos los schemas de la API)
z.config(z.locales.es());

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

  // Abre el contexto de auditoria de la peticion (ip, user agent, ruta).
  // El actor se anade despues, cuando el middleware de autenticacion valida el JWT.
  app.use(contextoAuditoria);

  // Ruta de salud
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ----- Aqui montaremos las rutas de cada modulo -----
  app.use('/api/auth', authRoutes);
  app.use('/api/usuarios', usuarioRoutes);
  app.use('/api/parcelas', parcelaRoutes);
  app.use('/api/perfiles', perfilRoutes);
  app.use('/api/nodos', nodoRoutes);
  app.use('/api/lecturas', lecturaRoutes);
  app.use('/api/riego', riegoRoutes);
  app.use('/api/alertas', alertaRoutes);
  app.use('/api/programacion', programacionRoutes);
  app.use('/api/reportes', reporteRoutes);
  app.use('/api/admin', adminRoutes);

  // Manejo de rutas inexistentes y errores (siempre al final)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}