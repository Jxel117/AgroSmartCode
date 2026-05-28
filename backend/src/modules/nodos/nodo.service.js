import { randomBytes, randomUUID } from 'node:crypto';
import * as repo from './nodo.repository.js';
import { hashPassword } from '../../utils/password.js';
import { AppError } from '../../utils/AppError.js';
import { registrarUsuarioBroker } from '../../mqtt/brokerAuth.js';

export async function listar(parcelaId) {
  return parcelaId ? repo.findByParcela(parcelaId) : repo.findAll();
}

export async function obtener(id) {
  const nodo = await repo.findById(id);
  if (!nodo) throw AppError.notFound('Nodo no encontrado');
  return nodo;
}

export async function crear(datos) {
  // Credenciales que usara el dispositivo
  const identificador = `nodo_${randomUUID().slice(0, 8)}`;
  const secretoPlano = randomBytes(24).toString('hex');
  const secretoHash = await hashPassword(secretoPlano);

  const nodo = await repo.createConCredencial(
    {
      parcelaId: datos.parcelaId ?? null,
      tipoSensor: datos.tipoSensor,
      modeloHardware: datos.modeloHardware ?? null,
      ubicacionDescriptiva: datos.ubicacionDescriptiva ?? null,
      latitud: datos.latitud ?? null,
      longitud: datos.longitud ?? null,
      protocoloComunicacion: datos.protocoloComunicacion ?? 'MQTT',
    },
    { identificador, secretoHash }
  );

  // Dar de alta tambien en el broker MQTT
  try {
    await registrarUsuarioBroker(identificador, secretoPlano);
  } catch (err) {
    console.error('Aviso: no se pudo registrar en el broker MQTT:', err.message);
    console.error('El nodo se creo en la base pero debes registrarlo manualmente en el broker.');
    // No interrumpimos: el nodo igual quedo creado en la base.
  }

  return {
    nodo,
    credenciales: {
      identificador,
      secreto: secretoPlano,
      aviso: 'Guarda este secreto ahora. No se volvera a mostrar.',
    },
  };
}

export async function actualizar(id, datos) {
  const nodo = await repo.update(id, {
    parcelaId: datos.parcelaId ?? null,
    tipoSensor: datos.tipoSensor,
    modeloHardware: datos.modeloHardware ?? null,
    ubicacionDescriptiva: datos.ubicacionDescriptiva ?? null,
    latitud: datos.latitud ?? null,
    longitud: datos.longitud ?? null,
    protocoloComunicacion: datos.protocoloComunicacion ?? 'MQTT',
    estado: datos.estado,
  });
  if (!nodo) throw AppError.notFound('Nodo no encontrado');
  return nodo;
}

export async function eliminar(id) {
  const ok = await repo.remove(id);
  if (!ok) throw AppError.notFound('Nodo no encontrado');
}