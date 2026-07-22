import * as lecturaRepo from './lectura.repository.js';
import * as nodoRepo from '../nodos/nodo.repository.js';
import * as configRepo from '../riego/configuracion.repository.js';
import * as actuadorRepo from '../riego/actuador.repository.js';
import * as afdRepo from '../afd/afd.repository.js';
import * as alertaRepo from '../alertas/alerta.repository.js';
import { transitar, ESTADOS } from '../afd/afd.machine.js';
import {
  emitirLecturaNueva,
  emitirAlertaNueva,
  emitirTransicionAfd,
} from '../../realtime/index.js';
import { publicarComandoNodo } from '../../mqtt/client.js';
import { emitir } from '../../audit/audit.emitter.js';

function actorDispositivo(nodo) {
  return { empresa_id: nodo.empresa_identificador ?? null };
}

function clasificarLectura({ humedad, temperatura }) {
  if (humedad == null && temperatura == null) return 'ERROR_SENSOR_SIN_RESPUESTA';
  if (humedad != null && (humedad < 0 || humedad > 100)) return 'ERROR_FUERA_DE_RANGO';
  if (temperatura != null && (temperatura < -20 || temperatura > 70)) return 'ERROR_FUERA_DE_RANGO';
  return 'VALIDA';
}

export async function ingestar(nodoId, datos) {
  let nodo = await nodoRepo.findById(nodoId);
  if (!nodo) {
    const credencial = await nodoRepo.findByCredencialIdentificador(nodoId);
    if (credencial) {
      nodoId = credencial.id_nodo;
      nodo = await nodoRepo.findById(nodoId);
    }
  }
  if (!nodo) return null;

  // Recibir una lectura es en si mismo la prueba de que el nodo esta en
  // linea. El canal MQTT ya lo marca ACTIVO via su topic "estado", pero la
  // ingesta REST no tenia ninguna via para hacerlo y el nodo se quedaba
  // "SIN_CONFIGURAR"/"DESCONECTADO" para siempre en el dashboard.
  if (nodo.estado !== 'ACTIVO') {
    await nodoRepo.actualizarEstado(nodoId, 'ACTIVO');
    nodo.estado = 'ACTIVO';
  }

  const estadoLectura = clasificarLectura(datos);

  // 1. Guardar la lectura
  const lectura = await lecturaRepo.create({
    nodoId,
    humedad: datos.humedad ?? null,
    temperatura: datos.temperatura ?? null,
    estadoLectura,
  });
  await lecturaRepo.actualizarUltimaLecturaNodo(nodoId);

  // === WS: emitir lectura nueva a la empresa del nodo ===
  if (nodo.empresa_identificador) {
    emitirLecturaNueva(nodo.empresa_identificador, {
      ...lectura,
      parcela_id: nodo.parcela_id,
    });
  }

  const resultado = { lectura, transicion: null, alertas: [] };

  // Una lectura que el sistema no puede dar por buena si es un hecho auditable:
  // indica un sensor averiado o datos manipulados.
  if (estadoLectura !== 'VALIDA') {
    emitir({
      categoria: 'SISTEMA_IOT', accion: 'LECTURA_INVALIDA', resultado: 'FALLO',
      actor: actorDispositivo(nodo),
      recurso: { entidad_tipo: 'nodo', entidad_id: nodoId },
      metadatos: {
        estado_lectura: estadoLectura,
        parcela_id: nodo.parcela_id ?? null,
        humedad: datos.humedad ?? null,
        temperatura: datos.temperatura ?? null,
      },
    });
  }

  // 2. Si el nodo no esta asociado a una parcela, terminamos aqui
  if (!nodo.parcela_id) return resultado;

  // Registra la alerta en el log de auditoria ademas de emitirla por WebSocket.
  const registrarAlerta = (alerta) => {
    resultado.alertas.push(alerta);
    emitirAlertaNueva(nodo.empresa_identificador, alerta);
    emitir({
      categoria: 'GESTION_ALERTA', accion: 'ALERTA_GENERADA',
      resultado: alerta.severidad === 'CRITICA' ? 'FALLO' : 'PARCIAL',
      actor: actorDispositivo(nodo),
      recurso: { entidad_tipo: 'alerta', entidad_id: alerta.id_alerta, entidad_nombre: alerta.tipo_alerta },
      metadatos: {
        parcela_id: alerta.parcela_id,
        nodo_id: alerta.nodo_id,
        severidad: alerta.severidad,
        mensaje: alerta.mensaje,
        valor_disparador: alerta.valor_disparador,
      },
    });
  };

  // 3. Generar alertas por condiciones criticas
  const config = await configRepo.findVigente(nodo.parcela_id);
  if (estadoLectura !== 'VALIDA') {
    registrarAlerta(await alertaRepo.create({
      parcelaId: nodo.parcela_id, nodoId,
      tipoAlerta: 'FALLO_SENSOR', severidad: 'CRITICA',
      mensaje: `Lectura invalida del nodo (${estadoLectura})`,
      valorDisparador: null,
    }));
  } else if (config) {
    if (datos.humedad != null && Number(datos.humedad) < Number(config.umin_critico)) {
      registrarAlerta(await alertaRepo.create({
        parcelaId: nodo.parcela_id, nodoId,
        tipoAlerta: 'HUMEDAD_CRITICA_BAJA', severidad: 'CRITICA',
        mensaje: `Humedad critica: ${datos.humedad}%`, valorDisparador: datos.humedad,
      }));
    }
    if (datos.temperatura != null && Number(datos.temperatura) > Number(config.t_maximo)) {
      registrarAlerta(await alertaRepo.create({
        parcelaId: nodo.parcela_id, nodoId,
        tipoAlerta: 'TEMPERATURA_CRITICA_ALTA', severidad: 'ADVERTENCIA',
        mensaje: `Temperatura alta: ${datos.temperatura}C`, valorDisparador: datos.temperatura,
      }));
    }
  }

  // 4. Correr el AFD solo si hay configuracion de riego y el nodo esta online
  if (!config) return resultado;
  if (nodo.estado !== 'ACTIVO') return resultado;

  // Si el nodo es autonomo (decide riego por si mismo), saltamos el AFD
  // El estado del AFD se actualiza via los mensajes riegostatus del nodo
  if (datos.autonomo) return resultado;

  const afd = await afdRepo.findOrCreateByParcela(nodo.parcela_id, config.n_intentos_fallidos_max);

  const decision = transitar({
    estadoActual: afd.estado_actual,
    contadorFallidos: afd.contador_intentos_fallidos,
    nIntentosMax: afd.n_intentos_fallidos_max,
    config,
    lectura: {
      humedad: datos.humedad,
      temperatura: datos.temperatura,
      estadoLectura,
    },
  });

  // Solo registramos transicion si cambia el estado o hay accion
  if (decision.estadoDestino !== afd.estado_actual || decision.accionActuador) {
    await afdRepo.aplicarTransicion(afd, {
      estadoOrigen: afd.estado_actual,
      estadoDestino: decision.estadoDestino,
      simbolo: decision.simbolo,
      humedad: datos.humedad ?? null,
      temperatura: datos.temperatura ?? null,
      causa: decision.causa,
      contadorIntentos: decision.contadorFallidos,
    });

    if (decision.accionActuador === 'ENCENDER') {
      await actuadorRepo.setEstado(nodo.parcela_id, true);
      publicarComandoNodo(nodo.parcela_id, nodoId, 'REGAR', decision.causa);
    } else if (decision.accionActuador === 'APAGAR') {
      await actuadorRepo.setEstado(nodo.parcela_id, false);
      publicarComandoNodo(nodo.parcela_id, nodoId, 'DETENER', decision.causa);
    }
    resultado.transicion = {
      estadoOrigen: afd.estado_actual,
      estadoDestino: decision.estadoDestino,
      simbolo: decision.simbolo,
      causa: decision.causa,
      accionActuador: decision.accionActuador,
    };

    // El automata decide por su cuenta: cada cambio de estado y cada orden
    // enviada al actuador queda registrada para poder reconstruir por que se
    // rego (o se dejo de regar) una parcela.
    emitir({
      categoria: 'OPERACION_AFD', accion: 'AFD_TRANSICION',
      resultado: decision.estadoDestino === 'S4_FALLO' ? 'FALLO' : 'EXITO',
      actor: actorDispositivo(nodo),
      recurso: { entidad_tipo: 'parcela', entidad_id: nodo.parcela_id },
      metadatos: {
        estado_origen: afd.estado_actual,
        estado_destino: decision.estadoDestino,
        simbolo: decision.simbolo,
        causa: decision.causa,
        nodo_id: nodoId,
        humedad: datos.humedad ?? null,
        temperatura: datos.temperatura ?? null,
      },
    });

    if (decision.accionActuador) {
      emitir({
        categoria: 'OPERACION_AFD',
        accion: decision.accionActuador === 'ENCENDER' ? 'RIEGO_INICIADO' : 'RIEGO_DETENIDO',
        actor: actorDispositivo(nodo),
        recurso: { entidad_tipo: 'parcela', entidad_id: nodo.parcela_id },
        metadatos: {
          causa: decision.causa,
          nodo_id: nodoId,
          humedad: datos.humedad ?? null,
          temperatura: datos.temperatura ?? null,
        },
      });
    }

    // === WS: emitir transicion AFD a la empresa del nodo ===
    emitirTransicionAfd(nodo.empresa_identificador, {
      parcela_id: nodo.parcela_id,
      ...resultado.transicion,
      timestamp: new Date().toISOString(),
    });
  }

  return resultado;
}

export async function lecturasRecientes(parcelaId, limite) {
  return lecturaRepo.findRecientesPorParcela(parcelaId, limite);
}
