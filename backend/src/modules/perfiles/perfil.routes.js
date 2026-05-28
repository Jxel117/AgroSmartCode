import { Router } from 'express';
import * as ctrl from './perfil.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { crearPerfilSchema, actualizarPerfilSchema, idParamSchema } from './perfil.schemas.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(ctrl.listar));
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(ctrl.obtener));
router.post('/', authorize('ADMINISTRADOR'), validate(crearPerfilSchema), asyncHandler(ctrl.crear));
router.put('/:id', authorize('ADMINISTRADOR'), validate(idParamSchema, 'params'),
  validate(actualizarPerfilSchema), asyncHandler(ctrl.actualizar));
router.delete('/:id', authorize('ADMINISTRADOR'), validate(idParamSchema, 'params'),
  asyncHandler(ctrl.eliminar));

export default router;