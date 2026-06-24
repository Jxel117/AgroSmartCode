import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
};

export default function () {
  // UUID real obtenido del token y validado en el curl
  const parcelaId = 'a9eeb25b-a57f-40b2-b275-a19a45112b98';
  const url = `http://localhost:4000/api/reportes/${parcelaId}/generar`;
  
  const params = {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOWVlYjI1Yi1hNTdmLTQwYjItYjI3NS1hMTlhNDUxMTJiOTgiLCJyb2wiOiJBRE1JTklTVFJBRE9SIiwiY29ycmVvIjoiZWJlcnNvbi5ndWF5bGxhczJAYWdyb3NtYXJ0LmVjIiwiZW1wcmVzYSI6IkZpbmNhIiwiaWF0IjoxNzgyMjEwNTI5LCJleHAiOjE3ODIyMzkzMjl9.2YjYz7p9ea314Yi8JanPn6c5v06JbnkUzpE4GmFVlGY' 
    },
  };

  const payload = JSON.stringify({
    "tipoPeriodo": "MENSUAL",
    "fechaInicio": "2026-06-01T00:00:00Z",
    "fechaFin": "2026-06-23T23:59:59Z"
  });

  const res = http.post(url, payload, params);

  check(res, {
    'Reporte generado (200)': (r) => r.status === 200,
  });
}