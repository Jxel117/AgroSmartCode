import api from './client.js';

export const authApi = {
  login: (correo, contra) => api.post('/auth/login', { correo, contra }),
  perfil: () => api.get('/auth/perfil'),
  logout: () => api.post('/auth/logout'),
};

export const parcelasApi = {
  listar: () => api.get('/parcelas'),
  obtener: (id) => api.get(`/parcelas/${id}`),
  crear: (datos) => api.post('/parcelas', datos),
  actualizar: (id, datos) => api.put(`/parcelas/${id}`, datos),
  eliminar: (id) => api.delete(`/parcelas/${id}`),
};

export const perfilesApi = {
  listar: () => api.get('/perfiles'),
  crear: (datos) => api.post('/perfiles', datos),
  actualizar: (id, datos) => api.put(`/perfiles/${id}`, datos),
  eliminar: (id) => api.delete(`/perfiles/${id}`),
};

export const nodosApi = {
  listar: (parcelaId) => api.get('/nodos', { params: parcelaId ? { parcelaId } : {} }),
  crear: (datos) => api.post('/nodos', datos),
  actualizar: (id, datos) => api.put(`/nodos/${id}`, datos),
  eliminar: (id) => api.delete(`/nodos/${id}`),
};

export const lecturasApi = {
  porParcela: (parcelaId, limite = 100) =>
    api.get(`/lecturas/parcela/${parcelaId}`, { params: { limite } }),
};

export const riegoApi = {
  configuracion: (parcelaId) => api.get(`/riego/${parcelaId}/configuracion`),
  aplicarManual: (parcelaId, datos) => api.post(`/riego/${parcelaId}/configuracion/manual`, datos),
  aplicarPerfil: (parcelaId, perfilId) => api.post(`/riego/${parcelaId}/configuracion/perfil`, { perfilId }),
  actuadores: (parcelaId) => api.get(`/riego/${parcelaId}/actuadores`),
  afd: (parcelaId) => api.get(`/riego/${parcelaId}/afd`),
};

export const alertasApi = {
  listar: (estado) => api.get('/alertas', { params: estado ? { estado } : {} }),
  marcarLeida: (id) => api.patch(`/alertas/${id}/leida`),
  marcarResuelta: (id) => api.patch(`/alertas/${id}/resuelta`),
};

export const reportesApi = {
  generar: (parcelaId, datos) => api.post(`/reportes/${parcelaId}/generar`, datos),
};

export const usuariosApi = {
  listar: () => api.get('/usuarios'),
  crear: (datos) => api.post('/usuarios', datos),
  actualizar: (id, datos) => api.put(`/usuarios/${id}`, datos),
  cambiarEstado: (id, estado) => api.patch(`/usuarios/${id}/estado`, { estado }),
  eliminar: (id) => api.delete(`/usuarios/${id}`),
};