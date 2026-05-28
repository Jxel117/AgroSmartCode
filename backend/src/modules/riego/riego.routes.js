import { Router } from 'express';
import { z } from 'zod';
import * as ctrl from './riego.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);

const parcelaParam = z.object({ parcelaId: z.string().uuid() });

const manualSchema = z.object({
  umin: z.number().min(0).max(100),
  umax: z.number().min(0).max(100),
  uminCritico: z.number().min(0).max(100),
  tMaximo: z.number(),
  tmin: z.number().int(),
  nIntentosFallidosMax: z.number().int().min(1).max(10).optional(),
});
const perfilSchema = z.object({ perfilId: z.string().uuid() });
const actuadorSchema = z.object({ tipo: z.enum(['RELE_BOMBA', 'ELECTROVALVULA']) });

router.get('/:parcelaId/configuracion', validate(parcelaParam, 'params'), asyncHandler(ctrl.obtenerConfig));
router.post('/:parcelaId/configuracion/manual', authorize('ADMINISTRADOR'),
  validate(parcelaParam, 'params'), validate(manualSchema), asyncHandler(ctrl.aplicarManual));
router.post('/:parcelaId/configuracion/perfil', authorize('ADMINISTRADOR'),
  validate(parcelaParam, 'params'), validate(perfilSchema), asyncHandler(ctrl.aplicarPerfil));

router.get('/:parcelaId/actuadores', validate(parcelaParam, 'params'), asyncHandler(ctrl.estadoActuadores));
router.post('/:parcelaId/actuadores', authorize('ADMINISTRADOR'),
  validate(parcelaParam, 'params'), validate(actuadorSchema), asyncHandler(ctrl.crearActuador));

router.get('/:parcelaId/afd', validate(parcelaParam, 'params'), asyncHandler(ctrl.estadoAfd));

export default router;