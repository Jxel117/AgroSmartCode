import { Router } from 'express';
import * as ctrl from './parcela.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  crearParcelaSchema, actualizarParcelaSchema, idParamSchema, asignacionSchema,
} from './parcela.schemas.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(ctrl.listar));
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(ctrl.obtener));

// Solo administrador de aqui en adelante
router.post('/', authorize('ADMINISTRADOR'), validate(crearParcelaSchema), asyncHandler(ctrl.crear));
router.put('/:id', authorize('ADMINISTRADOR'), validate(idParamSchema, 'params'),
  validate(actualizarParcelaSchema), asyncHandler(ctrl.actualizar));
router.delete('/:id', authorize('ADMINISTRADOR'), validate(idParamSchema, 'params'),
  asyncHandler(ctrl.eliminar));

router.post('/:id/agricultores', authorize('ADMINISTRADOR'),
  validate(idParamSchema, 'params'), validate(asignacionSchema), asyncHandler(ctrl.asignar));
router.delete('/:id/agricultores', authorize('ADMINISTRADOR'),
  validate(idParamSchema, 'params'), validate(asignacionSchema), asyncHandler(ctrl.desasignar));

router.get('/:id/agricultores',
  validate(idParamSchema, 'params'),
  asyncHandler(ctrl.listarAgricultores));

export default router;