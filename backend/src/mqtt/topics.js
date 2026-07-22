// Convencion de topics de AgroSmart.
// Estructura: agrosmart/parcela/{idParcela}/nodo/{idNodo}/{telemetria|estado|riegostatus|config}
// El backend se suscribe con comodin + para recibir de cualquier parcela y nodo.

export const TOPICS = {
  TELEMETRIA_SUB: 'agrosmart/parcela/+/nodo/+/telemetria',
  ESTADO_SUB: 'agrosmart/parcela/+/nodo/+/estado',
  RIEGO_STATUS_SUB: 'agrosmart/parcela/+/nodo/+/riegostatus',
};

// Topic para enviar comandos a un nodo concreto
export function topicComandoNodo(idParcela, idNodo) {
  return `agrosmart/parcela/${idParcela}/nodo/${idNodo}/comandos`;
}

// Topic para enviar configuracion de riego a un nodo autonomo
export function topicConfigNodo(idParcela, idNodo) {
  return `agrosmart/parcela/${idParcela}/nodo/${idNodo}/config`;
}

// Extrae idParcela, idNodo y tipo de un topic. Devuelve null si no encaja.
export function parseTopicNodo(topic) {
  const partes = topic.split('/');
  // ['agrosmart','parcela','{idParcela}','nodo','{idNodo}','telemetria' o 'estado' o 'riegostatus']
  if (partes.length !== 6 ||
      partes[0] !== 'agrosmart' ||
      partes[1] !== 'parcela' ||
      partes[3] !== 'nodo') {
    return null;
  }
  return { idParcela: partes[2], idNodo: partes[4], tipo: partes[5] };
}
