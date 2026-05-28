// Maquina de estados del riego (AFD). Funcion pura: no toca la base de datos.
// Estados: S0_MONITOREO, S1_EVALUACION, S2_RIEGO_ACTIVO, S3_RIEGO_DETENIDO, S4_FALLO

export const ESTADOS = {
  MONITOREO: 'S0_MONITOREO',
  EVALUACION: 'S1_EVALUACION',
  RIEGO_ACTIVO: 'S2_RIEGO_ACTIVO',
  RIEGO_DETENIDO: 'S3_RIEGO_DETENIDO',
  FALLO: 'S4_FALLO',
};

/**
 * Calcula la transicion del AFD.
 * @param {object} ctx
 * @param {string} ctx.estadoActual
 * @param {number} ctx.contadorFallidos
 * @param {number} ctx.nIntentosMax
 * @param {object} ctx.config  umbrales: umin, umax, umin_critico, t_maximo
 * @param {object} ctx.lectura humedad, temperatura, estadoLectura ('VALIDA' | error)
 * @returns {{ estadoDestino, simbolo, accionActuador, causa, contadorFallidos }}
 *          accionActuador: 'ENCENDER' | 'APAGAR' | null
 */
export function transitar(ctx) {
  const { estadoActual, config, lectura } = ctx;
  let contador = ctx.contadorFallidos;

  // Lectura invalida: cuenta como intento fallido y puede llevar a FALLO
  if (lectura.estadoLectura !== 'VALIDA') {
    contador += 1;
    if (contador >= ctx.nIntentosMax) {
      return {
        estadoDestino: ESTADOS.FALLO,
        simbolo: 'G_TIMEOUT_N',
        accionActuador: 'APAGAR',
        causa: `Sensor sin respuesta valida tras ${contador} intentos`,
        contadorFallidos: contador,
      };
    }
    return {
      estadoDestino: ESTADOS.FALLO,
      simbolo: 'G_TIMEOUT_N',
      accionActuador: null,
      causa: 'Lectura invalida del sensor',
      contadorFallidos: contador,
    };
  }

  // Lectura valida: reiniciamos el contador de fallos
  contador = 0;
  const { humedad, temperatura } = lectura;
  const { umin, umax, umin_critico, t_maximo } = config;

  // Si veniamos de FALLO y ya hay lectura valida, volvemos a monitoreo
  if (estadoActual === ESTADOS.FALLO) {
    return {
      estadoDestino: ESTADOS.MONITOREO,
      simbolo: 'H_SENSOR_RECUPERADO',
      accionActuador: null,
      causa: 'Sensor recuperado',
      contadorFallidos: 0,
    };
  }

  // Temperatura critica alta: no se riega aunque la humedad sea baja
  if (temperatura != null && t_maximo != null && Number(temperatura) > Number(t_maximo)) {
    return {
      estadoDestino: ESTADOS.RIEGO_DETENIDO,
      simbolo: 'L_TEMPERATURA_ALTA',
      accionActuador: 'APAGAR',
      causa: `Temperatura ${temperatura}C supera el maximo ${t_maximo}C`,
      contadorFallidos: 0,
    };
  }

  const h = Number(humedad);

  // Humedad por debajo del umbral minimo: activar riego
  if (h < Number(umin)) {
    const critica = h < Number(umin_critico);
    return {
      estadoDestino: ESTADOS.RIEGO_ACTIVO,
      simbolo: critica ? 'B_HUMEDAD_BAJA' : 'B_HUMEDAD_BAJA',
      accionActuador: 'ENCENDER',
      causa: critica
        ? `Humedad critica ${h}% (< ${umin_critico}%)`
        : `Humedad baja ${h}% (< ${umin}%)`,
      contadorFallidos: 0,
    };
  }

  // Humedad alcanzo o supero el umbral maximo: detener riego
  if (h >= Number(umax)) {
    return {
      estadoDestino: ESTADOS.RIEGO_DETENIDO,
      simbolo: 'E_HUMEDAD_SUFICIENTE',
      accionActuador: 'APAGAR',
      causa: `Humedad suficiente ${h}% (>= ${umax}%)`,
      contadorFallidos: 0,
    };
  }

  // Humedad en rango optimo: monitorear
  return {
    estadoDestino: ESTADOS.MONITOREO,
    simbolo: 'C_HUMEDAD_OK',
    accionActuador: null,
    causa: `Humedad en rango ${h}%`,
    contadorFallidos: 0,
  };
}