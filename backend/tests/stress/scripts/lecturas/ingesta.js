import http from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';

// Cargamos los nodos del archivo JSON de forma eficiente
const nodos = new SharedArray('nodos de prueba', function () {
  return JSON.parse(open('../../data/nodos.json'));
});

// Configuración de la prueba de carga
export const options = {
  vus: 2,           // Simulamos 2 usuarios virtuales
  duration: '30s',  // Durante 30 segundos
};

export default function () {
  // Seleccionamos un nodo al azar de la lista cargada
  const nodo = nodos[Math.floor(Math.random() * nodos.length)];

  const url = 'http://localhost:4000/api/lecturas/ingesta';
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'x-node-id': nodo.id,
      'x-node-secret': nodo.secret,
    },
  };

  // Generamos datos aleatorios asegurando que sean de tipo Number (sin comillas)
  const payload = JSON.stringify({
    humedad: Number((Math.random() * 100).toFixed(2)),
    temperatura: Number((Math.random() * 30).toFixed(2)),
    timestamp: new Date().toISOString(),
  });

  const res = http.post(url, payload, params);

  // Verificamos que el servidor responda 201 Created
  const success = check(res, {
    'Envío exitoso (201)': (r) => r.status === 201,
  });

  // Solo imprimimos si algo sale mal
  if (!success) {
    console.log(`Error ${res.status} con nodo ${nodo.id}: ${res.body}`);
  }
}