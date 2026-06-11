import * as repo from './parcela.repository.js';
import { AppError } from '../../utils/AppError.js';

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

export async function crear(datos, empresa) {
  return repo.create({
    latitud: null, longitud: null, areaM2: null, ubicacionDescriptiva: null,
    ...datos,
    empresaIdentificador: empresa,
  });
}

export async function actualizar(id, datos, empresa) {
  await obtenerConTenant(id, empresa);
  const actualizada = await repo.update(id, datos);
  return actualizada;
}

export async function eliminar(id, empresa) {
  await obtenerConTenant(id, empresa);
  await repo.remove(id);
}

export async function asignar(parcelaId, usuarioId, empresa) {
  await obtenerConTenant(parcelaId, empresa);
  await repo.asignarAgricultor(parcelaId, usuarioId);
}

export async function desasignar(parcelaId, usuarioId, empresa) {
  await obtenerConTenant(parcelaId, empresa);
  await repo.desasignarAgricultor(parcelaId, usuarioId);
}

export async function listarAgricultores(parcelaId, empresa) {
  await obtenerConTenant(parcelaId, empresa);
  return repo.findAgricultoresAsignados(parcelaId);
}