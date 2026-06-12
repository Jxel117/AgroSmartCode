import { jest } from '@jest/globals';

/* =========================
   MOCKS (OBLIGATORIO PRIMERO)
========================= */

jest.unstable_mockModule('../../../src/modules/usuarios/usuario.repository.js', () => ({
  findByCorreoValidacion: jest.fn(),
  create: jest.fn(),
  bloquear: jest.fn()
}));

jest.unstable_mockModule('../../../src/modules/auth/tokenRecuperacion.repository.js', () => ({
  crearToken: jest.fn()
}));

jest.unstable_mockModule('../../../src/utils/password.js', () => ({
  hashPassword: jest.fn()
}));

jest.unstable_mockModule('../../../src/utils/correoInstitucional.js', () => ({
  generarCorreoInstitucional: jest.fn()
}));

jest.unstable_mockModule('../../../src/services/email.service.js', () => ({
  enviarEmail: jest.fn(),
  plantillaEmail: jest.fn(() => '<html>Email</html>')
}));

jest.unstable_mockModule('../../../src/config/env.js', () => ({
  env: {
    appUrlFrontend: 'http://localhost'
  }
}));

jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  query: jest.fn()
}));

/* =========================
   IMPORTS DESPUÉS DE MOCKS
========================= */

const { registrarEmpresa } = await import(
  '../../../src/modules/auth/registroEmpresa.service.js'
);

const usuarioRepo = await import(
  '../../../src/modules/usuarios/usuario.repository.js'
);

const tokenRepo = await import(
  '../../../src/modules/auth/tokenRecuperacion.repository.js'
);

const { hashPassword } = await import(
  '../../../src/utils/password.js'
);

const { generarCorreoInstitucional } = await import(
  '../../../src/utils/correoInstitucional.js'
);

const emailService = await import(
  '../../../src/services/email.service.js'
);

const pool = await import('../../../src/db/pool.js');

/* =========================
   TESTS
========================= */

describe('REGISTRO EMPRESA SERVICE - caja blanca', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* =========================
     CASO 1: correo ya existe
  ========================== */
  test('❌ debe lanzar error si correo ya existe', async () => {
    usuarioRepo.findByCorreoValidacion.mockResolvedValue({ id: 1 });

    await expect(
      registrarEmpresa({
        correoValidacion: 'test@gmail.com',
        empresaIdentificador: 'EMP01',
        nombre: 'Juan',
        apellido: 'Perez'
      })
    ).rejects.toThrow();
  });

  /* =========================
     CASO 2: empresa ya existe
  ========================== */
  test('❌ debe lanzar error si empresa ya existe', async () => {
    usuarioRepo.findByCorreoValidacion.mockResolvedValue(null);

    pool.query.mockResolvedValue({
      rows: [{ id: 1 }]
    });

    await expect(
      registrarEmpresa({
        correoValidacion: 'test@gmail.com',
        empresaIdentificador: 'EMP01',
        nombre: 'Juan',
        apellido: 'Perez'
      })
    ).rejects.toThrow();
  });

  /* =========================
     CASO 3: flujo correcto
  ========================== */
  test('✅ debe registrar empresa correctamente', async () => {
    usuarioRepo.findByCorreoValidacion.mockResolvedValue(null);

    pool.query.mockResolvedValue({ rows: [] });

    generarCorreoInstitucional.mockResolvedValue('admin@uni.edu');
    hashPassword.mockResolvedValue('hash123');

    usuarioRepo.create.mockResolvedValue({
      id_usuario: 10
    });

    tokenRepo.crearToken.mockResolvedValue({
      token: 'token123'
    });

    const res = await registrarEmpresa({
      correoValidacion: 'test@gmail.com',
      empresaIdentificador: 'EMP01',
      nombre: 'Juan',
      apellido: 'Perez'
    });

    expect(res.correoInstitucional).toBe('admin@uni.edu');
    expect(usuarioRepo.create).toHaveBeenCalled();
    expect(usuarioRepo.bloquear).toHaveBeenCalledWith(10);
    expect(emailService.enviarEmail).toHaveBeenCalled();
  });

});