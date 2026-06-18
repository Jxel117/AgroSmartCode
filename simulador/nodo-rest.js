// Simulador REST de nodo AgroSmart.
// Envia lecturas via HTTP al endpoint /api/lecturas/ingesta sin necesidad de MQTT.
// Ideal para desarrollo y demos del Dashboard en vivo.
//
// Uso:
//   node nodo-rest.js \
//     --idNodo nodo_f2d4a116 \
//     --secreto bd61e838e4278cc7a64476ecb1549f8e409dd50ccd60f9e3
//
// Opciones extra:
//   --url http://localhost:4000   (URL del backend)
//   --intervalo 5000              (ms entre lecturas)

import readline from 'node:readline';

// ----- Argumentos -----
function arg(nombre) {
  const i = process.argv.indexOf(`--${nombre}`);
  return i >= 0 ? process.argv[i + 1] : null;
}

const idNodo = arg('idNodo');
const secreto = arg('secreto');
const url = arg('url') ?? 'http://localhost:4000';
const intervaloMs = parseInt(arg('intervalo') ?? '5000', 10);
const humedadManual = arg('humedad');
const temperaturaManual = arg('temperatura');

const usarValoresManual =
  humedadManual !== null || temperaturaManual !== null;

if (!idNodo || !secreto) {
  console.error('Faltan argumentos. Uso:');
  console.error('  node nodo-rest.js --idNodo <identificador> --secreto <secreto>');
  console.error('  [--url http://localhost:4000] [--intervalo 5000] [--humedad 45] [--temperatura 28]');
  process.exit(1);
}

// ----- Estado simulado del entorno -----
let humedad = 60;          // %
let temperaturaBase = 22;  // °C
let regando = false;
let perfil = 'normal';     // 'normal' | 'critica' | 'temperatura_alta'

function leerSensor() {
  // Valores personalizados
  if (usarValoresManual) {
    return {
      humedad: humedadManual !== null
        ? parseFloat(humedadManual)
        : Math.round(humedad * 10) / 10,

      temperatura: temperaturaManual !== null
        ? parseFloat(temperaturaManual)
        : Math.round((temperaturaBase + (Math.random() * 2 - 1)) * 10) / 10,
    };
  }

  // Si esta regando, sube rapido; si no, baja
  if (regando) {
    humedad = Math.min(100, humedad + 4 + Math.random() * 2);
  } else {
    // Modo aleatorio con probabilidades para generar diferentes escenarios
    const r = Math.random();
    if (perfil === 'normal') {
      // 70% normal, 20% baja, 10% critica
      if (r < 0.7) humedad = 50 + Math.random() * 20;
      else if (r < 0.9) humedad = 30 + Math.random() * 15;
      else humedad = 10 + Math.random() * 15;
    } else if (perfil === 'critica') {
      humedad = 10 + Math.random() * 15;  // siempre critica
    } else {
      humedad = 50 + Math.random() * 20;
    }
  }

  let temperatura = temperaturaBase + (Math.random() * 2 - 1);

  // Si perfil es temperatura_alta, dispara valores altos a veces
  if (perfil === 'temperatura_alta') {
    temperatura = 32 + Math.random() * 8;
  }

  return {
    humedad: Math.round(humedad * 10) / 10,
    temperatura: Math.round(temperatura * 10) / 10,
  };
}

async function publicar() {
  const lectura = leerSensor();
  try {
    const respuesta = await fetch(`${url}/api/lecturas/ingesta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-node-id': idNodo,
        'x-node-secret': secreto,
      },
      body: JSON.stringify(lectura),
    });
    const data = await respuesta.json();

    if (!respuesta.ok) {
      console.error(`[ERROR ${respuesta.status}] ${JSON.stringify(data)}`);
      return;
    }

    const flags = [];
    if (regando) flags.push('REGANDO');
    if (data.transicion) flags.push(`AFD: ${data.transicion.estadoOrigen} -> ${data.transicion.estadoDestino}`);
    if (data.alertas && data.alertas.length > 0) {
      flags.push(`${data.alertas.length} alerta(s): ${data.alertas.map(a => a.tipo_alerta).join(', ')}`);
    }
    const sufijo = flags.length > 0 ? `  [${flags.join(' | ')}]` : '';
    console.log(`-> H=${lectura.humedad}% T=${lectura.temperatura}°C${sufijo}`);
  } catch (err) {
    console.error('Error al enviar:', err.message);
  }
}

// ----- Inicio -----
console.log(`Simulador REST de AgroSmart`);
console.log(`URL: ${url}/api/lecturas/ingesta`);
console.log(`Nodo: ${idNodo}`);
console.log(`Intervalo: ${intervaloMs} ms`);
console.log('');
console.log('Controles:');
console.log('  r = activar riego (humedad sube)');
console.log('  s = detener riego');
console.log('  c = forzar lecturas criticas (humedad baja)');
console.log('  t = forzar temperatura alta');
console.log('  n = volver a normal');
console.log('  Ctrl+C = salir');
console.log('');

// Publicar la primera lectura inmediato y luego cada N ms
publicar();
setInterval(publicar, intervaloMs);

// ----- Control por teclado -----
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') {
    console.log('\nSaliendo...');
    process.exit(0);
  } else if (key.name === 'r') {
    regando = true;
    console.log('[RIEGO ACTIVADO]');
  } else if (key.name === 's') {
    regando = false;
    console.log('[RIEGO DETENIDO]');
  } else if (key.name === 'c') {
    perfil = 'critica';
    console.log('[MODO CRITICO: humedad baja constante]');
  } else if (key.name === 't') {
    perfil = 'temperatura_alta';
    console.log('[MODO TEMPERATURA ALTA]');
  } else if (key.name === 'n') {
    perfil = 'normal';
    console.log('[MODO NORMAL]');
  }
});