import { z } from 'zod';
import { esPasswordValida } from '../../utils/passwordPolicy.js';

export const registroSchema = z.object({
  nombre: z.string().min(2).max(100),
  apellido: z.string().min(2).max(100),
  correoValidacion: z.string().email().max(150),
  contra: z.string().refine(esPasswordValida, {
    message: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial',
  }),
  rol: z.enum(['ADMINISTRADOR', 'AGRICULTOR']).default('ADMINISTRADOR'),
  empresaIdentificador: z.string().min(2).max(150),
});

export const loginSchema = z.object({
  correo: z.string().email(),
  contra: z.string().min(1),
  captchaToken: z.string().optional(),
});