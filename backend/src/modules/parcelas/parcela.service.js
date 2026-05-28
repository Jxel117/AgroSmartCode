import * as repo from './parcela.repository.js';
import { AppError } from '../../utils/AppError.js';

export async function listar(usuario) {
  // El agricultor solo ve sus parcelas asignadas; el admin ve todas
  if (usuario.rol === 'AGRICULTOR') {
    return repo.findByAgricultor(usuario.id);
  }
  return repo.findAll();
}

export async function obtener(id) {
  const parcela = await repo.findById(id);
  if (!parcela) throw AppError.notFound('Parcela no encontrada');
  return parcela;
}

export async function crear(datos) {
  return repo.create({
    latitud: null, longitud: null, areaM2: null, ubicacionDescriptiva: null,
    ...datos,
  });
}

export async function actualizar(id, datos) {
  const actualizada = await repo.update(id, datos);
  if (!actualizada) throw AppError.notFound('Parcela no encontrada');
  return actualizada;
}

export async function eliminar(id) {
  const ok = await repo.remove(id);
  if (!ok) throw AppError.notFound('Parcela no encontrada');
}

export async function asignar(parcelaId, usuarioId) {
  await obtener(parcelaId);
  await repo.asignarAgricultor(parcelaId, usuarioId);
}

export async function desasignar(parcelaId, usuarioId) {
  await repo.desasignarAgricultor(parcelaId, usuarioId);
}