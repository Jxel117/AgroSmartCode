import * as lecturaRepo from './lectura.repository.js';
import * as nodoRepo from '../nodos/nodo.repository.js';
import * as configRepo from '../riego/configuracion.repository.js';
import * as actuadorRepo from '../riego/actuador.repository.js';
import * as afdRepo from '../afd/afd.repository.js';
import * as alertaRepo from '../alertas/alerta.repository.js';
import { transitar, ESTADOS } from '../afd/afd.machine.js';

// Valida fisicamente la lectura y devuelve su estado
function clasificarLectura({ humedad, temperatura }) {
  if (humedad == null && temperatura == null) return 'ERROR_SENSOR_SIN_RESPUESTA';
  if (humedad != null && (humedad < 0 || humedad > 100)) return 'ERROR_FUERA_DE_RANGO';
  if (temperatura != null && (temperatura < -20 || temperatura > 70)) return 'ERROR_FUERA_DE_RANGO';
  return 'VALIDA';
}

export async function ingestar(nodoId, datos) {
  const nodo = await nodoRepo.findById(nodoId);
  if (!nodo) return null;

  const estadoLectura = clasificarLectura(datos);

  // 1. Guardar la lectura
  const lectura = await lecturaRepo.create({
    nodoId,
    humedad: datos.humedad ?? null,
    temperatura: datos.temperatura ?? null,
    estadoLectura,
  });
  await lecturaRepo.actualizarUltimaLecturaNodo(nodoId);

  const resultado = { lectura, transicion: null, alertas: [] };

  // 2. Si el nodo no esta asociado a una parcela, terminamos aqui
  if (!nodo.parcela_id) return resultado;

  // 3. Generar alertas por condiciones criticas
  const config = await configRepo.findVigente(nodo.parcela_id);
  if (estadoLectura !== 'VALIDA') {
    const a = await alertaRepo.create({
      parcelaId: nodo.parcela_id, nodoId,
      tipoAlerta: 'FALLO_SENSOR', severidad: 'CRITICA',
      mensaje: `Lectura invalida del nodo (${estadoLectura})`,
      valorDisparador: null,
    });
    resultado.alertas.push(a);
  } else if (config) {
    if (datos.humedad != null && Number(datos.humedad) < Number(config.umin_critico)) {
      resultado.alertas.push(await alertaRepo.create({
        parcelaId: nodo.parcela_id, nodoId,
        tipoAlerta: 'HUMEDAD_CRITICA_BAJA', severidad: 'CRITICA',
        mensaje: `Humedad critica: ${datos.humedad}%`, valorDisparador: datos.humedad,
      }));
    }
    if (datos.temperatura != null && Number(datos.temperatura) > Number(config.t_maximo)) {
      resultado.alertas.push(await alertaRepo.create({
        parcelaId: nodo.parcela_id, nodoId,
        tipoAlerta: 'TEMPERATURA_CRITICA_ALTA', severidad: 'ADVERTENCIA',
        mensaje: `Temperatura alta: ${datos.temperatura}C`, valorDisparador: datos.temperatura,
      }));
    }
  }

  // 4. Correr el AFD solo si hay configuracion de riego
  if (!config) return resultado;

  const afd = await afdRepo.findOrCreateByParcela(nodo.parcela_id, config.n_intentos_fallidos_max);

  const decision = transitar({
    estadoActual: afd.estado_actual,
    contadorFallidos: afd.contador_intentos_fallidos,
    nIntentosMax: afd.n_intentos_fallidos_max,
    config,
    lectura: {
      humedad: datos.humedad,
      temperatura: datos.temperatura,
      estadoLectura,
    },
  });

  // Solo registramos transicion si cambia el estado o hay accion
  if (decision.estadoDestino !== afd.estado_actual || decision.accionActuador) {
    await afdRepo.aplicarTransicion(afd, {
      estadoOrigen: afd.estado_actual,
      estadoDestino: decision.estadoDestino,
      simbolo: decision.simbolo,
      humedad: datos.humedad ?? null,
      temperatura: datos.temperatura ?? null,
      causa: decision.causa,
      contadorIntentos: decision.contadorFallidos,
    });

    if (decision.accionActuador === 'ENCENDER') {
      await actuadorRepo.setEstado(nodo.parcela_id, true);
    } else if (decision.accionActuador === 'APAGAR') {
      await actuadorRepo.setEstado(nodo.parcela_id, false);
    }

    resultado.transicion = {
      estadoOrigen: afd.estado_actual,
      estadoDestino: decision.estadoDestino,
      simbolo: decision.simbolo,
      causa: decision.causa,
      accionActuador: decision.accionActuador,
    };
  }

  return resultado;
}

export async function lecturasRecientes(parcelaId, limite) {
  return lecturaRepo.findRecientesPorParcela(parcelaId, limite);
}