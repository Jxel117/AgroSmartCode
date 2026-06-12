import { jest } from '@jest/globals';

/* =========================
   MOCK REPOSITORY
========================= */

jest.unstable_mockModule('../../../src/modules/parcelas/parcela.repository.js', () => ({
  findByAgricultor: jest.fn(),
  findByEmpresa: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  asignarAgricultor: jest.fn(),
  desasignarAgricultor: jest.fn(),
  findAgricultoresAsignados: jest.fn()
}));

/* =========================
   IMPORTS
========================= */

const repo = await import('../../../src/modules/parcelas/parcela.repository.js');
const service = await import('../../../src/modules/parcelas/parcela.service.js');

/* =========================
   TESTS
========================= */

describe('Parcela Service - cobertura completa', () => {

  beforeEach(() => jest.clearAllMocks());

  /* =========================
     LISTAR
  ========================== */

  test('listar agricultor usa findByAgricultor', async () => {
    repo.findByAgricultor.mockResolvedValue([{ id: 1 }]);

    const res = await service.listar({ rol: 'AGRICULTOR', id: 'u1' });

    expect(repo.findByAgricultor).toHaveBeenCalledWith('u1');
    expect(res).toEqual([{ id: 1 }]);
  });

  test('listar admin usa findByEmpresa', async () => {
    repo.findByEmpresa.mockResolvedValue([{ id: 2 }]);

    const res = await service.listar({ rol: 'ADMIN', empresa: 'emp1' });

    expect(repo.findByEmpresa).toHaveBeenCalledWith('emp1');
    expect(res).toEqual([{ id: 2 }]);
  });

  /* =========================
     OBTENER (TENANT)
  ========================== */

  test('obtener lanza notFound si no existe', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.obtener('1', { empresa: 'emp1' }))
      .rejects
      .toThrow();
  });

  test('obtener lanza forbidden si empresa no coincide', async () => {
    repo.findById.mockResolvedValue({
      empresa_identificador: 'empX'
    });

    await expect(service.obtener('1', { empresa: 'emp1' }))
      .rejects
      .toThrow();
  });

  test('obtener retorna parcela válida', async () => {
    repo.findById.mockResolvedValue({
      empresa_identificador: 'emp1'
    });

    const res = await service.obtener('1', { empresa: 'emp1' });

    expect(res.empresa_identificador).toBe('emp1');
  });

  /* =========================
     CREAR
  ========================== */

  test('crear llama repo.create con defaults', async () => {
    repo.create.mockResolvedValue({ id: 1 });

    const res = await service.crear({ nombreDescriptivo: 'A' }, 'emp1');

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        empresaIdentificador: 'emp1',
        latitud: null,
        longitud: null,
        areaM2: null
      })
    );

    expect(res.id).toBe(1);
  });

  /* =========================
     ACTUALIZAR
  ========================== */

  test('actualizar ejecuta update', async () => {
    repo.findById.mockResolvedValue({ empresa_identificador: 'emp1' });
    repo.update.mockResolvedValue({ id: 1 });

    const res = await service.actualizar('1', {}, 'emp1');

    expect(repo.update).toHaveBeenCalled();
    expect(res.id).toBe(1);
  });

  /* =========================
     ELIMINAR
  ========================== */

  test('eliminar ejecuta remove', async () => {
    repo.findById.mockResolvedValue({ empresa_identificador: 'emp1' });
    repo.remove.mockResolvedValue(true);

    await service.eliminar('1', 'emp1');

    expect(repo.remove).toHaveBeenCalledWith('1');
  });

  /* =========================
     ASIGNAR / DESASIGNAR
  ========================== */

  test('asignar agricultor', async () => {
    repo.findById.mockResolvedValue({ empresa_identificador: 'emp1' });

    await service.asignar('1', 'u1', 'emp1');

    expect(repo.asignarAgricultor).toHaveBeenCalledWith('1', 'u1');
  });

  test('desasignar agricultor', async () => {
    repo.findById.mockResolvedValue({ empresa_identificador: 'emp1' });

    await service.desasignar('1', 'u1', 'emp1');

    expect(repo.desasignarAgricultor).toHaveBeenCalledWith('1', 'u1');
  });

  /* =========================
     LISTAR AGRICULTORES
  ========================== */

  test('listarAgricultores retorna lista', async () => {
    repo.findById.mockResolvedValue({ empresa_identificador: 'emp1' });
    repo.findAgricultoresAsignados.mockResolvedValue([{ id: 1 }]);

    const res = await service.listarAgricultores('1', 'emp1');

    expect(res).toEqual([{ id: 1 }]);
  });

});