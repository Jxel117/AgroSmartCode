import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 5,           // Simulamos 5 usuarios mirando el dashboard simultáneamente
  duration: '30s',
};

// Sustituye este ID por uno real de tu base de datos
const PARCELA_ID = '6ba04a5c-3ed3-4667-88d8-09af36f934dd'; 

export default function () {
  const url = `http://localhost:4000/api/lecturas/parcela/${PARCELA_ID}`;
  
  // Necesitamos pasarle el token de autenticación (ya que esta ruta está protegida)
  const params = {
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOWVlYjI1Yi1hNTdmLTQwYjItYjI3NS1hMTlhNDUxMTJiOTgiLCJyb2wiOiJBRE1JTklTVFJBRE9SIiwiY29ycmVvIjoiZWJlcnNvbi5ndWF5bGxhczJAYWdyb3NtYXJ0LmVjIiwiZW1wcmVzYSI6IkZpbmNhIiwiaWF0IjoxNzgyMjEwNTI5LCJleHAiOjE3ODIyMzkzMjl9.2YjYz7p9ea314Yi8JanPn6c5v06JbnkUzpE4GmFVlGY', // Debes poner un token válido
    },
  };

  const res = http.get(url, params);

  check(res, {
    'Consulta exitosa (200)': (r) => r.status === 200,
    'Respuesta rápida (<500ms)': (r) => r.timings.duration < 500,
  });
}