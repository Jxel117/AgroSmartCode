import * as repo from './perfil.repository.js';
import { AppError } from '../../utils/AppError.js';
import { emitir } from '../../audit/audit.emitter.js';

function actorDe(usuario) {
  return {
    usuario_id: usuario.id,
    correo: usuario.correo,
    rol: usuario.rol,
    empresa_id: usuario.empresa,
  };
}

export async function listar(req, res) {
  res.json({ perfiles: await repo.findAll() });
}

export async function obtener(req, res) {
  const perfil = await repo.findById(req.params.id);
  if (!perfil) throw AppError.notFound('Perfil no encontrado');
  res.json({ perfil });
}

export async function crear(req, res) {
  const perfil = await repo.create(req.body);

  emitir({
    categoria: 'GESTION_PERFIL_AGRONOMICO', accion: 'PERFIL_CREADO',
    actor: actorDe(req.user),
    recurso: { entidad_tipo: 'perfil_agronomico', entidad_id: perfil.id_perfil, entidad_nombre: `${perfil.tipo_suelo}/${perfil.tipo_cultivo}` },
  });

  res.status(201).json({ perfil });
}

export async function actualizar(req, res) {
  const perfil = await repo.update(req.params.id, req.body);
  if (!perfil) throw AppError.notFound('Perfil no encontrado');

  emitir({
    categoria: 'GESTION_PERFIL_AGRONOMICO', accion: 'PERFIL_ACTUALIZADO',
    actor: actorDe(req.user),
    recurso: { entidad_tipo: 'perfil_agronomico', entidad_id: perfil.id_perfil, entidad_nombre: `${perfil.tipo_suelo}/${perfil.tipo_cultivo}` },
    metadatos: { campos_modificados: Object.keys(req.body) },
  });

  res.json({ perfil });
}

export async function eliminar(req, res) {
  const perfil = await repo.findById(req.params.id);
  const ok = await repo.remove(req.params.id);
  if (!ok) throw AppError.notFound('Perfil no encontrado');

  emitir({
    categoria: 'GESTION_PERFIL_AGRONOMICO', accion: 'PERFIL_ELIMINADO',
    actor: actorDe(req.user),
    recurso: { entidad_tipo: 'perfil_agronomico', entidad_id: req.params.id, entidad_nombre: perfil ? `${perfil.tipo_suelo}/${perfil.tipo_cultivo}` : undefined },
  });

  res.status(204).send();
}