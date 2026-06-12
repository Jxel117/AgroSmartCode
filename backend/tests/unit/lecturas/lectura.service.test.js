import { jest } from '@jest/globals';

/* =========================
   MOCKS (RUTAS CORRECTAS)
========================= */

jest.unstable_mockModule('../../../src/modules/lecturas/lectura.repository.js', () => ({
  create: jest.fn(),
  actualizarUltimaLecturaNodo: jest.fn(),
  findRecientesPorParcela: jest.fn(),
}));

jest.unstable_mockModule('../../../src/modules/nodos/nodo.repository.js', () => ({
  findById: jest.fn(),
}));

jest.unstable_mockModule('../../../src/modules/riego/configuracion.repository.js', () => ({
  findVigente: jest.fn(),
}));

jest.unstable_mockModule('../../../src/modules/riego/actuador.repository.js', () => ({
  setEstado: jest.fn(),
}));

jest.unstable_mockModule('../../../src/modules/afd/afd.repository.js', () => ({
  findOrCreateByParcela: jest.fn(),
  aplicarTransicion: jest.fn(),
}));

jest.unstable_mockModule('../../../src/modules/alertas/alerta.repository.js', () => ({
  create: jest.fn(),
}));

jest.unstable_mockModule('../../../src/modules/afd/afd.machine.js', () => ({
  transitar: jest.fn(),
  ESTADOS: {},
}));

/* =========================
   IMPORTS (DESPUÉS DE MOCKS)
========================= */

const lecturaRepo = await import('../../../src/modules/lecturas/lectura.repository.js');
const nodoRepo = await import('../../../src/modules/nodos/nodo.repository.js');
const configRepo = await import('../../../src/modules/riego/configuracion.repository.js');
const actuadorRepo = await import('../../../src/modules/riego/actuador.repository.js');
const afdRepo = await import('../../../src/modules/afd/afd.repository.js');
const alertaRepo = await import('../../../src/modules/alertas/alerta.repository.js');
const afdMachine = await import('../../../src/modules/afd/afd.machine.js');

const service = await import('../../../src/modules/lecturas/lectura.service.js');

/* =========================
   TESTS
========================= */

describe('Lectura Service - Cobertura Total', () => {

  beforeEach(() => jest.clearAllMocks());

  /* =========================
     CASO: nodo no existe
  ========================== */
  test('retorna null si el nodo no existe', async () => {

    nodoRepo.findById.mockResolvedValue(null);

    const res = await service.ingestar(1, { humedad: 50 });

    expect(res).toBeNull();
  });

  /* =========================
     CASO: lectura inválida
  ========================== */
  test('clasifica ERROR_SENSOR_SIN_RESPUESTA', async () => {

    nodoRepo.findById.mockResolvedValue({ id: 1, parcela_id: null });

    lecturaRepo.create.mockResolvedValue({ id: 1 });

    const res = await service.ingestar(1, { humedad: null, temperatura: null });

    expect(lecturaRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        estadoLectura: 'ERROR_SENSOR_SIN_RESPUESTA'
      })
    );

    expect(res.lectura).toBeDefined();
  });

  /* =========================
     CASO: fuera de rango
  ========================== */
  test('clasifica ERROR_FUERA_DE_RANGO', async () => {

    nodoRepo.findById.mockResolvedValue({ id: 1, parcela_id: null });

    lecturaRepo.create.mockResolvedValue({ id: 1 });

    await service.ingestar(1, { humedad: 150, temperatura: 20 });

    expect(lecturaRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        estadoLectura: 'ERROR_FUERA_DE_RANGO'
      })
    );
  });

  /* =========================
     CASO: sin parcela
  ========================== */
  test('retorna resultado básico si no hay parcela', async () => {

    nodoRepo.findById.mockResolvedValue({ id: 1, parcela_id: null });

    lecturaRepo.create.mockResolvedValue({ id: 1, estadoLectura: 'VALIDA' });

    const res = await service.ingestar(1, { humedad: 40 });

    expect(res.alertas).toEqual([]);
    expect(res.transicion).toBeNull();
  });

  /* =========================
     CASO: alerta crítica
  ========================== */
  test('genera alerta FALLO_SENSOR', async () => {

    nodoRepo.findById.mockResolvedValue({ id: 1, parcela_id: 10 });

    lecturaRepo.create.mockResolvedValue({ id: 1, estadoLectura: 'ERROR_FUERA_DE_RANGO' });

    configRepo.findVigente.mockResolvedValue(null);

    alertaRepo.create.mockResolvedValue({ id: 1 });

    const res = await service.ingestar(1, { humedad: 200 });

    expect(alertaRepo.create).toHaveBeenCalled();
    expect(res.alertas.length).toBe(1);
  });

  /* =========================
     CASO: HUMEDAD + TEMP
  ========================== */
  test('genera alertas múltiples', async () => {

    nodoRepo.findById.mockResolvedValue({ id: 1, parcela_id: 10 });

    lecturaRepo.create.mockResolvedValue({ id: 1, estadoLectura: 'VALIDA' });

    configRepo.findVigente.mockResolvedValue({
      umin_critico: 30,
      t_maximo: 35,
      n_intentos_fallidos_max: 3
    });

    alertaRepo.create
      .mockResolvedValueOnce({ id: 'A1' })
      .mockResolvedValueOnce({ id: 'A2' });

    afdRepo.findOrCreateByParcela.mockResolvedValue({
      estado_actual: 'INICIAL',
      contador_intentos_fallidos: 0,
      n_intentos_fallidos_max: 3
    });

    afdMachine.transitar.mockReturnValue({
      estadoDestino: 'INICIAL',
      simbolo: 'X',
      causa: 'test',
      contadorFallidos: 0,
      accionActuador: null
    });

    const res = await service.ingestar(1, {
      humedad: 10,
      temperatura: 50
    });

    expect(res.alertas.length).toBe(2);
  });

  /* =========================
     CASO: SIN CONFIG
  ========================== */
  test('salta AFD si no hay config', async () => {

    nodoRepo.findById.mockResolvedValue({ id: 1, parcela_id: 10 });

    lecturaRepo.create.mockResolvedValue({ id: 1, estadoLectura: 'VALIDA' });

    configRepo.findVigente.mockResolvedValue(null);

    const res = await service.ingestar(1, { humedad: 40 });

    expect(afdRepo.findOrCreateByParcela).not.toHaveBeenCalled();
    expect(res.transicion).toBeNull();
  });

  /* =========================
     CASO: ENCENDER
  ========================== */
  test('enciende actuador', async () => {

    nodoRepo.findById.mockResolvedValue({ id: 1, parcela_id: 10 });

    lecturaRepo.create.mockResolvedValue({ id: 1, estadoLectura: 'VALIDA' });

    configRepo.findVigente.mockResolvedValue({
      n_intentos_fallidos_max: 3
    });

    afdRepo.findOrCreateByParcela.mockResolvedValue({
      estado_actual: 'INICIAL',
      contador_intentos_fallidos: 0,
      n_intentos_fallidos_max: 3
    });

    afdMachine.transitar.mockReturnValue({
      estadoDestino: 'RIEGO',
      simbolo: 'ON',
      causa: 'humedad baja',
      contadorFallidos: 0,
      accionActuador: 'ENCENDER'
    });

    await service.ingestar(1, { humedad: 10 });

    expect(actuadorRepo.setEstado).toHaveBeenCalledWith(10, true);
  });

  /* =========================
     CASO: APAGAR
  ========================== */
  test('apaga actuador', async () => {

    nodoRepo.findById.mockResolvedValue({ id: 1, parcela_id: 10 });

    lecturaRepo.create.mockResolvedValue({ id: 1, estadoLectura: 'VALIDA' });

    configRepo.findVigente.mockResolvedValue({
      n_intentos_fallidos_max: 3
    });

    afdRepo.findOrCreateByParcela.mockResolvedValue({
      estado_actual: 'RIEGO',
      contador_intentos_fallidos: 0,
      n_intentos_fallidos_max: 3
    });

    afdMachine.transitar.mockReturnValue({
      estadoDestino: 'INICIAL',
      simbolo: 'OFF',
      causa: 'ok',
      contadorFallidos: 0,
      accionActuador: 'APAGAR'
    });

    await service.ingestar(1, { humedad: 80 });

    expect(actuadorRepo.setEstado).toHaveBeenCalledWith(10, false);
  });

});