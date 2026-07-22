import { z } from 'zod';
import { esPasswordValida } from '../../utils/passwordPolicy.js';
import { AVATARES_DISPONIBLES } from './avatares.js';

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
  // Los AGRICULTOR no traen contrasena: se activan via enlace enviado por correo.
  contra: passwordFuerte.optional(),
  rol: z.enum(['ADMINISTRADOR', 'AGRICULTOR']).default('AGRICULTOR'),
}).refine(
  (datos) => datos.rol !== 'ADMINISTRADOR' || !!datos.contra,
  { message: 'La contraseña es obligatoria para el rol ADMINISTRADOR', path: ['contra'] }
);

export const actualizarUsuarioSchema = z.object({
  nombre: z.string().min(2).max(100),
  apellido: z.string().min(2).max(100),
  // OJO: ya NO permitimos cambiar el rol aqui (roles estrictos, ver B.3)
});

export const estadoUsuarioSchema = z.object({
  estado: z.enum(['ACTIVA', 'SUSPENDIDA', 'ELIMINADA']),
});

export const idParamSchema = z.object({ id: z.string().uuid() });

// Schema para actualizar perfil propio
export const actualizarPerfilSchema = z.object({
  nombre: z.string().trim().min(2).max(60).optional(),
  apellido: z.string().trim().min(2).max(60).optional(),
  avatar_id: z.enum([...AVATARES_DISPONIBLES, '']).nullable().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Debes enviar al menos un campo a actualizar' }
);

// Schema para cambiar contrasena
export const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1, 'Contraseña actual requerida'),
  passwordNueva: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
    .regex(/[a-z]/, 'Debe incluir al menos una minúscula')
    .regex(/[0-9]/, 'Debe incluir al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe incluir al menos un símbolo'),
});