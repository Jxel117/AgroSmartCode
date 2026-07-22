import mqtt from 'mqtt';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { env } from '../config/env.js';
import { TOPICS, parseTopicNodo, topicConfigNodo, topicComandoNodo } from './topics.js';
import * as lecturaService from '../modules/lecturas/lectura.service.js';
import * as nodoRepo from '../modules/nodos/nodo.repository.js';
import * as configRepo from '../modules/riego/configuracion.repository.js';
import * as afdRepo from '../modules/afd/afd.repository.js';
import * as actuadorRepo from '../modules/riego/actuador.repository.js';
import { emitirEstadoRiego, emitirTransicionAfd } from '../realtime/index.js';
import { emitir } from '../audit/audit.emitter.js';

let cliente = null;

// Cola serial de procesamiento de mensajes MQTT (evita race conditions)
let colaMensajes = Promise.resolve();

export function getMqttClient() {
  return cliente;
}

export function iniciarMqtt() {
  if (!env.mqtt.enabled) {
    console.log('MQTT deshabilitado (MQTT_ENABLED=false). Se omite la conexion.');
    return null;
  }

  // Opciones de conexion al broker
  const opciones = {
    username: env.mqtt.username,
    password: env.mqtt.password,
    reconnectPeriod: 5000,
    connectTimeout: 30000,
    clean: true,
  };

  if (env.mqtt.url.startsWith('mqtts://') && env.mqtt.caPath) {
    opciones.ca = readFileSync(resolve(env.mqtt.caPath));
    opciones.rejectUnauthorized = false;
  }

  console.log(`Conectando a MQTT en ${env.mqtt.url} ...`);
  cliente = mqtt.connect(env.mqtt.url, opciones);

  cliente.on('connect', () => {
    console.log('MQTT conectado al broker.');
    cliente.subscribe(
      [TOPICS.ESTADO_SUB, TOPICS.TELEMETRIA_SUB, TOPICS.RIEGO_STATUS_SUB],
      { qos: 1 },
      (err) => {
        if (err) console.error('Error al suscribirse:', err.message);
        else console.log('Suscrito a topics de telemetria, estado y riegostatus (QoS 1).');
      }
    );
  });

  cliente.on('message', (topic, payload) => {
    colaMensajes = colaMensajes.then(() =>
      manejarMensaje(topic, payload).catch((e) =>
        console.error('Error procesando mensaje MQTT:', e.message)
      )
    );
  });

  cliente.on('reconnect', () => console.log('MQTT reconectando...'));
  cliente.on('error', (err) => console.error('Error MQTT:', err.message));
  cliente.on('close', () => console.log('Conexion MQTT cerrada.'));

  return cliente;
}

async function manejarMensaje(topic, payload) {
  const info = parseTopicNodo(topic);
  if (!info) return;

  let nodoId = info.idNodo;
  if (!nodoId.includes('-')) {
    const credencial = await nodoRepo.findByCredencialIdentificador(nodoId);
    if (credencial) nodoId = credencial.id_nodo;
  }

  if (info.tipo === 'telemetria') {
    const estadoNodo = await nodoRepo.findById(nodoId);
    if (estadoNodo && estadoNodo.estado !== 'ACTIVO') {
      return;
    }

    let datos;
    try {
      datos = JSON.parse(payload.toString());
    } catch {
      console.warn(`Payload MQTT no es JSON valido en ${topic}`);
      return;
    }

    const resultado = await lecturaService.ingestar(nodoId, {
      humedad: datos.humedad ?? null,
      temperatura: datos.temperatura ?? null,
      autonomo: datos.autonomo === true,
    });

    if (resultado?.transicion) {
      console.log(
        `AFD parcela ${info.idParcela}: ${resultado.transicion.estadoOrigen} -> ` +
        `${resultado.transicion.estadoDestino} ` +
        `(${resultado.transicion.accionActuador ?? 'sin accion'})`
      );
    }
  } else if (info.tipo === 'estado') {
    const estado = payload.toString().trim().toLowerCase();
    const nuevoEstado = estado === 'offline' ? 'DESCONECTADO' : 'ACTIVO';
    try {
      const anterior = await nodoRepo.findById(nodoId);
      await nodoRepo.actualizarEstado(nodoId, nuevoEstado);
      console.log(`Nodo ${nodoId} -> ${nuevoEstado}`);

      if (anterior && anterior.estado !== nuevoEstado) {
        emitir({
          categoria: 'SISTEMA_IOT',
          accion: nuevoEstado === 'DESCONECTADO' ? 'DISPOSITIVO_DESCONECTADO' : 'DISPOSITIVO_CONECTADO',
          resultado: nuevoEstado === 'DESCONECTADO' ? 'FALLO' : 'EXITO',
          actor: { empresa_id: anterior.empresa_identificador ?? null },
          recurso: { entidad_tipo: 'nodo', entidad_id: nodoId },
          metadatos: {
            estado_anterior: anterior.estado,
            estado_nuevo: nuevoEstado,
            parcela_id: anterior.parcela_id ?? null,
          },
        });
      }

      if (nuevoEstado === 'DESCONECTADO') {
        const nodo = await nodoRepo.findById(nodoId);
        if (nodo?.parcela_id) {
          await afdRepo.resetToMonitoreo(nodo.parcela_id);
          await actuadorRepo.setEstado(nodo.parcela_id, false);
          console.log(`Parcela ${nodo.parcela_id}: AFD reseteado y actuador INACTIVO`);

          emitir({
            categoria: 'OPERACION_AFD', accion: 'AFD_REINICIADO_POR_DESCONEXION', resultado: 'FALLO',
            actor: { empresa_id: nodo.empresa_identificador ?? null },
            recurso: { entidad_tipo: 'parcela', entidad_id: nodo.parcela_id },
            metadatos: { nodo_id: nodoId, motivo: 'Nodo desconectado: AFD a S0_MONITOREO y actuador INACTIVO' },
          });
        }
      } else if (nuevoEstado === 'ACTIVO') {
        // Nodo conectado: publicar configuracion de riego si existe
        await publicarConfigSiExiste(nodoId);
      }
    } catch (e) {
      console.error('No se pudo actualizar estado del nodo:', e.message);
    }
  } else if (info.tipo === 'riegostatus') {
    try {
      const raw = payload.toString();
      console.log(`[RIEGO RAW] topic=${topic} payload=${raw}`);
      let datos;
      try {
        datos = JSON.parse(raw);
      } catch {
        console.warn(`[RIEGO] Payload no JSON: ${raw}`);
        return;
      }
      console.log(`[RIEGO PARSED] estado=${datos.estado} mensaje="${datos.mensaje}" segundos=${datos.segundos}`);

      const nodo = await nodoRepo.findById(nodoId);
      if (!nodo) { console.warn(`[RIEGO] Nodo no encontrado: ${nodoId}`); return; }
      console.log(`[RIEGO NODO] id=${nodoId} parcela=${nodo.parcela_id} empresa=${nodo.empresa_identificador} estado=${nodo.estado}`);

      const parcelaId = nodo.parcela_id;
      if (!parcelaId) { console.warn(`[RIEGO] Nodo ${nodoId} sin parcela`); return; }

      const empresaId = nodo.empresa_identificador;
      if (!empresaId) { console.warn(`[RIEGO] Nodo ${nodoId} sin empresa_identificador, no se emitira WS`); }

      // Actualizar estado del actuador segun el reporte del nodo
      if (datos.estado === 'REGANDO') {
        await actuadorRepo.setEstado(parcelaId, true);
        console.log(`[RIEGO] Actuador ON parcela=${parcelaId}`);
      } else if (datos.estado === 'DETENIDO' || datos.estado === 'COMPLETADO') {
        await actuadorRepo.setEstado(parcelaId, false);
        console.log(`[RIEGO] Actuador OFF parcela=${parcelaId}`);
      }

      const config = await configRepo.findVigente(parcelaId);
      console.log(`[RIEGO CONFIG] encontrada=${!!config} umin=${config?.umin} umax=${config?.umax}`);

      const mapeoEstadoAFD = {
        NORMAL: 'S0_MONITOREO',
        EVALUANDO: 'S1_EVALUACION',
        PREPARANDO: 'S1_EVALUACION',
        REGANDO: 'S2_RIEGO_ACTIVO',
        DETENIDO: 'S3_RIEGO_DETENIDO',
        COMPLETADO: 'S3_RIEGO_DETENIDO',
      };
      const estadoAFD = mapeoEstadoAFD[datos.estado];

      if (estadoAFD) {
        const afd = await afdRepo.findOrCreateByParcela(parcelaId, config?.n_intentos_fallidos_max ?? 3);
        console.log(`[RIEGO AFD] actual=${afd.estado_actual} nuevo=${estadoAFD} cambia=${afd.estado_actual !== estadoAFD}`);
        if (afd.estado_actual !== estadoAFD) {
          const estadoAnterior = afd.estado_actual;
          await afdRepo.aplicarTransicion(afd, {
            estadoOrigen: estadoAnterior,
            estadoDestino: estadoAFD,
            simbolo: 'M_REPORTE_AUTONOMO',
            humedad: null,
            temperatura: null,
            causa: datos.mensaje ?? 'Reporte de nodo autonomo',
            contadorIntentos: 0,
          });
          // Actualizar el objeto local para reflejar el nuevo estado
          afd.estado_actual = estadoAFD;
          console.log(`[RIEGO AFD] Transicion aplicada: ${estadoAnterior} -> ${estadoAFD}`);

          const accion = datos.estado === 'REGANDO' ? 'ENCENDER' :
                         (datos.estado === 'DETENIDO' || datos.estado === 'COMPLETADO') ? 'APAGAR' : null;

          if (empresaId) {
            emitirTransicionAfd(empresaId, {
              parcela_id: parcelaId,
              estadoOrigen: estadoAnterior,
              estadoDestino: estadoAFD,
              simbolo: 'M_REPORTE_AUTONOMO',
              causa: datos.mensaje ?? 'Reporte de nodo autonomo',
              accionActuador: accion,
              timestamp: new Date().toISOString(),
            });
            console.log(`[RIEGO WS] transicion_afd emitido a empresa=${empresaId} (${estadoAnterior}->${estadoAFD})`);
          }
        }
      } else {
        console.warn(`[RIEGO] Estado no mapeable a AFD: ${datos.estado}`);
      }

      if (empresaId) {
        emitirEstadoRiego(empresaId, {
          parcela_id: parcelaId,
          estado: datos.estado,
          mensaje: datos.mensaje ?? '',
          segundos: datos.segundos ?? 0,
          timestamp: new Date().toISOString(),
        });
        console.log(`[RIEGO WS] estado_riego emitido a empresa=${empresaId} estado=${datos.estado}`);
      }

      console.log(`[RIEGO OK] Nodo ${nodoId}: estado=${datos.estado} mensaje="${datos.mensaje}"`);
    } catch (e) {
      console.error(`[RIEGO ERROR] Nodo ${nodoId}: ${e.message}`);
      console.error(e.stack);
    }
  }
}

/**
 * Publica la configuracion de riego vigente al nodo si existe.
 */
async function publicarConfigSiExiste(nodoId) {
  if (!cliente || !cliente.connected) return;

  const nodo = await nodoRepo.findById(nodoId);
  if (!nodo?.parcela_id) return;

  const config = await configRepo.findVigente(nodo.parcela_id);
  if (!config) return;

  const topic = topicConfigNodo(nodo.parcela_id, nodoId);
  const payload = JSON.stringify({
    umin: Number(config.umin),
    umax: Number(config.umax),
    timestamp: new Date().toISOString(),
  });

  cliente.publish(topic, payload, { qos: 1, retain: true }, (err) => {
    if (err) console.error(`[MQTT] Error publicando config: ${err.message}`);
    else console.log(`[MQTT] Config publicada -> ${topic} (umin=${config.umin}, umax=${config.umax})`);
  });
}

/**
 * Publica configuracion de riego a TODOS los nodos de una parcela.
 */
export async function publicarConfigParcela(parcelaId) {
  if (!cliente || !cliente.connected) {
    console.warn('[MQTT] No se pudo publicar config: cliente no conectado');
    return;
  }

  const config = await configRepo.findVigente(parcelaId);
  if (!config) return;

  const nodos = await nodoRepo.findByParcela(parcelaId);
  for (const nodo of nodos) {
    const topic = topicConfigNodo(parcelaId, nodo.id_nodo);
    const payload = JSON.stringify({
      umin: Number(config.umin),
      umax: Number(config.umax),
      timestamp: new Date().toISOString(),
    });

    cliente.publish(topic, payload, { qos: 1, retain: true }, (err) => {
      if (err) console.error(`[MQTT] Error publicando config a ${nodo.id_nodo}: ${err.message}`);
      else console.log(`[MQTT] Config -> ${topic} (umin=${config.umin}, umax=${config.umax})`);
    });
  }
}

/**
 * Publica un comando a un nodo concreto. Usado por el AFD cuando decide
 * encender o apagar el riego (modo no autonomo).
 */
export function publicarComandoNodo(idParcela, idNodo, accion, causa) {
  if (!cliente || !cliente.connected) {
    console.warn(`[MQTT] No se pudo publicar comando ${accion}: cliente no conectado`);
    return false;
  }
  const topic = topicComandoNodo(idParcela, idNodo);
  const payload = JSON.stringify({
    accion,
    causa: causa ?? '',
    timestamp: new Date().toISOString(),
  });
  cliente.publish(topic, payload, { qos: 1 }, (err) => {
    if (err) console.error(`[MQTT] Error publicando comando: ${err.message}`);
    else console.log(`[MQTT] Comando ${accion} -> ${topic}`);
  });
  return true;
}

export function cerrarMqtt() {
  return new Promise((resolve) => {
    if (!cliente) return resolve();
    cliente.end(false, {}, () => {
      console.log('Cliente MQTT cerrado.');
      resolve();
    });
  });
}
