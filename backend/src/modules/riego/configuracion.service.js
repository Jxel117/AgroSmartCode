import * as configRepo from './configuracion.repository.js';
import * as perfilRepo from '../perfiles/perfil.repository.js';
import { query } from '../../db/pool.js';
import { AppError } from '../../utils/AppError.js';
import { emitir } from '../../audit/audit.emitter.js';

export async function obtenerVigente(parcelaId) {
  const config = await configRepo.findVigente(parcelaId);
  if (!config) throw AppError.notFound('La parcela no tiene configuracion de riego');
  return config;
}

export async function aplicarManual(parcelaId, d, usuario) {
  const config = await configRepo.create({
    parcelaId,
    umin: d.umin,
    umax: d.umax,
    uminCritico: d.uminCritico,
    tMaximo: d.tMaximo,
    tmin: d.tmin,
    nIntentosFallidosMax: d.nIntentosFallidosMax ?? 3,
    modalidadConfiguracion: 'MANUAL',
    perfilId: null,
  });

  emitir({
    categoria: 'CONFIGURACION_RIEGO', accion: 'CONFIG_MANUAL_APLICADA',
    actor: { usuario_id: usuario.id, correo: usuario.correo, rol: usuario.rol, empresa_id: usuario.empresa },
    recurso: { entidad_tipo: 'parcela', entidad_id: parcelaId },
    metadatos: { umin: d.umin, umax: d.umax, umin_critico: d.uminCritico },
  });

  return config;
}

export async function aplicarPerfil(parcelaId, perfilId, usuario) {
  const perfil = await perfilRepo.findById(perfilId);
  if (!perfil) throw AppError.notFound('Perfil no encontrado');

  const config = await configRepo.create({
    parcelaId,
    umin: perfil.umin_recomendado,
    umax: perfil.umax_recomendado,
    uminCritico: perfil.umin_critico_recomendado,
    tMaximo: perfil.t_maximo_recomendado,
    tmin: perfil.tmin_recomendado,
    nIntentosFallidosMax: 3,
    modalidadConfiguracion: 'PERFIL_PREDETERMINADO',
    perfilId,
  });

  // Registramos la aplicacion del perfil (entidad HistorialAplicacionPerfil)
  await query(
    `INSERT INTO historial_aplicacion_perfil (parcela_id, perfil_id) VALUES ($1, $2)`,
    [parcelaId, perfilId]
  );

  emitir({
    categoria: 'CONFIGURACION_RIEGO', accion: 'CONFIG_PERFIL_APLICADA',
    actor: { usuario_id: usuario.id, correo: usuario.correo, rol: usuario.rol, empresa_id: usuario.empresa },
    recurso: { entidad_tipo: 'parcela', entidad_id: parcelaId },
    metadatos: { perfil_id: perfilId, perfil_nombre: perfil.tipo_cultivo },
  });

  return config;
}

export async function obtenerHistorial(parcelaId) {
  return configRepo.findHistorial(parcelaId);
}

export async function listarVigentesPorEmpresa(empresa) {
  return configRepo.findVigentesPorEmpresa(empresa);
}