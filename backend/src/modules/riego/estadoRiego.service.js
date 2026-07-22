// Reporte de estado de riego de un nodo autonomo via REST.
// Replica lo que el handler MQTT de "riegostatus" hace, para no depender
// del broker: actualiza el actuador, mapea a un estado del AFD (solo para
// reflejarlo en el dashboard, sin volver a decidir riego) y emite por WS.
import * as nodoRepo from '../nodos/nodo.repository.js';
import * as configRepo from './configuracion.repository.js';
import * as afdRepo from '../afd/afd.repository.js';
import * as actuadorRepo from './actuador.repository.js';
import { emitirEstadoRiego, emitirTransicionAfd } from '../../realtime/index.js';

const MAPEO_ESTADO_AFD = {
  PREPARANDO: 'S1_EVALUACION',
  REGANDO: 'S2_RIEGO_ACTIVO',
  DETENIDO: 'S3_RIEGO_DETENIDO',
  COMPLETADO: 'S3_RIEGO_DETENIDO',
};

export async function reportarEstadoRiego(nodoId, { estado, mensaje, segundos }) {
  const nodo = await nodoRepo.findById(nodoId);
  if (!nodo?.parcela_id) return null;

  const { parcela_id: parcelaId, empresa_identificador: empresaId } = nodo;

  if (estado === 'REGANDO') {
    await actuadorRepo.setEstado(parcelaId, true);
  } else if (estado === 'DETENIDO' || estado === 'COMPLETADO') {
    await actuadorRepo.setEstado(parcelaId, false);
  }

  const estadoAFD = MAPEO_ESTADO_AFD[estado];
  if (estadoAFD) {
    const config = await configRepo.findVigente(parcelaId);
    const afd = await afdRepo.findOrCreateByParcela(parcelaId, config?.n_intentos_fallidos_max ?? 3);

    if (afd.estado_actual !== estadoAFD) {
      const estadoAnterior = afd.estado_actual;
      await afdRepo.aplicarTransicion(afd, {
        estadoOrigen: estadoAnterior,
        estadoDestino: estadoAFD,
        simbolo: 'M_REPORTE_AUTONOMO',
        humedad: null,
        temperatura: null,
        causa: mensaje ?? 'Reporte de nodo autonomo',
        contadorIntentos: 0,
      });

      if (empresaId) {
        emitirTransicionAfd(empresaId, {
          parcela_id: parcelaId,
          estadoOrigen: estadoAnterior,
          estadoDestino: estadoAFD,
          simbolo: 'M_REPORTE_AUTONOMO',
          causa: mensaje ?? 'Reporte de nodo autonomo',
          accionActuador: estado === 'REGANDO' ? 'ENCENDER'
            : (estado === 'DETENIDO' || estado === 'COMPLETADO') ? 'APAGAR' : null,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  if (empresaId) {
    emitirEstadoRiego(empresaId, {
      parcela_id: parcelaId,
      estado,
      mensaje: mensaje ?? '',
      segundos: segundos ?? 0,
      timestamp: new Date().toISOString(),
    });
  }

  return { parcelaId, empresaId };
}
