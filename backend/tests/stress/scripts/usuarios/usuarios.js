import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  // Simula 3 usuarios reales navegando y activando riego
  vus: 3,
  duration: '30s',
};

const TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOWVlYjI1Yi1hNTdmLTQwYjItYjI3NS1hMTlhNDUxMTJiOTgiLCJyb2wiOiJBRE1JTklTVFJBRE9SIiwiY29ycmVvIjoiZWJlcnNvbi5ndWF5bGxhczJAYWdyb3NtYXJ0LmVjIiwiZW1wcmVzYSI6IkZpbmNhIiwiaWF0IjoxNzgyMjU1NjM0LCJleHAiOjE3ODIyODQ0MzR9.SK7bgJhFukC_VpFejwArlGxESk8NRqWZuUekh_DCtLc';
const BASE_URL = 'http://localhost:4000/api';

export default function () {
  const params = { headers: { 'Authorization': TOKEN, 'Content-Type': 'application/json' } };

  // 1. El usuario entra y lista sus parcelas (Simulación de navegación)
  let res = http.get(`${BASE_URL}/parcelas`, params);
  check(res, { 'Lista de parcelas cargada': (r) => r.status === 200 });
  sleep(1); // Pausa de usuario

  // 2. Selecciona una parcela (usando la del Terreno 1)
  const parcelaId = '6ba04a5c-3ed3-4667-88d8-09af36f934dd';
  
  // 3. Envía la orden de riego manual
  const payload = JSON.stringify({
    estado: 'encendido',
    nodoId: 'nodo_4073801f',
    umin: 20, umax: 80, uminCritico: 15, tMaximo: 40, tmin: 10
  });

  res = http.post(`${BASE_URL}/riego/${parcelaId}/configuracion/manual`, payload, params);
  
  // 4. Verificación de éxito de la acción
  check(res, {
    'Riego activado correctamente': (r) => r.status === 200 || r.status === 201,
  });
  
  sleep(2); // Tiempo de espera tras activar el riego
}