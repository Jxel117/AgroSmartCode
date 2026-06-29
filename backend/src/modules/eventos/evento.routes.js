import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as ctrl from './evento.controller.js';

const router = Router();

// Todas las rutas requieren autenticación de ADMINISTRADOR
router.use(authenticate);

// GET /api/audit/eventos        — listar con filtros y paginación
router.get('/eventos', asyncHandler(ctrl.listar));

// GET /api/audit/stats           — estadísticas para el dashboard
router.get('/stats', asyncHandler(ctrl.stats));

// GET /api/audit/export          — descargar eventos (CSV o JSON)
router.get('/export', asyncHandler(ctrl.exportar));

export default router;
