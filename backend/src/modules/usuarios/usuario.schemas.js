import { z } from 'zod';
import { esPasswordValida } from '../../utils/passwordPolicy.js';

const passwordFuerte = z.string().refine(esPasswordValida, {
  message: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial',
});

export const crearUsuarioSchema = z.object({
  nombre: z.string().min(2).max(100),
  apellido: z.string().min(2).max(100),
  correoValidacion: z.string()
    .email('Correo no válido')
    .max(150)
    .refine(
      (correo) => correo.toLowerCase().endsWith('@gmail.com'),
      { message: 'Solo se aceptan correos @gmail.com como correo de validación' }
    ),
  contra: passwordFuerte,
  rol: z.enum(['ADMINISTRADOR', 'AGRICULTOR']).default('AGRICULTOR'),
});

export const actualizarUsuarioSchema = z.object({
  nombre: z.string().min(2).max(100),
  apellido: z.string().min(2).max(100),
  // OJO: ya NO permitimos cambiar el rol aqui (roles estrictos, ver B.3)
});

export const estadoUsuarioSchema = z.object({
  estado: z.enum(['ACTIVA', 'SUSPENDIDA', 'ELIMINADA']),
});

export const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1),
  passwordNueva: passwordFuerte,
});

export const idParamSchema = z.object({ id: z.string().uuid() });