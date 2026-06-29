import * as service from './usuario.service.js';
import * as repo from './usuario.repository.js';
import * as parcelaRepo from '../parcelas/parcela.repository.js';
import { emitir } from '../../audit/audit.emitter.js';

export async function listar(req, res) {
  // Multi-tenant: filtra por la empresa del admin logueado
  const usuarios = await service.listar(req.user.empresa);
  res.json({ usuarios });
}

export async function crear(req, res) {
  // El nuevo usuario hereda la empresa del admin que lo crea
  const usuario = await service.crear(req.body, req.user.empresa);
  res.status(201).json({ usuario });
}

export async function actualizar(req, res) {
  const usuario = await service.actualizar(req.params.id, req.body, req.user.id, req.user.empresa);
  res.json({ usuario });
}

export async function cambiarEstado(req, res) {
  const usuario = await service.cambiarEstado(req.params.id, req.body.estado, req.user.id, req.user.empresa);
  res.json({ usuario });
}

export async function eliminar(req, res) {
  await service.eliminar(req.params.id, req.user.id, req.user.empresa);
  res.status(204).send();
}

// El propio usuario cambia su contrasena
export async function cambiarPassword(req, res) {
  await service.cambiarPassword(req.user.id, req.body.passwordActual, req.body.passwordNueva);
  res.json({ mensaje: 'Contraseña actualizada' });
}

// El admin resetea la contrasena de un usuario de su empresa
export async function resetearPassword(req, res) {
  await service.resetearPassword(req.user.empresa, req.params.id, req.body.passwordNueva);
  res.json({ mensaje: 'Contraseña restablecida y cuenta desbloqueada' });
}

// El propio usuario actualiza su perfil (nombre, apellido, avatar)
export async function actualizarPerfilPropio(req, res) {
  const id = req.user.sub ?? req.user.id;
  const anterior = await repo.findById(id);
  const usuario = await repo.actualizarPerfil(id, req.body);
  if (!usuario) {
    return res.status(400).json({ error: 'No hay cambios para aplicar' });
  }

  if (req.body.avatar_id !== undefined && req.body.avatar_id !== anterior?.avatar_id) {
    emitir({
      categoria: 'AUTENTICACION', accion: 'AVATAR_CAMBIADO',
      actor: { usuario_id: id, correo: req.user.correo, rol: req.user.rol, empresa_id: req.user.empresa },
      recurso: { entidad_tipo: 'usuario', entidad_id: id },
      metadatos: { avatar_anterior: anterior?.avatar_id ?? null, avatar_nuevo: req.body.avatar_id },
    });
  }

  res.json({ usuario });
}

export async function listarAgricultores(req, res) {
  const agricultores = await repo.findAgricultores(req.user.empresa);
  res.json({ agricultores });
}

export async function listarParcelasDeAgricultor(req, res) {
  // Solo parcelas de la empresa del admin
  const todas = await parcelaRepo.findByEmpresa(req.user.empresa);
  // Saber cuales tiene asignadas el agricultor
  const asignadasRows = await Promise.all(
    todas.map((p) => parcelaRepo.findAgricultoresAsignados(p.id_parcela))
  );
  const resultado = todas.map((p, i) => ({
    id_parcela: p.id_parcela,
    nombre_descriptivo: p.nombre_descriptivo,
    asignada: asignadasRows[i].some((u) => u.id_usuario === req.params.id),
  }));
  res.json({ parcelas: resultado });
}

export async function asignarParcela(req, res) {
  await parcelaRepo.asignarAgricultor(req.body.parcelaId, req.params.id);
  res.json({ mensaje: 'Parcela asignada' });
}

export async function desasignarParcela(req, res) {
  await parcelaRepo.desasignarAgricultor(req.body.parcelaId, req.params.id);
  res.json({ mensaje: 'Parcela desasignada' });
}