import { z } from 'zod';

export const ingestaSchema = z.object({
  humedad: z.number().min(-50).max(150).nullable().optional(),
  temperatura: z.number().min(-50).max(100).nullable().optional(),
  timestamp: z.string().datetime().optional(),
}).refine((d) => d.humedad != null || d.temperatura != null, {
  message: 'Debe incluir al menos humedad o temperatura',
});

export const parcelaParamSchema = z.object({ parcelaId: z.string().uuid() });