import { jest } from '@jest/globals';

/* =========================
   MOCKS
========================= */
jest.unstable_mockModule('../../../src/modules/usuarios/usuario.repository.js', () => ({
  findAll: jest.fn(),
  findByCorreoValidacion: jest.fn(),
  findById: jest.fn(),
  findByIdConHash: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateEstado: jest.fn(),
  remove: jest.fn(),
  actualizarPassword: jest.fn(),
  desbloquear: jest.fn(),
}));

jest.unstable_mockModule('../../../src/utils/password.js', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
}));

jest.unstable_mockModule('../../../src/utils/correoInstitucional.js', () => ({
  generarCorreoInstitucional: jest.fn(),
}));

jest.unstable_mockModule('../../../src/utils/AppError.js', () => ({
  AppError: {
    notFound: (m) => ({ type: 'notFound', message: m }),
    conflict: (m) => ({ type: 'conflict', message: m }),
    badRequest: (m) => ({ type: 'badRequest', message: m }),
    forbidden: (m) => ({ type: 'forbidden', message: m }),
  },
}));

/* =========================
   IMPORTS
========================= */
const repo = await import('../../../src/modules/usuarios/usuario.repository.js');
const service = await import('../../../src/modules/usuarios/usuario.service.js');
const pass = await import('../../../src/utils/password.js');
const correo = await import('../../../src/utils/correoInstitucional.js');

/* =========================
   MOCK DATA
========================= */
const usuarioMock = {
  id_usuario: '1',
  nombre: 'Juan',
  apellido: 'Perez',
  correo: 'inst@agrosmart.ec',
  correo_validacion: 'a@gmail.com',
  rol: 'AGRICULTOR',
  estado: 'ACTIVA',
  empresa_identificador: 'emp1',
  bloqueado: false,
  fecha_creacion: new Date(),
};

describe('Usuario Service - FULL 100% BRANCHES', () => {

  beforeEach(() => jest.clearAllMocks());

  /* =========================
     LISTAR
  ========================== */
  test('listar usuarios', async () => {
    repo.findAll.mockResolvedValue([usuarioMock]);

    const res = await service.listar('emp1');

    expect(res[0].id).toBe('1');
  });

  /* =========================
     CREAR (OK + CONFLICT BRANCH)
  ========================== */
  test('crear usuario ok', async () => {
    repo.findByCorreoValidacion.mockResolvedValue(null);
    correo.generarCorreoInstitucional.mockResolvedValue('inst@agrosmart.ec');
    pass.hashPassword.mockResolvedValue('hash');
    repo.create.mockResolvedValue(usuarioMock);

    const res = await service.crear(
      {
        nombre: 'Juan',
        apellido: 'Perez',
        correoValidacion: 'a@gmail.com',
        contra: 'Password1!',
        rol: 'AGRICULTOR',
      },
      'emp1'
    );

    expect(res.correo).toBe('inst@agrosmart.ec');
  });

  test('crear usuario conflict branch', async () => {
    repo.findByCorreoValidacion.mockResolvedValue({ id: 1 });

    await expect(
      service.crear(
        {
          nombre: 'A',
          apellido: 'B',
          correoValidacion: 'x@gmail.com',
          contra: 'Password1!',
          rol: 'AGRICULTOR',
        },
        'emp1'
      )
    ).rejects.toMatchObject({ type: 'conflict' });
  });

  /* =========================
     ACTUALIZAR (OK + NULL + TENANT)
  ========================== */
  test('actualizar ok', async () => {
    repo.findById.mockResolvedValue(usuarioMock);
    repo.update.mockResolvedValue(usuarioMock);

    const res = await service.actualizar('1', { nombre: 'A', apellido: 'B' }, 'u1', 'emp1');

    expect(res.id).toBe('1');
  });

  test('actualizar not found branch', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      service.actualizar('1', {}, 'u1', 'emp1')
    ).rejects.toMatchObject({ type: 'notFound' });
  });

  test('actualizar tenant forbidden branch', async () => {
    repo.findById.mockResolvedValue({ empresa_identificador: 'otro' });

    await expect(
      service.actualizar('1', {}, 'u1', 'emp1')
    ).rejects.toMatchObject({ type: 'forbidden' });
  });

  test('actualizar update null branch (LINEA 70)', async () => {
    repo.findById.mockResolvedValue(usuarioMock);
    repo.update.mockResolvedValue(null);

    await expect(
      service.actualizar('1', { nombre: 'A', apellido: 'B' }, 'u1', 'emp1')
    ).rejects.toMatchObject({ type: 'notFound' });
  });

  /* =========================
     CAMBIAR ESTADO
  ========================== */
  test('cambiar estado self forbidden', async () => {
    await expect(
      service.cambiarEstado('u1', 'ACTIVA', 'u1', 'emp1')
    ).rejects.toMatchObject({ type: 'badRequest' });
  });

  test('cambiar estado ok', async () => {
    repo.findById.mockResolvedValue(usuarioMock);
    repo.updateEstado.mockResolvedValue(usuarioMock);

    const res = await service.cambiarEstado('u2', 'ACTIVA', 'u1', 'emp1');

    expect(res.id).toBe('1');
  });

  /* =========================
     ELIMINAR
  ========================== */
  test('eliminar self forbidden', async () => {
    await expect(
      service.eliminar('u1', 'u1', 'emp1')
    ).rejects.toMatchObject({ type: 'badRequest' });
  });

  test('eliminar ok', async () => {
    repo.findById.mockResolvedValue(usuarioMock);
    repo.remove.mockResolvedValue(true);

    const res = await service.eliminar('u2', 'u1', 'emp1');

    expect(res).toBeUndefined();
  });

  test('eliminar not found branch', async () => {
    repo.findById.mockResolvedValue(usuarioMock);
    repo.remove.mockResolvedValue(false);

    await expect(
      service.eliminar('u2', 'u1', 'emp1')
    ).rejects.toMatchObject({ type: 'notFound' });
  });

  /* =========================
     CAMBIAR PASSWORD
  ========================== */
  test('cambiar password ok', async () => {
    repo.findByIdConHash.mockResolvedValue({ contra_hash: 'hash' });
    pass.verifyPassword.mockResolvedValue(true);
    pass.hashPassword.mockResolvedValue('newhash');

    await service.cambiarPassword('u1', 'old', 'new');

    expect(repo.actualizarPassword).toHaveBeenCalled();
  });

  test('cambiar password usuario no existe (LINEA 98)', async () => {
    repo.findByIdConHash.mockResolvedValue(null);

    await expect(
      service.cambiarPassword('u1', 'old', 'new')
    ).rejects.toMatchObject({ type: 'notFound' });
  });

  test('cambiar password incorrecta branch', async () => {
    repo.findByIdConHash.mockResolvedValue({ contra_hash: 'hash' });
    pass.verifyPassword.mockResolvedValue(false);

    await expect(
      service.cambiarPassword('u1', 'old', 'new')
    ).rejects.toMatchObject({ type: 'badRequest' });
  });

  /* =========================
     RESET PASSWORD
  ========================== */
  test('reset password forbidden tenant', async () => {
    repo.findById.mockResolvedValue({ empresa_identificador: 'otro' });

    await expect(
      service.resetearPassword('emp1', 'u1', 'new')
    ).rejects.toMatchObject({ type: 'forbidden' });
  });

  test('reset password ok', async () => {
    repo.findById.mockResolvedValue(usuarioMock);
    pass.hashPassword.mockResolvedValue('hash');

    await service.resetearPassword('emp1', 'u1', 'new');

    expect(repo.actualizarPassword).toHaveBeenCalled();
    expect(repo.desbloquear).toHaveBeenCalled();
  });

});