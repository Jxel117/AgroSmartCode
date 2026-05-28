import { z } from 'zod';

const tipoSuelo = z.enum(['HUMIFERO', 'ARENOSO', 'ARCILLOSO']);
const tipoCultivo = z.enum(['HORTALIZAS', 'FRUTOS_ROJOS']);

export const crearPerfilSchema = z.object({
  tipoSuelo,
  tipoCultivo,
  uminRecomendado: z.number().min(0).max(100),
  umaxRecomendado: z.number().min(0).max(100),
  uminCriticoRecomendado: z.number().min(0).max(100),
  tMaximoRecomendado: z.number(),
  tminRecomendado: z.number().int(),
  descripcionAgronomica: z.string().max(1000).optional(),
  fuenteReferencia: z.string().max(255).optional(),
}).refine((d) => d.uminCriticoRecomendado <= d.uminRecomendado, {
  message: 'umin_critico debe ser menor o igual que umin',
  path: ['uminCriticoRecomendado'],
}).refine((d) => d.uminRecomendado < d.umaxRecomendado, {
  message: 'umin debe ser menor que umax',
  path: ['uminRecomendado'],
});

export const actualizarPerfilSchema = z.object({
  tipoSuelo,
  tipoCultivo,
  uminRecomendado: z.number().min(0).max(100),
  umaxRecomendado: z.number().min(0).max(100),
  uminCriticoRecomendado: z.number().min(0).max(100),
  tMaximoRecomendado: z.number(),
  tminRecomendado: z.number().int(),
  descripcionAgronomica: z.string().max(1000).optional(),
  fuenteReferencia: z.string().max(255).optional(),
  estado: z.enum(['ACTIVO', 'DESHABILITADO']).default('ACTIVO'),
});

export const idParamSchema = z.object({ id: z.string().uuid() });