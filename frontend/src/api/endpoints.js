import api from './client.js';

export const parcelasApi = {
  listar: () => api.get('/parcelas'),
  obtener: (id) => api.get(`/parcelas/${id}`),
  crear: (datos) => api.post('/parcelas', datos),
  actualizar: (id, datos) => api.put(`/parcelas/${id}`, datos),
  eliminar: (id) => api.delete(`/parcelas/${id}`),
  agricultores: (id) => api.get(`/parcelas/${id}/agricultores`),
  asignarAgricultor: (id, usuarioId) => api.post(`/parcelas/${id}/agricultores`, { usuarioId }),
  desasignarAgricultor: (id, usuarioId) => api.delete(`/parcelas/${id}/agricultores`, { data: { usuarioId } }),
};

export const perfilesApi = {
  listar: () => api.get('/perfiles'),
  crear: (datos) => api.post('/perfiles', datos),
  actualizar: (id, datos) => api.put(`/perfiles/${id}`, datos),
  eliminar: (id) => api.delete(`/perfiles/${id}`),
};

export const nodosApi = {
  listar: () => api.get('/nodos'),
  crear: (datos) => api.post('/nodos', datos),
  actualizar: (id, datos) => api.put(`/nodos/${id}`, datos),
  cambiarEstado: (id, estado) => api.patch(`/nodos/${id}/estado`, { estado }),
  eliminar: (id) => api.delete(`/nodos/${id}`),
};

export const lecturasApi = {
  porParcela: (parcelaId, limite = 100) =>
    api.get(`/lecturas/parcela/${parcelaId}`, { params: { limite } }),
};

export const riegoApi = {
  configuracion: (parcelaId) => api.get(`/riego/${parcelaId}/configuracion`),
  historial: (parcelaId) => api.get(`/riego/${parcelaId}/configuracion/historial`),
  listarConfiguraciones: () => api.get('/riego/configuraciones'),
  aplicarManual: (parcelaId, datos) => api.post(`/riego/${parcelaId}/configuracion/manual`, datos),
  aplicarPerfil: (parcelaId, perfilId) => api.post(`/riego/${parcelaId}/configuracion/perfil`, { perfilId }),
  actuadores: (parcelaId) => api.get(`/riego/${parcelaId}/actuadores`),
  afd: (parcelaId) => api.get(`/riego/${parcelaId}/afd`),
};

export const alertasApi = {
  listar: (estado) => api.get('/alertas', { params: estado ? { estado } : {} }),
  contar: () => api.get('/alertas/contar'),
  marcarLeida: (id) => api.patch(`/alertas/${id}/leida`),
  marcarResuelta: (id) => api.patch(`/alertas/${id}/resuelta`),
  marcarTodasLeidas: () => api.patch('/alertas/marcar-todas-leidas'),
};

export const reportesApi = {
  generar: (parcelaId, datos) => api.post(`/reportes/${parcelaId}/generar`, datos),
};

export const usuariosApi = {
  listar: () => api.get('/usuarios'),
  listarAgricultores: () => api.get('/usuarios/agricultores'),
  crear: (datos) => api.post('/usuarios', datos),
  actualizar: (id, datos) => api.put(`/usuarios/${id}`, datos),
  cambiarEstado: (id, estado) => api.patch(`/usuarios/${id}/estado`, { estado }),
  eliminar: (id) => api.delete(`/usuarios/${id}`),
  cambiarMiPassword: (passwordActual, passwordNueva) =>
    api.patch('/usuarios/mi-password', { passwordActual, passwordNueva }),
  resetearPassword: (id, passwordNueva) =>
    api.patch(`/usuarios/${id}/password`, { passwordNueva }),
  reenviarActivacion: (id) => api.post(`/usuarios/${id}/reenviar-activacion`),
  parcelas: (id) => api.get(`/usuarios/${id}/parcelas`),
  asignarParcela: (id, parcelaId) => api.post(`/usuarios/${id}/parcelas`, { parcelaId }),
  desasignarParcela: (id, parcelaId) => api.delete(`/usuarios/${id}/parcelas`, { data: { parcelaId } }),
   actualizarPerfilPropio: (datos) => api.patch('/usuarios/me', datos),
};

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
};

export const authApi = {
  login: (correo, contra, captchaToken) => api.post('/auth/login', { correo, contra, captchaToken }),
  perfil: () => api.get('/auth/perfil'),
  logout: () => api.post('/auth/logout'),
  registrarEmpresa: (datos) => api.post('/auth/registrar-empresa', datos),
  solicitarRecuperacion: (correoValidacion) => api.post('/auth/recuperar/solicitar', { correoValidacion }),
  verificarToken: (token) => api.get(`/auth/recuperar/verificar/${token}`),
  completarRecuperacion: (token, passwordNueva) => api.post(`/auth/recuperar/completar/${token}`, { passwordNueva }),
};