import { z } from 'zod';

const tipoSuelo = z.enum(['HUMIFERO', 'ARENOSO', 'ARCILLOSO']);
const tipoCultivo = z.enum(['HORTALIZAS', 'FRUTOS_ROJOS']);

export const crearParcelaSchema = z.object({
  nombreDescriptivo: z.string().min(2).max(150),
  tipoSuelo,
  tipoCultivo,
  ubicacionDescriptiva: z.string().max(255).optional(),
  latitud: z.number().min(-90).max(90).nullable().optional(),
  longitud: z.number().min(-180).max(180).nullable().optional(),
  areaM2: z.number().positive().nullable().optional(),
});

export const actualizarParcelaSchema = crearParcelaSchema.extend({
  estado: z.enum(['ACTIVA', 'INACTIVA']).default('ACTIVA'),
});

export const idParamSchema = z.object({ id: z.string().uuid() });

export const asignacionSchema = z.object({ usuarioId: z.string().uuid() });