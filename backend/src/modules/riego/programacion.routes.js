import { Router } from 'express';
import { z } from 'zod';
import * as ctrl from './programacion.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);

const parcelaParam = z.object({ parcelaId: z.string().uuid() });
const idParam = z.object({ id: z.string().uuid() });

const crearSchema = z.object({
  diaSemana: z.enum(['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO']),
  horaInicio: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato HH:MM'),
  duracionMinutos: z.number().int().min(1).max(720),
});
const estadoSchema = z.object({ estado: z.enum(['ACTIVA', 'PAUSADA', 'FINALIZADA']) });

router.get('/:parcelaId', validate(parcelaParam, 'params'), asyncHandler(ctrl.listar));
router.post('/:parcelaId', authorize('ADMINISTRADOR'),
  validate(parcelaParam, 'params'), validate(crearSchema), asyncHandler(ctrl.crear));
router.patch('/programacion/:id/estado', authorize('ADMINISTRADOR'),
  validate(idParam, 'params'), validate(estadoSchema), asyncHandler(ctrl.cambiarEstado));
router.delete('/programacion/:id', authorize('ADMINISTRADOR'),
  validate(idParam, 'params'), asyncHandler(ctrl.eliminar));

export default router;