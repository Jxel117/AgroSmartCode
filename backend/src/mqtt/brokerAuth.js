import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { env } from '../config/env.js';

// Ejecuta mosquitto_passwd para crear o actualizar un usuario en el archivo del broker.
// Devuelve una promesa que resuelve cuando termina.
export function registrarUsuarioBroker(identificador, secreto) {
  return new Promise((resolveProm, reject) => {
    if (!env.mqtt.autoRegister) {
      console.log('Auto-registro MQTT deshabilitado; se omite alta en el broker.');
      return resolveProm();
    }

    const archivo = resolve(env.mqtt.passwdFile);

    // mosquitto_passwd -b <archivo> <usuario> <password>
    // El flag -b permite pasar la contrasena por argumento (en lugar de prompt interactivo)
    const proc = spawn('mosquitto_passwd', ['-b', archivo, identificador, secreto]);

    let stderr = '';
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    proc.on('error', (err) => {
      reject(new Error(`No se pudo ejecutar mosquitto_passwd: ${err.message}`));
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`Usuario ${identificador} dado de alta en el broker.`);
        recargarBroker().then(resolveProm).catch(reject);
      } else {
        reject(new Error(`mosquitto_passwd fallo (codigo ${code}): ${stderr}`));
      }
    });
  });
}

// Envia SIGHUP al proceso de mosquitto para que recargue el archivo de contrasenas
// sin reiniciar. Usa pkill para encontrarlo.
function recargarBroker() {
  return new Promise((resolveProm) => {
    const proc = spawn('pkill', ['-HUP', 'mosquitto']);
    proc.on('close', (code) => {
      if (code === 0) console.log('Broker recargado (SIGHUP).');
      else console.warn('No se pudo recargar el broker automaticamente. Reinicialo manualmente.');
      // Resolvemos siempre: el fallo del SIGHUP no debe bloquear el alta del nodo.
      resolveProm();
    });
    proc.on('error', () => resolveProm());
  });
}