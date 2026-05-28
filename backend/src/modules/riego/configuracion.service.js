import * as configRepo from './configuracion.repository.js';
import * as perfilRepo from '../perfiles/perfil.repository.js';
import { query } from '../../db/pool.js';
import { AppError } from '../../utils/AppError.js';

export async function obtenerVigente(parcelaId) {
  const config = await configRepo.findVigente(parcelaId);
  if (!config) throw AppError.notFound('La parcela no tiene configuracion de riego');
  return config;
}

export async function aplicarManual(parcelaId, d) {
  return configRepo.create({
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
}

export async function aplicarPerfil(parcelaId, perfilId) {
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

  return config;
}