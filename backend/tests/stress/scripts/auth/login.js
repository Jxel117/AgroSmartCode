import http from 'k6/http';
import { check } from 'k6';

export const options = {
  // Vamos a probar con 20 usuarios virtuales concurrentes
  vus: 20,
  duration: '30s',
};

const url = 'http://localhost:4000/api/auth/login';

export default function () {
  const payload = JSON.stringify({
    correo: 'eberson.guayllas2@agrosmart.ec',
    contra: 'Eber2005.'
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'Login exitoso (200)': (r) => r.status === 200,
    'Login fallido (401)': (r) => r.status === 401, // Opcional: ver si el sistema rechaza credenciales malas
  });
}