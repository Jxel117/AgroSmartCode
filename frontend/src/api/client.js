import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Adjunta el token guardado en cada peticion
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agrosmart_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Ante 401, limpia la sesion y redirige al login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('agrosmart_token');
      localStorage.removeItem('agrosmart_usuario');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;