import { Router } from 'express';
import { z } from 'zod';
import * as ctrl from './alerta.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();
// Monitoreo: solo administrador/agricultor (el auditor no ve monitoreo)
router.use(authenticate, authorize('ADMINISTRADOR', 'AGRICULTOR'));

const idParam = z.object({ id: z.string().uuid() });

router.get('/', asyncHandler(ctrl.listar));
router.get('/contar', asyncHandler(ctrl.contar));
router.patch('/marcar-todas-leidas', asyncHandler(ctrl.marcarTodasLeidas));
router.patch('/:id/leida', validate(idParam, 'params'), asyncHandler(ctrl.marcarLeida));
router.patch('/:id/resuelta', validate(idParam, 'params'), asyncHandler(ctrl.marcarResuelta));

export default router;