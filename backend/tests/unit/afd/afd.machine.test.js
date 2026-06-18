  import { transitar, ESTADOS } from "../../../src/modules/afd/afd.machine.js";

  describe("AFD - Caja Blanca Completo", () => {

    test("debe existir la maquina AFD", () => {
      expect(transitar).toBeDefined();
    });

    // -------------------------
    // 1. SENSOR INVÁLIDO (NO llega a max intentos)
    // -------------------------
    test("sensor invalido (sin llegar a max intentos) entra en fallo parcial", () => {
      const resultado = transitar({
        estadoActual: ESTADOS.MONITOREO,
        contadorFallidos: 1,
        nIntentosMax: 3,
        config: {},
        lectura: {
          estadoLectura: "ERROR",
          humedad: 50,
          temperatura: 25
        }
      });

      expect(resultado.estadoDestino).toBe(ESTADOS.FALLO);
      expect(resultado.contadorFallidos).toBe(2);
    });

    // -------------------------
    // 2. SENSOR INVÁLIDO (llega a max intentos)
    // -------------------------
    test("sensor invalido llega a max intentos y apaga sistema", () => {
      const resultado = transitar({
        estadoActual: ESTADOS.MONITOREO,
        contadorFallidos: 2,
        nIntentosMax: 3,
        config: {},
        lectura: {
          estadoLectura: "ERROR",
          humedad: 50,
          temperatura: 25
        }
      });

      expect(resultado.estadoDestino).toBe(ESTADOS.FALLO);
      expect(resultado.accionActuador).toBe("APAGAR");
    });

    // -------------------------
    // 3. RECUPERACIÓN DE FALLA
    // -------------------------
    test("recuperacion desde fallo vuelve a monitoreo", () => {
      const resultado = transitar({
        estadoActual: ESTADOS.FALLO,
        contadorFallidos: 3,
        nIntentosMax: 3,
        config: {
          umin: 30,
          umax: 70,
          umin_critico: 15,
          t_maximo: 40
        },
        lectura: {
          estadoLectura: "VALIDA",
          humedad: 50,
          temperatura: 25
        }
      });

      expect(resultado.estadoDestino).toBe(ESTADOS.MONITOREO);
    });

    // -------------------------
    // 4. TEMPERATURA CRÍTICA
    // -------------------------
    test("temperatura alta detiene riego", () => {
      const resultado = transitar({
        estadoActual: ESTADOS.MONITOREO,
        contadorFallidos: 0,
        nIntentosMax: 3,
        config: {
          umin: 30,
          umax: 70,
          umin_critico: 15,
          t_maximo: 40
        },
        lectura: {
          estadoLectura: "VALIDA",
          humedad: 20,
          temperatura: 50
        }
      });

      expect(resultado.estadoDestino).toBe(ESTADOS.RIEGO_DETENIDO);
      expect(resultado.accionActuador).toBe("APAGAR");
    });

    // -------------------------
    // 5. HUMEDAD BAJA (ACTIVA RIEGO)
    // -------------------------
    test("humedad baja activa riego", () => {
      const resultado = transitar({
        estadoActual: ESTADOS.MONITOREO,
        contadorFallidos: 0,
        nIntentosMax: 3,
        config: {
          umin: 30,
          umax: 70,
          umin_critico: 15,
          t_maximo: 40
        },
        lectura: {
          estadoLectura: "VALIDA",
          humedad: 20,
          temperatura: 25
        }
      });

      expect(resultado.estadoDestino).toBe(ESTADOS.RIEGO_ACTIVO);
      expect(resultado.accionActuador).toBe("ENCENDER");
    });

    // -------------------------
    // 6. HUMEDAD CRÍTICA (rama interna)
    // -------------------------
    test("humedad critica activa riego con alerta", () => {
      const resultado = transitar({
        estadoActual: ESTADOS.MONITOREO,
        contadorFallidos: 0,
        nIntentosMax: 3,
        config: {
          umin: 30,
          umax: 70,
          umin_critico: 15,
          t_maximo: 40
        },
        lectura: {
          estadoLectura: "VALIDA",
          humedad: 10,
          temperatura: 25
        }
      });

      expect(resultado.estadoDestino).toBe(ESTADOS.RIEGO_ACTIVO);
      expect(resultado.accionActuador).toBe("ENCENDER");
    });

    // -------------------------
    // 7. HUMEDAD SUFICIENTE (APAGA RIEGO)
    // -------------------------
    test("humedad suficiente detiene riego", () => {
      const resultado = transitar({
        estadoActual: ESTADOS.MONITOREO,
        contadorFallidos: 0,
        nIntentosMax: 3,
        config: {
          umin: 30,
          umax: 70,
          umin_critico: 15,
          t_maximo: 40
        },
        lectura: {
          estadoLectura: "VALIDA",
          humedad: 80,
          temperatura: 25
        }
      });

      expect(resultado.estadoDestino).toBe(ESTADOS.RIEGO_DETENIDO);
      expect(resultado.accionActuador).toBe("APAGAR");
    });

    // -------------------------
    // 8. HUMEDAD EN RANGO NORMAL
    // -------------------------
    test("humedad en rango mantiene monitoreo", () => {
      const resultado = transitar({
        estadoActual: ESTADOS.MONITOREO,
        contadorFallidos: 0,
        nIntentosMax: 3,
        config: {
          umin: 30,
          umax: 70,
          umin_critico: 15,
          t_maximo: 40
        },
        lectura: {
          estadoLectura: "VALIDA",
          humedad: 50,
          temperatura: 25
        }
      });   

      expect(resultado.estadoDestino).toBe(ESTADOS.MONITOREO);
      expect(resultado.accionActuador).toBeNull();
    });

  });