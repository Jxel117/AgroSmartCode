import { z } from 'zod';

export const registroSchema = z.object({
  nombre: z.string().min(2).max(100),
  apellido: z.string().min(2).max(100),
  correo: z.string().email().max(150),
  contra: z.string().min(8).max(72), // bcrypt limita a 72 bytes
  rol: z.enum(['ADMINISTRADOR', 'AGRICULTOR']).default('AGRICULTOR'),
});

export const loginSchema = z.object({
  correo: z.string().email(),
  contra: z.string().min(1),
});