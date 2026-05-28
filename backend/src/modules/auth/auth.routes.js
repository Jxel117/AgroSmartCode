import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { registroSchema, loginSchema } from './auth.schemas.js';

const router = Router();

router.post('/registro', validate(registroSchema), asyncHandler(authController.registrar));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/logout', authenticate, asyncHandler(authController.logout));
router.get('/perfil', authenticate, asyncHandler(authController.perfil));

export default router;