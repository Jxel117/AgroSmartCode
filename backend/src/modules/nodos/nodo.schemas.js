import { z } from 'zod';

const tipoSensor = z.enum(['HUMEDAD', 'TEMPERATURA', 'COMBINADO']);

export const crearNodoSchema = z.object({
  parcelaId: z.string().uuid().nullable().optional(),
  tipoSensor,
  modeloHardware: z.string().max(120).optional(),
  ubicacionDescriptiva: z.string().max(255).optional(),
  latitud: z.number().min(-90).max(90).nullable().optional(),
  longitud: z.number().min(-180).max(180).nullable().optional(),
  protocoloComunicacion: z.string().max(50).default('MQTT'),
});

export const actualizarNodoSchema = crearNodoSchema.extend({
  estado: z.enum(['SIN_CONFIGURAR', 'ACTIVO', 'DESCONECTADO', 'FALLO', 'INACTIVO']),
});

export const idParamSchema = z.object({ id: z.string().uuid() });