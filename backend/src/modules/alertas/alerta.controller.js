import * as repo from './alerta.repository.js';
import { AppError } from '../../utils/AppError.js';
import { emitir } from '../../audit/audit.emitter.js';

function auditar(accion, alerta) {
  emitir({
    categoria: 'GESTION_ALERTA',
    accion,
    recurso: {
      entidad_tipo: 'alerta',
      entidad_id: alerta.id_alerta,
      entidad_nombre: alerta.tipo_alerta,
    },
    metadatos: {
      parcela_id: alerta.parcela_id,
      nodo_id: alerta.nodo_id,
      severidad: alerta.severidad,
      mensaje: alerta.mensaje,
    },
  });
}

export async function listar(req, res) {
  res.json({ alertas: await repo.findAll(req.query.estado) });
}

export async function marcarLeida(req, res) {
  const alerta = await repo.marcarLeida(req.params.id);
  if (!alerta) throw AppError.notFound('Alerta no encontrada o ya leida');

  auditar('ALERTA_MARCADA_LEIDA', alerta);

  res.json({ alerta });
}

export async function marcarResuelta(req, res) {
  const alerta = await repo.marcarResuelta(req.params.id);
  if (!alerta) throw AppError.notFound('Alerta no encontrada');

  auditar('ALERTA_RESUELTA', alerta);

  res.json({ alerta });
}

export async function contar(req, res) {
  const total = await repo.contarNoLeidas(req.user.empresa);
  res.json({ total });
}

export async function marcarTodasLeidas(req, res) {
  const total = await repo.marcarTodasLeidas(req.user.empresa);

  emitir({
    categoria: 'GESTION_ALERTA', accion: 'ALERTAS_MARCADAS_LEIDAS_MASIVO',
    recurso: { entidad_tipo: 'empresa', entidad_id: req.user.empresa, entidad_nombre: req.user.empresa },
    metadatos: { alertas_afectadas: total },
  });

  res.json({ marcadas: total });
}
