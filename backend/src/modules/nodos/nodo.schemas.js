import { z } from 'zod';

const tipoSensor = z.enum(['HUMEDAD', 'TEMPERATURA', 'COMBINADO']);

// Crear: tipoSensor y modeloHardware se ignoran y se fuerzan en el servicio
export const crearNodoSchema = z.object({
  parcelaId: z.string().uuid().nullable().optional(),
  tipoSensor: tipoSensor.optional(),
  modeloHardware: z.string().max(120).optional(),
  ubicacionDescriptiva: z.string().max(255).optional(),
  latitud: z.number().min(-90).max(90).nullable().optional(),
  longitud: z.number().min(-180).max(180).nullable().optional(),
  protocoloComunicacion: z.string().max(50).default('MQTT'),
});

// Actualizar: igual, pero el estado lo dejamos sin tocar aquí
// (los cambios de estado van por endpoint dedicado)
export const actualizarNodoSchema = z.object({
  parcelaId: z.string().uuid().nullable().optional(),
  ubicacionDescriptiva: z.string().max(255).optional(),
  latitud: z.number().min(-90).max(90).nullable().optional(),
  longitud: z.number().min(-180).max(180).nullable().optional(),
  protocoloComunicacion: z.string().max(50).optional(),
});

// Para el endpoint nuevo de cambio de estado manual
export const cambiarEstadoNodoSchema = z.object({
  estado: z.enum(['ACTIVO', 'INACTIVO']),
});

export const idParamSchema = z.object({ id: z.string().uuid() });