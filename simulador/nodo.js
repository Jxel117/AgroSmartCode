// Simulador de nodo AgroSmart.
// Hace de ESP32: conecta al broker por TLS, publica lecturas periodicas,
// configura LWT para reportar desconexiones.
//
// Uso:
//   node nodo.js \
//     --idParcela <UUID> --idNodo <UUID> \
//     --usuario <id> --password <secreto>
//
// El simulador mantiene una humedad simulada que se reduce con el tiempo
// (suelo secandose). Para representar un riego activo, presiona "r" en
// la terminal: la humedad subira de golpe (como si la bomba regara).

import mqtt from 'mqtt';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ----- Argumentos -----
function arg(nombre) {
  const i = process.argv.indexOf(`--${nombre}`);
  return i >= 0 ? process.argv[i + 1] : null;
}

const idParcela = arg('idParcela');
const idNodo = arg('idNodo');
const usuario = arg('usuario');
const password = arg('password');
const intervaloMs = parseInt(arg('intervalo') ?? '5000', 10);
const url = arg('url') ?? 'mqtts://localhost:8883';
const caPath = arg('ca') ?? resolve(__dirname, '../mqtt/certs/ca.crt');

if (!idParcela || !idNodo || !usuario || !password) {
  console.error('Faltan argumentos. Uso:');
  console.error('  node nodo.js --idParcela <UUID> --idNodo <UUID> --usuario <id> --password <secreto>');
  process.exit(1);
}

// ----- Topics -----
const topicTelemetria = `agrosmart/parcela/${idParcela}/nodo/${idNodo}/telemetria`;
const topicEstado = `agrosmart/parcela/${idParcela}/nodo/${idNodo}/estado`;

// ----- Estado simulado del entorno -----
let humedad = 60;          // %
let temperaturaBase = 22;  // °C
let regando = false;

function leerSensor() {
  // Si esta regando, la humedad sube rapido; si no, baja lentamente
  if (regando) humedad = Math.min(100, humedad + 4 + Math.random() * 2);
  else humedad = Math.max(5, humedad - 0.7 - Math.random() * 0.6);

  const temperatura = temperaturaBase + (Math.random() * 2 - 1);
  return {
    humedad: Math.round(humedad * 10) / 10,
    temperatura: Math.round(temperatura * 10) / 10,
  };
}

// ----- Conexion -----
const opciones = {
  username: usuario,
  password,
  ca: readFileSync(caPath),
  rejectUnauthorized: true,
  reconnectPeriod: 5000,
  // LWT: si el nodo se cae sin avisar, el broker publicara este mensaje (RF-04 CA6)
  will: {
    topic: topicEstado,
    payload: 'offline',
    qos: 1,
    retain: true,
  },
};

console.log(`Conectando como ${usuario} a ${url} ...`);
const cliente = mqtt.connect(url, opciones);

cliente.on('connect', () => {
  console.log('Conectado.');
  // Anunciar que estamos en linea
  cliente.publish(topicEstado, 'online', { qos: 1, retain: true });
  console.log(`Publicando en: ${topicTelemetria}`);
  console.log(`Intervalo: ${intervaloMs} ms`);
  console.log('Presiona "r" para simular riego activo, "s" para detenerlo, Ctrl+C para salir.\n');
  iniciarPublicacion();
});

cliente.on('error', (err) => console.error('Error MQTT:', err.message));
cliente.on('reconnect', () => console.log('Reconectando...'));
cliente.on('close', () => console.log('Conexion cerrada.'));

function iniciarPublicacion() {
  setInterval(() => {
    const lectura = leerSensor();
    const payload = JSON.stringify(lectura);
    cliente.publish(topicTelemetria, payload, { qos: 1 }, (err) => {
      if (err) console.error('Error al publicar:', err.message);
      else console.log(`-> ${payload}${regando ? '  [REGANDO]' : ''}`);
    });
  }, intervaloMs);
}

// ----- Control por teclado -----
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') {
    console.log('\nSaliendo...');
    cliente.publish(topicEstado, 'offline', { qos: 1, retain: true }, () => {
      cliente.end(false, {}, () => process.exit(0));
    });
  } else if (key.name === 'r') {
    regando = true;
    console.log('[RIEGO ACTIVADO manualmente]');
  } else if (key.name === 's') {
    regando = false;
    console.log('[RIEGO DETENIDO manualmente]');
  }
});