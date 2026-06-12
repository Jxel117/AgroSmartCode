import { jest } from '@jest/globals';

/* =========================
   MOCK DEPENDENCIAS
========================= */

jest.unstable_mockModule('../../../src/modules/nodos/nodo.repository.js', () => ({
  findByEmpresa: jest.fn(),
  findById: jest.fn(),
  createConCredencial: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  actualizarEstado: jest.fn()
}));

jest.unstable_mockModule('../../../src/utils/password.js', () => ({
  hashPassword: jest.fn(() => Promise.resolve('hash'))
}));

jest.unstable_mockModule('../../../src/mqtt/brokerAuth.js', () => ({
  registrarUsuarioBroker: jest.fn(() => Promise.resolve())
}));

/* =========================
   IMPORT SERVICE
========================= */

const repo = await import('../../../src/modules/nodos/nodo.repository.js');
const service = await import('../../../src/modules/nodos/nodo.service.js');

/* =========================
   TESTS
========================= */

describe('Nodo Service - cobertura completa', () => {

  beforeEach(() => jest.clearAllMocks());

  /* =========================
     LISTAR
  ========================== */
  test('listar retorna nodos', async () => {
    repo.findByEmpresa.mockResolvedValue([{ id: 1 }]);

    const res = await service.listar('emp1');

    expect(res).toEqual([{ id: 1 }]);
  });

  /* =========================
     OBTENER
  ========================== */
  test('obtener lanza error si no existe nodo', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.obtener('1'))
      .rejects
      .toThrow();
  });

  test('obtener retorna nodo', async () => {
    repo.findById.mockResolvedValue({ id: 1 });

    const res = await service.obtener('1');

    expect(res.id).toBe(1);
  });

  /* =========================
     CREAR
  ========================== */
  test('crear genera nodo y credenciales', async () => {
    repo.createConCredencial.mockResolvedValue({ id_nodo: 1 });

    const res = await service.crear({ parcelaId: 1 }, 'emp1');

    expect(repo.createConCredencial).toHaveBeenCalled();
    expect(res.nodo.id_nodo).toBe(1);
    expect(res.credenciales.identificador).toBeDefined();
    expect(res.credenciales.secreto).toBeDefined();
  });

  /* =========================
     ACTUALIZAR
  ========================== */
  test('actualizar retorna nodo actualizado', async () => {
    repo.findById.mockResolvedValue({
      tipo_sensor: 'x',
      modelo_hardware: 'y',
      estado: 'ACTIVO'
    });

    repo.update.mockResolvedValue({ id_nodo: 1 });

    const res = await service.actualizar('1', {});

    expect(res.id_nodo).toBe(1);
  });

  test('actualizar lanza error si no existe', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.actualizar('1', {}))
      .rejects
      .toThrow();
  });

  /* =========================
     CAMBIAR ESTADO
  ========================== */
  test('cambiarEstado lanza error si no existe', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.cambiarEstado('1', 'ACTIVO'))
      .rejects
      .toThrow();
  });

  test('cambiarEstado bloquea si estado FALLO', async () => {
    repo.findById.mockResolvedValue({ estado: 'FALLO' });

    await expect(service.cambiarEstado('1', 'ACTIVO'))
      .rejects
      .toThrow();
  });

  test('cambiarEstado actualiza estado normal', async () => {
    repo.findById.mockResolvedValue({ estado: 'ACTIVO' });
    repo.actualizarEstado.mockResolvedValue({ id_nodo: 1 });

    const res = await service.cambiarEstado('1', 'INACTIVO');

    expect(res.id_nodo).toBe(1);
  });

  /* =========================
     ELIMINAR
  ========================== */
  test('eliminar OK', async () => {
    repo.remove.mockResolvedValue(true);

    await expect(service.eliminar('1')).resolves.toBeUndefined();
  });

  test('eliminar lanza error si no existe', async () => {
    repo.remove.mockResolvedValue(false);

    await expect(service.eliminar('1'))
      .rejects
      .toThrow();
  });

});