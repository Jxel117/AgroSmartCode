import { Router } from 'express';
import * as ctrl from './usuario.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  crearUsuarioSchema, actualizarUsuarioSchema, estadoUsuarioSchema, idParamSchema,
} from './usuario.schemas.js';

const router = Router();

// Todas las rutas requieren ser ADMINISTRADOR
router.use(authenticate, authorize('ADMINISTRADOR'));

router.get('/', asyncHandler(ctrl.listar));
router.get('/agricultores', asyncHandler(ctrl.listarAgricultores));
router.post('/', validate(crearUsuarioSchema), asyncHandler(ctrl.crear));
router.put('/:id', validate(idParamSchema, 'params'), validate(actualizarUsuarioSchema), asyncHandler(ctrl.actualizar));
router.patch('/:id/estado', validate(idParamSchema, 'params'), validate(estadoUsuarioSchema), asyncHandler(ctrl.cambiarEstado));
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(ctrl.eliminar));


export default router;