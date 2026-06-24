import http from 'k6/http';
import { check } from 'k6';

// Configuración de la prueba: 5 usuarios virtuales constantes durante 30 segundos
export const options = {
  stages: [
    { duration: '10s', target: 5 }, // Subir a 5 usuarios
    { duration: '20s', target: 5 }, // Mantener carga
    { duration: '5s', target: 0 },  // Bajar a 0
  ],
};

const parcelas = [
  '6ba04a5c-3ed3-4667-88d8-09af36f934dd', // Terreno 1
  '4656720f-d3a3-4808-af1a-65c1fb2c1e36'  // Terreno 2
];

export default function () {
  // Selecciona una parcela al azar en cada iteración
  const parcelaId = parcelas[Math.floor(Math.random() * parcelas.length)];
  const url = `http://localhost:4000/api/riego/${parcelaId}/configuracion/manual`;
  
  const payload = JSON.stringify({
    estado: 'encendido',
    nodoId: 'nodo_4073801f',
    umin: 20,
    umax: 80,
    uminCritico: 15,
    tMaximo: 40,
    tmin: 10
  });

  const params = {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOWVlYjI1Yi1hNTdmLTQwYjItYjI3NS1hMTlhNDUxMTJiOTgiLCJyb2wiOiJBRE1JTklTVFJBRE9SIiwiY29ycmVvIjoiZWJlcnNvbi5ndWF5bGxhczJAYWdyb3NtYXJ0LmVjIiwiZW1wcmVzYSI6IkZpbmNhIiwiaWF0IjoxNzgyMjU1NjM0LCJleHAiOjE3ODIyODQ0MzR9.SK7bgJhFukC_VpFejwArlGxESk8NRqWZuUekh_DCtLc'
    },
  };

  const res = http.post(url, payload, params);

  // Validamos el éxito (200 o 201)
  check(res, {
    'Riego exitoso (200/201)': (r) => r.status === 200 || r.status === 201,
  });
}