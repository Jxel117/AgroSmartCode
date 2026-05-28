import { Router } from 'express';
import * as ctrl from './nodo.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { crearNodoSchema, actualizarNodoSchema, idParamSchema } from './nodo.schemas.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(ctrl.listar));
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(ctrl.obtener));
router.post('/', authorize('ADMINISTRADOR'), validate(crearNodoSchema), asyncHandler(ctrl.crear));
router.put('/:id', authorize('ADMINISTRADOR'), validate(idParamSchema, 'params'),
  validate(actualizarNodoSchema), asyncHandler(ctrl.actualizar));
router.delete('/:id', authorize('ADMINISTRADOR'), validate(idParamSchema, 'params'),
  asyncHandler(ctrl.eliminar));

export default router;