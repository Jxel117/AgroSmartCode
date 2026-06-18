import { jest } from '@jest/globals';

/* =========================
   MOCKS
========================= */

jest.unstable_mockModule('../../../src/modules/usuarios/usuario.repository.js', () => ({
  findByCorreoValidacion: jest.fn(),
  actualizarPassword: jest.fn(),
  desbloquear: jest.fn()
}));

jest.unstable_mockModule('../../../src/modules/auth/tokenRecuperacion.repository.js', () => ({
  crearToken: jest.fn(),
  buscarTokenValido: jest.fn(),
  marcarUsado: jest.fn()
}));

jest.unstable_mockModule('../../../src/utils/password.js', () => ({
  hashPassword: jest.fn()
}));

jest.unstable_mockModule('../../../src/services/email.service.js', () => ({
  enviarEmail: jest.fn(),
  plantillaEmail: jest.fn(() => '<html></html>')
}));

jest.unstable_mockModule('../../../src/config/env.js', () => ({
  env: {
    appUrlFrontend: 'http://localhost'
  }
}));

jest.unstable_mockModule('../../../src/utils/AppError.js', () => ({
  AppError: {
    badRequest: (msg) => new Error(msg)
  }
}));

/* =========================
   IMPORTS
========================= */

const service = await import('../../../src/modules/auth/recuperacion.service.js');
const usuarioRepo = await import('../../../src/modules/usuarios/usuario.repository.js');
const tokenRepo = await import('../../../src/modules/auth/tokenRecuperacion.repository.js');
const { hashPassword } = await import('../../../src/utils/password.js');
const emailService = await import('../../../src/services/email.service.js');

/* =========================
   TESTS
========================= */

describe('RECUPERACION SERVICE - FULL BRANCH', () => {

  beforeEach(() => jest.clearAllMocks());

  /* =========================
     SOLICITAR RECUPERACION
  ========================== */

  test('solicitar: usuario no existe', async () => {
    usuarioRepo.findByCorreoValidacion.mockResolvedValue(null);

    const res = await service.solicitarRecuperacion('x@mail.com');

    expect(res).toEqual({ enviado: false });
  });

  test('solicitar: usuario existe con nombre', async () => {
    usuarioRepo.findByCorreoValidacion.mockResolvedValue({
      id_usuario: 1,
      nombre: 'Juan'
    });

    tokenRepo.crearToken.mockResolvedValue({ token: 'abc' });

    const res = await service.solicitarRecuperacion('x@mail.com');

    expect(tokenRepo.crearToken).toHaveBeenCalledWith(1);
    expect(emailService.enviarEmail).toHaveBeenCalled();
    expect(res).toEqual({ enviado: true });
  });

  test('solicitar: usuario existe SIN nombre (cubre ?? branch)', async () => {
    usuarioRepo.findByCorreoValidacion.mockResolvedValue({
      id_usuario: 2,
      nombre: null
    });

    tokenRepo.crearToken.mockResolvedValue({ token: 'xyz' });

    await service.solicitarRecuperacion('x@mail.com');

    expect(emailService.enviarEmail).toHaveBeenCalled();
  });

  /* =========================
     COMPLETAR RECUPERACION
  ========================== */

  test('completar: token inválido', async () => {
    tokenRepo.buscarTokenValido.mockResolvedValue(null);

    await expect(
      service.completarRecuperacion('t', '123')
    ).rejects.toThrow();
  });

  test('completar: YA_USADO', async () => {
    tokenRepo.buscarTokenValido.mockResolvedValue({
      motivo: 'YA_USADO'
    });

    await expect(
      service.completarRecuperacion('t', '123')
    ).rejects.toThrow();
  });

  test('completar: EXPIRADO', async () => {
    tokenRepo.buscarTokenValido.mockResolvedValue({
      motivo: 'EXPIRADO'
    });

    await expect(
      service.completarRecuperacion('t', '123')
    ).rejects.toThrow();
  });

  test('completar: flujo correcto completo', async () => {
    tokenRepo.buscarTokenValido.mockResolvedValue({
      fila: {
        id_usuario: 1,
        id_token: 99,
        correo: 'a@a.com',
        nombre: 'Juan'
      }
    });

    hashPassword.mockResolvedValue('hash');

    const res = await service.completarRecuperacion('t', '123');

    expect(usuarioRepo.actualizarPassword).toHaveBeenCalledWith(1, 'hash');
    expect(usuarioRepo.desbloquear).toHaveBeenCalledWith(1);
    expect(tokenRepo.marcarUsado).toHaveBeenCalledWith(99);

    expect(res).toEqual({
      correo: 'a@a.com',
      nombre: 'Juan'
    });
  });

  /* =========================
     VERIFICAR TOKEN (CUBRIR TODAS LAS RAMAS)
  ========================== */

  test('verificarToken: NO_EXISTE branch', async () => {
    tokenRepo.buscarTokenValido.mockResolvedValue(null);

    const res = await service.verificarToken('t');

    expect(res).toEqual({
      valido: false,
      motivo: 'NO_EXISTE'
    });
  });

  test('verificarToken: motivo existente', async () => {
    tokenRepo.buscarTokenValido.mockResolvedValue({
      motivo: 'EXPIRADO'
    });

    const res = await service.verificarToken('t');

    expect(res).toEqual({
      valido: false,
      motivo: 'EXPIRADO'
    });
  });

  test('verificarToken: válido completo', async () => {
    tokenRepo.buscarTokenValido.mockResolvedValue({
      fila: {
        correo: 'test@mail.com',
        nombre: 'Juan'
      }
    });

    const res = await service.verificarToken('t');

    expect(res).toEqual({
      valido: true,
      correo: 'test@mail.com',
      nombre: 'Juan'
    });
  });

});