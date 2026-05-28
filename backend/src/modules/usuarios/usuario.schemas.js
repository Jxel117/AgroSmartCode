import { z } from 'zod';

export const crearUsuarioSchema = z.object({
  nombre: z.string().min(2).max(100),
  apellido: z.string().min(2).max(100),
  correo: z.string().email().max(150),
  contra: z.string().min(8).max(72),
  rol: z.enum(['ADMINISTRADOR', 'AGRICULTOR']).default('AGRICULTOR'),
});

export const actualizarUsuarioSchema = z.object({
  nombre: z.string().min(2).max(100),
  apellido: z.string().min(2).max(100),
  rol: z.enum(['ADMINISTRADOR', 'AGRICULTOR']),
});

export const estadoUsuarioSchema = z.object({
  estado: z.enum(['ACTIVA', 'SUSPENDIDA', 'ELIMINADA']),
});

export const idParamSchema = z.object({ id: z.string().uuid() });