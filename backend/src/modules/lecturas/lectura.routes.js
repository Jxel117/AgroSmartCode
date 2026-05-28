import { Router } from 'express';
import * as ctrl from './lectura.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authenticateDevice } from '../../middlewares/deviceAuth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ingestaSchema, parcelaParamSchema } from './lectura.schemas.js';

const router = Router();

// Ingesta desde el dispositivo IoT (credencial de nodo)
router.post('/ingesta', authenticateDevice, validate(ingestaSchema), asyncHandler(ctrl.ingestar));

// Consulta desde el frontend (JWT de usuario)
router.get('/parcela/:parcelaId', authenticate,
  validate(parcelaParamSchema, 'params'), asyncHandler(ctrl.recientes));

export default router;