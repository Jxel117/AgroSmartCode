import * as repo from './programacion.repository.js';
import { AppError } from '../../utils/AppError.js';
import { emitir } from '../../audit/audit.emitter.js';

function auditar(accion, programacion, metadatos = {}) {
  emitir({
    categoria: 'PROGRAMACION_RIEGO',
    accion,
    recurso: {
      entidad_tipo: 'programacion_riego',
      entidad_id: programacion.id_programacion,
      entidad_nombre: `${programacion.dia_semana} ${programacion.hora_inicio}`,
    },
    metadatos: {
      parcela_id: programacion.parcela_id,
      dia_semana: programacion.dia_semana,
      hora_inicio: programacion.hora_inicio,
      duracion_minutos: programacion.duracion_minutos,
      ...metadatos,
    },
  });
}

export async function listar(req, res) {
  res.json({ programaciones: await repo.findByParcela(req.params.parcelaId) });
}

export async function crear(req, res) {
  const programacion = await repo.create({ parcelaId: req.params.parcelaId, ...req.body });

  auditar('PROGRAMACION_CREADA', programacion);

  res.status(201).json({ programacion });
}

export async function cambiarEstado(req, res) {
  const anterior = await repo.findById(req.params.id);
  if (!anterior) throw AppError.notFound('Programacion no encontrada');

  const programacion = await repo.updateEstado(req.params.id, req.body.estado);
  if (!programacion) throw AppError.notFound('Programacion no encontrada');

  const accionPorEstado = {
    ACTIVA: 'PROGRAMACION_ACTIVADA',
    PAUSADA: 'PROGRAMACION_PAUSADA',
    FINALIZADA: 'PROGRAMACION_FINALIZADA',
  };

  auditar(accionPorEstado[programacion.estado] ?? 'PROGRAMACION_ESTADO_CAMBIADO', programacion, {
    estado_anterior: anterior.estado,
    estado_nuevo: programacion.estado,
  });

  res.json({ programacion });
}

export async function eliminar(req, res) {
  const programacion = await repo.findById(req.params.id);
  if (!programacion) throw AppError.notFound('Programacion no encontrada');

  await repo.remove(req.params.id);

  auditar('PROGRAMACION_ELIMINADA', programacion);

  res.status(204).send();
}
