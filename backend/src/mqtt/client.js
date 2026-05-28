import mqtt from 'mqtt';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { env } from '../config/env.js';
import { TOPICS, parseTopicNodo } from './topics.js';
import * as lecturaService from '../modules/lecturas/lectura.service.js';
import * as nodoRepo from '../modules/nodos/nodo.repository.js';

let cliente = null;

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
    reconnectPeriod: 5000,   // reintenta cada 5s si la conexion se cae
    connectTimeout: 30000,
    clean: true,
  };

  // Si la URL es mqtts:// (TLS), cargamos el certificado de la CA
  if (env.mqtt.url.startsWith('mqtts://') && env.mqtt.caPath) {
    opciones.ca = readFileSync(resolve(env.mqtt.caPath));
    opciones.rejectUnauthorized = true; // exige certificado valido del broker
  }

  console.log(`Conectando a MQTT en ${env.mqtt.url} ...`);
  cliente = mqtt.connect(env.mqtt.url, opciones);

  // Eventos del cliente
  cliente.on('connect', () => {
    console.log('MQTT conectado al broker.');
    cliente.subscribe(
      [TOPICS.TELEMETRIA_SUB, TOPICS.ESTADO_SUB],
      { qos: 1 },
      (err) => {
        if (err) console.error('Error al suscribirse:', err.message);
        else console.log('Suscrito a topics de telemetria y estado (QoS 1).');
      }
    );
  });

  cliente.on('message', (topic, payload) => {
    manejarMensaje(topic, payload).catch((e) =>
      console.error('Error procesando mensaje MQTT:', e.message)
    );
  });

  cliente.on('reconnect', () => console.log('MQTT reconectando...'));
  cliente.on('error', (err) => console.error('Error MQTT:', err.message));
  cliente.on('close', () => console.log('Conexion MQTT cerrada.'));

  return cliente;
}

// Procesa cada mensaje entrante segun el tipo de topic
async function manejarMensaje(topic, payload) {
  const info = parseTopicNodo(topic);
  if (!info) return; // topic desconocido, lo ignoramos

  if (info.tipo === 'telemetria') {
    // Parsear el JSON de la lectura
    let datos;
    try {
      datos = JSON.parse(payload.toString());
    } catch {
      console.warn(`Payload MQTT no es JSON valido en ${topic}`);
      return;
    }

    // Reutilizamos la MISMA logica que el endpoint REST
    const resultado = await lecturaService.ingestar(info.idNodo, {
      humedad: datos.humedad ?? null,
      temperatura: datos.temperatura ?? null,
    });

    if (resultado?.transicion) {
      console.log(
        `AFD parcela ${info.idParcela}: ${resultado.transicion.estadoOrigen} -> ` +
        `${resultado.transicion.estadoDestino} ` +
        `(${resultado.transicion.accionActuador ?? 'sin accion'})`
      );
    }
  } else if (info.tipo === 'estado') {
    // Mensaje de estado del nodo (typicamente via LWT del cliente)
    const estado = payload.toString().trim().toLowerCase();
    const nuevoEstado = estado === 'offline' ? 'DESCONECTADO' : 'ACTIVO';
    try {
      await nodoRepo.actualizarEstado(info.idNodo, nuevoEstado);
      console.log(`Nodo ${info.idNodo} -> ${nuevoEstado}`);
    } catch (e) {
      console.error('No se pudo actualizar estado del nodo:', e.message);
    }
  }
}

// Cierre ordenado del cliente
export function cerrarMqtt() {
  return new Promise((resolve) => {
    if (!cliente) return resolve();
    cliente.end(false, {}, () => {
      console.log('Cliente MQTT cerrado.');
      resolve();
    });
  });
}