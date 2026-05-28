import { Router } from 'express';
import { z } from 'zod';
import * as ctrl from './reporte.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);

const parcelaParam = z.object({ parcelaId: z.string().uuid() });
const generarSchema = z.object({
  tipoPeriodo: z.enum(['DIARIO', 'SEMANAL', 'MENSUAL']),
  fechaInicio: z.string().datetime(),
  fechaFin: z.string().datetime(),
  persistir: z.boolean().optional(),
});

router.post('/:parcelaId/generar', validate(parcelaParam, 'params'),
  validate(generarSchema), asyncHandler(ctrl.generar));

export default router;