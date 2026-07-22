import { Router } from 'express';
import { z } from 'zod';
import * as ctrl from './usuario.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  crearUsuarioSchema, actualizarUsuarioSchema, estadoUsuarioSchema,
  cambiarPasswordSchema, idParamSchema,
  actualizarPerfilSchema,
} from './usuario.schemas.js';
import { esPasswordValida } from '../../utils/passwordPolicy.js';

const router = Router();

// ===== Endpoints del PROPIO perfil (cualquier usuario autenticado) =====
// IMPORTANTE: estas rutas deben ir ANTES de las rutas con /:id
// para que "/me" no sea interpretado como un id.
router.patch(
  '/me',
  authenticate,
  validate(actualizarPerfilSchema),
  asyncHandler(ctrl.actualizarPerfilPropio)
);

// Cambio de contrasena propia. Ambas rutas apuntan al mismo controlador:
// "/mi-password" es la que consume el frontend actual; "/me/password" se
// mantiene por coherencia con el resto de endpoints "/me".
router.patch(
  '/me/password',
  authenticate,
  validate(cambiarPasswordSchema),
  asyncHandler(ctrl.cambiarPassword)
);

// Cambio de contrasena propia (endpoint heredado)
router.patch(
  '/mi-password',
  authenticate,
  validate(cambiarPasswordSchema),
  asyncHandler(ctrl.cambiarPassword)
);

router.get('/agricultores', authenticate, authorize('ADMINISTRADOR'), asyncHandler(ctrl.listarAgricultores));

// Lectura de usuarios: administrador (solo su empresa) o auditor (todas las
// empresas: su cuenta no tiene empresa asignada, y listar() sin empresa trae todos)
router.get('/', authenticate, authorize('ADMINISTRADOR', 'AUDITOR'), asyncHandler(ctrl.listar));

// ===== De aqui en adelante, solo ADMINISTRADOR (mutaciones) =====
router.use(authenticate, authorize('ADMINISTRADOR'));

router.post('/', validate(crearUsuarioSchema), asyncHandler(ctrl.crear));
router.put('/:id', validate(idParamSchema, 'params'), validate(actualizarUsuarioSchema), asyncHandler(ctrl.actualizar));
router.patch('/:id/estado', validate(idParamSchema, 'params'), validate(estadoUsuarioSchema), asyncHandler(ctrl.cambiarEstado));
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(ctrl.eliminar));

// El admin resetea la contrasena de un usuario de su empresa
const resetPasswordSchema = z.object({
  passwordNueva: z.string().refine(esPasswordValida, {
    message: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial',
  }),
});
router.patch(
  '/:id/password',
  validate(idParamSchema, 'params'),
  validate(resetPasswordSchema),
  asyncHandler(ctrl.resetearPassword)
);

// El admin reenvia el correo de activacion (ej. si el primero no llego o expiro)
router.post(
  '/:id/reenviar-activacion',
  validate(idParamSchema, 'params'),
  asyncHandler(ctrl.reenviarActivacion)
);

router.get('/:id/parcelas', validate(idParamSchema, 'params'), asyncHandler(ctrl.listarParcelasDeAgricultor));
router.post('/:id/parcelas', validate(idParamSchema, 'params'), asyncHandler(ctrl.asignarParcela));
router.delete('/:id/parcelas', validate(idParamSchema, 'params'), asyncHandler(ctrl.desasignarParcela));

export default router;