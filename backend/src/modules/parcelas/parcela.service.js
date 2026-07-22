import * as repo from './parcela.repository.js';
import { AppError } from '../../utils/AppError.js';
import { emitir } from '../../audit/audit.emitter.js';

export async function listar(usuario) {
  if (usuario.rol === 'AGRICULTOR') {
    return repo.findByAgricultor(usuario.id);
  }
  // Admin: solo parcelas de su empresa
  return repo.findByEmpresa(usuario.empresa);
}

// Verifica que la parcela exista Y pertenezca a la empresa del admin
async function obtenerConTenant(id, empresa) {
  const parcela = await repo.findById(id);
  if (!parcela) throw AppError.notFound('Parcela no encontrada');
  if (empresa && parcela.empresa_identificador !== empresa) {
    throw AppError.forbidden('No puedes acceder a parcelas de otra empresa');
  }
  return parcela;
}

export async function obtener(id, usuario) {
  return obtenerConTenant(id, usuario.empresa);
}

export async function crear(datos, usuario) {
  const parcela = await repo.create({
    latitud: null, longitud: null, areaM2: null, ubicacionDescriptiva: null,
    ...datos,
    empresaIdentificador: usuario.empresa,
  });

  emitir({
    categoria: 'GESTION_PARCELA', accion: 'PARCELA_CREADA',
    actor: { usuario_id: usuario.id, correo: usuario.correo, rol: usuario.rol, empresa_id: usuario.empresa },
    recurso: { entidad_tipo: 'parcela', entidad_id: parcela.id_parcela, entidad_nombre: parcela.nombre_descriptivo },
  });

  return parcela;
}

export async function actualizar(id, datos, empresa) {
  const anterior = await obtenerConTenant(id, empresa);
  const actualizada = await repo.update(id, datos);

  emitir({
    categoria: 'GESTION_PARCELA', accion: 'PARCELA_ACTUALIZADA',
    recurso: { entidad_tipo: 'parcela', entidad_id: id, entidad_nombre: actualizada?.nombre_descriptivo ?? anterior.nombre_descriptivo },
    metadatos: { campos_modificados: Object.keys(datos) },
  });

  return actualizada;
}

export async function eliminar(id, usuario) {
  const parcela = await obtenerConTenant(id, usuario.empresa);
  await repo.remove(id);

  emitir({
    categoria: 'GESTION_PARCELA', accion: 'PARCELA_ELIMINADA',
    actor: { usuario_id: usuario.id, correo: usuario.correo, rol: usuario.rol, empresa_id: usuario.empresa },
    recurso: { entidad_tipo: 'parcela', entidad_id: id, entidad_nombre: parcela.nombre_descriptivo },
  });
}

export async function asignar(parcelaId, usuarioId, usuario) {
  await obtenerConTenant(parcelaId, usuario.empresa);
  await repo.asignarAgricultor(parcelaId, usuarioId);
  emitir({
    categoria: 'GESTION_PARCELA', accion: 'AGRICULTOR_ASIGNADO',
    actor: { usuario_id: usuario.id, correo: usuario.correo, rol: usuario.rol, empresa_id: usuario.empresa },
    recurso: { entidad_tipo: 'parcela', entidad_id: parcelaId },
    metadatos: { agricultor_id: usuarioId },
  });
}

export async function desasignar(parcelaId, usuarioId, usuario) {
  await obtenerConTenant(parcelaId, usuario.empresa);
  await repo.desasignarAgricultor(parcelaId, usuarioId);
  emitir({
    categoria: 'GESTION_PARCELA', accion: 'AGRICULTOR_DESASIGNADO',
    actor: { usuario_id: usuario.id, correo: usuario.correo, rol: usuario.rol, empresa_id: usuario.empresa },
    recurso: { entidad_tipo: 'parcela', entidad_id: parcelaId },
    metadatos: { agricultor_id: usuarioId },
  });
}

export async function listarAgricultores(parcelaId, empresa) {
  await obtenerConTenant(parcelaId, empresa);
  return repo.findAgricultoresAsignados(parcelaId);
}