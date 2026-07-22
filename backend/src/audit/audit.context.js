import { AsyncLocalStorage } from 'node:async_hooks';

const almacen = new AsyncLocalStorage();

export function obtenerContexto() {
  return almacen.getStore() ?? null;
}

export function contextoAuditoria(req, _res, next) {
  const ip =
    req.ip ??
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ??
    req.socket?.remoteAddress ??
    null;

  const contexto = {
    actor: null,
    ip,
    user_agent: req.headers['user-agent'] ?? null,
    ruta: `${req.method} ${req.originalUrl.split('?')[0]}`,
  };

  almacen.run(contexto, () => next());
}

export function registrarActor(usuario) {
  const contexto = obtenerContexto();
  if (!contexto || !usuario) return;

  contexto.actor = {
    usuario_id: usuario.id ?? null,
    correo: usuario.correo ?? null,
    rol: usuario.rol ?? null,
    empresa_id: usuario.empresa ?? null,
  };
}
