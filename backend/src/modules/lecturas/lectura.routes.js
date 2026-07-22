import { Router } from 'express';
import * as ctrl from './lectura.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { authenticateDevice } from '../../middlewares/deviceAuth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ingestaSchema, parcelaParamSchema, riegoStatusSchema } from './lectura.schemas.js';

const router = Router();

// Ingesta desde el dispositivo IoT (credencial de nodo)
router.post('/ingesta', authenticateDevice, validate(ingestaSchema), asyncHandler(ctrl.ingestar));

// Reporte de estado de riego desde un nodo autonomo por REST (sin MQTT)
router.post('/riegostatus', authenticateDevice, validate(riegoStatusSchema), asyncHandler(ctrl.riegostatus));

// Consulta desde el frontend (JWT de usuario). Monitoreo: no el auditor.
router.get('/parcela/:parcelaId', authenticate, authorize('ADMINISTRADOR', 'AGRICULTOR'),
  validate(parcelaParamSchema, 'params'), asyncHandler(ctrl.recientes));

export default router;