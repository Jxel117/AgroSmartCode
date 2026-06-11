import { randomBytes, randomUUID } from 'node:crypto';
import * as repo from './nodo.repository.js';
import { hashPassword } from '../../utils/password.js';
import { AppError } from '../../utils/AppError.js';
import { registrarUsuarioBroker } from '../../mqtt/brokerAuth.js';

// Valores fijos del hardware estándar de AgroSmart
const HARDWARE_COMBINADO = 'COMBINADO';
const MODELO_HARDWARE_ESTANDAR = 'ESP32 + Capacitivo + DHT22';

export async function listar(empresa) {
  return repo.findByEmpresa(empresa);
}

export async function obtener(id) {
  const nodo = await repo.findById(id);
  if (!nodo) throw AppError.notFound('Dispositivo no encontrado');
  return nodo;
}

export async function crear(datos, empresa) {
  // Credenciales que usará el dispositivo
  const identificador = `nodo_${randomUUID().slice(0, 8)}`;
  const secretoPlano = randomBytes(24).toString('hex');
  const secretoHash = await hashPassword(secretoPlano);

  const nodo = await repo.createConCredencial(
    {
      parcelaId: datos.parcelaId ?? null,
      tipoSensor: HARDWARE_COMBINADO,                  // siempre combinado
      modeloHardware: MODELO_HARDWARE_ESTANDAR,        // siempre estándar
      ubicacionDescriptiva: datos.ubicacionDescriptiva ?? null,
      latitud: datos.latitud ?? null,
      longitud: datos.longitud ?? null,
      protocoloComunicacion: datos.protocoloComunicacion ?? 'MQTT',
      empresaIdentificador: empresa,
    },
    { identificador, secretoHash }
  );

  // Dar de alta también en el broker MQTT
  try {
    await registrarUsuarioBroker(identificador, secretoPlano);
  } catch (err) {
    console.error('Aviso: no se pudo registrar en el broker MQTT:', err.message);
    console.error('El nodo se creó en la base pero debes registrarlo manualmente en el broker.');
  }

  return {
    nodo,
    credenciales: {
      identificador,
      secreto: secretoPlano,
      aviso: 'Guarda este secreto ahora. No se volverá a mostrar.',
    },
  };
}

export async function actualizar(id, datos) {
  const actual = await repo.findById(id);
  if (!actual) throw AppError.notFound('Dispositivo no encontrado');

  const nodo = await repo.update(id, {
    parcelaId: datos.parcelaId ?? null,
    tipoSensor: actual.tipo_sensor,                    // se mantiene el valor existente
    modeloHardware: actual.modelo_hardware,            // se mantiene el valor existente
    ubicacionDescriptiva: datos.ubicacionDescriptiva ?? null,
    latitud: datos.latitud ?? null,
    longitud: datos.longitud ?? null,
    protocoloComunicacion: datos.protocoloComunicacion ?? actual.protocolo_comunicacion ?? 'MQTT',
    estado: actual.estado,                             // no se cambia desde aquí
  });
  return nodo;
}

// Endpoint nuevo: cambio manual de estado (solo ACTIVO ↔ INACTIVO)
export async function cambiarEstado(id, nuevoEstado) {
  const actual = await repo.findById(id);
  if (!actual) throw AppError.notFound('Dispositivo no encontrado');

  // Bloquear cambios manuales cuando el sistema marcó FALLO o DESCONECTADO
  if (actual.estado === 'FALLO') {
    throw AppError.badRequest('El dispositivo está en estado FALLO. Resuelva el problema antes de cambiar su estado.');
  }

  const actualizado = await repo.actualizarEstado(id, nuevoEstado);
  return actualizado;
}

export async function eliminar(id) {
  const ok = await repo.remove(id);
  if (!ok) throw AppError.notFound('Dispositivo no encontrado');
}