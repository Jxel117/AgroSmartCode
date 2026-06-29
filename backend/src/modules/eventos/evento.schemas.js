import { z } from 'zod';

const categorias = [
  'AUTENTICACION', 'GESTION_USUARIO', 'GESTION_PARCELA',
  'GESTION_NODO', 'CONFIGURACION_RIEGO', 'OPERACION_AFD',
  'SISTEMA_IOT', 'REPORTE',
];

const resultados = ['EXITO', 'FALLO', 'PARCIAL'];

export const filtrosSchema = z.object({
  empresaId: z.string().optional(),
  categoria: z.enum(categorias).optional(),
  resultado: z.enum(resultados).optional(),
  usuarioId: z.string().uuid().optional(),
  correo: z.string().optional(),
  entidadTipo: z.string().optional(),
  fechaDesde: z.string().datetime().optional(),
  fechaHasta: z.string().datetime().optional(),
  cursor: z.string().datetime().optional(),
  limite: z.coerce.number().int().min(1).max(100).default(50),
});

export const exportSchema = z.object({
  empresaId: z.string().optional(),
  categoria: z.enum(categorias).optional(),
  fechaDesde: z.string().datetime().optional(),
  fechaHasta: z.string().datetime().optional(),
  formato: z.enum(['json', 'csv']).default('json'),
  limite: z.coerce.number().int().min(1).max(50000).default(10000),
});
