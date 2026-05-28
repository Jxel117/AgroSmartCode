// Convencion de topics de AgroSmart.
// Estructura: agrosmart/parcela/{idParcela}/nodo/{idNodo}/{telemetria|estado}
// El backend se suscribe con comodin + para recibir de cualquier parcela y nodo.

export const TOPICS = {
  TELEMETRIA_SUB: 'agrosmart/parcela/+/nodo/+/telemetria',
  ESTADO_SUB: 'agrosmart/parcela/+/nodo/+/estado',
};

// Topic para enviar comandos a un actuador concreto
export function topicComandoActuador(idParcela, idActuador) {
  return `agrosmart/parcela/${idParcela}/actuador/${idActuador}/comando`;
}

// Extrae idParcela, idNodo y tipo de un topic. Devuelve null si no encaja.
export function parseTopicNodo(topic) {
  const partes = topic.split('/');
  // ['agrosmart','parcela','{idParcela}','nodo','{idNodo}','telemetria' o 'estado']
  if (partes.length !== 6 ||
      partes[0] !== 'agrosmart' ||
      partes[1] !== 'parcela' ||
      partes[3] !== 'nodo') {
    return null;
  }
  return { idParcela: partes[2], idNodo: partes[4], tipo: partes[5] };
}