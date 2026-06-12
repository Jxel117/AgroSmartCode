import { Router } from 'express';
import { z } from 'zod';
import * as authController from './auth.controller.js';
import * as recuperacionCtrl from './recuperacion.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { registroSchema, loginSchema } from './auth.schemas.js';
import { esPasswordValida } from '../../utils/passwordPolicy.js';

const router = Router();

// Validador reutilizable: solo correos @gmail.com son aceptados
const correoGmail = z.string()
  .email('Correo no válido')
  .max(150)
  .refine(
    (correo) => correo.toLowerCase().endsWith('@gmail.com'),
    { message: 'Solo se aceptan correos @gmail.com como correo de validación' }
  );

// Schemas locales para los flujos de auth
const registrarEmpresaSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  apellido: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  correoValidacion: correoGmail,
  empresaIdentificador: z.string()
    .min(2, 'Mínimo 2 caracteres')
    .max(150, 'Máximo 150 caracteres')
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Solo letras, números, espacios, guiones y puntos'),
});

const solicitarSchema = z.object({
  correoValidacion: correoGmail,
});

const completarSchema = z.object({
  passwordNueva: z.string().refine(esPasswordValida, {
    message: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial',
  }),
});

// ===== Rutas =====

router.post('/registro', validate(registroSchema), asyncHandler(authController.registrar));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/logout', authenticate, asyncHandler(authController.logout));
router.get('/perfil', authenticate, asyncHandler(authController.perfil));

router.post('/registrar-empresa',
  validate(registrarEmpresaSchema),
  asyncHandler(authController.registrarEmpresa)
);

router.post('/recuperar/solicitar',
  validate(solicitarSchema),
  asyncHandler(recuperacionCtrl.solicitar)
);

router.get('/recuperar/verificar/:token',
  asyncHandler(recuperacionCtrl.verificar)
);

router.post('/recuperar/completar/:token',
  validate(completarSchema),
  asyncHandler(recuperacionCtrl.completar)
);

export {
  registrarEmpresaSchema,
  solicitarSchema,
  completarSchema
};


export default router;