import { jest } from '@jest/globals';

/* =========================
   MOCKS ESM (OBLIGATORIO PRIMERO)
========================= */

jest.unstable_mockModule('../../../src/modules/usuarios/usuario.repository.js', () => ({
  default: {},
  existeAlgunAdmin: jest.fn(),
  findByCorreoValidacion: jest.fn(),
  findByCorreo: jest.fn(),
  incrementarIntentosFallidos: jest.fn(),
  bloquear: jest.fn(),
  resetearIntentos: jest.fn(), // 🔥 FIX CLAVE
  create: jest.fn()
}));

jest.unstable_mockModule('../../../src/modules/usuarios/intentoLogin.repository.js', () => ({
  default: {},
  registrar: jest.fn()
}));

jest.unstable_mockModule('../../../src/modules/usuarios/sesion.repository.js', () => ({
  default: {},
  crearSesion: jest.fn(),
  revocarPorToken: jest.fn()
}));

jest.unstable_mockModule('../../../src/services/recaptcha.service.js', () => ({
  verificarRecaptcha: jest.fn()
}));

jest.unstable_mockModule('../../../src/utils/password.js', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn()
}));

jest.unstable_mockModule('../../../src/utils/jwt.js', () => ({
  signToken: jest.fn()
}));

jest.unstable_mockModule('../../../src/utils/correoInstitucional.js', () => ({
  generarCorreoInstitucional: jest.fn()
}));

/* =========================
   IMPORTS DESPUÉS DE MOCKS
========================= */

const { registrar, login, logout } =
  await import('../../../src/modules/auth/auth.service.js');

const usuarioRepo =
  await import('../../../src/modules/usuarios/usuario.repository.js');

const intentoRepo =
  await import('../../../src/modules/usuarios/intentoLogin.repository.js');

const sesionRepo =
  await import('../../../src/modules/usuarios/sesion.repository.js');

const recaptchaService =
  await import('../../../src/services/recaptcha.service.js');

const correoInstitucional =
  await import('../../../src/utils/correoInstitucional.js');

const { hashPassword, verifyPassword } =
  await import('../../../src/utils/password.js');

const { signToken } =
  await import('../../../src/utils/jwt.js');

const { AppError } =
  await import('../../../src/utils/AppError.js');

/* =========================
   TESTS
========================= */

describe('AUTH SERVICE - caja blanca completa', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* =========================
     REGISTRAR
  ========================== */

  test('❌ registrar: ya existe admin => forbidden', async () => {
    usuarioRepo.existeAlgunAdmin.mockResolvedValue(true);

    await expect(registrar({
      rol: 'ADMINISTRADOR',
      correoValidacion: 'test@test.com'
    })).rejects.toThrow(AppError);
  });

  test('❌ registrar: rol inválido => badRequest', async () => {
    usuarioRepo.existeAlgunAdmin.mockResolvedValue(false);

    await expect(registrar({
      rol: 'USER',
      correoValidacion: 'test@test.com'
    })).rejects.toThrow(AppError);
  });

  test('❌ registrar: correo validación existe => conflict', async () => {
    usuarioRepo.existeAlgunAdmin.mockResolvedValue(false);
    usuarioRepo.findByCorreoValidacion.mockResolvedValue({ id: 1 });

    await expect(registrar({
      rol: 'ADMINISTRADOR',
      correoValidacion: 'test@test.com'
    })).rejects.toThrow(AppError);
  });

  test('✅ registrar: flujo correcto', async () => {
    usuarioRepo.existeAlgunAdmin.mockResolvedValue(false);
    usuarioRepo.findByCorreoValidacion.mockResolvedValue(null);

    correoInstitucional.generarCorreoInstitucional.mockResolvedValue('inst@uni.edu');
    hashPassword.mockResolvedValue('hash123');

    usuarioRepo.create.mockResolvedValue({
      id_usuario: 1,
      nombre: 'Juan',
      apellido: 'Perez',
      correo: 'inst@uni.edu',
      correo_validacion: 'test@test.com',
      rol: 'ADMINISTRADOR',
      estado: 'ACTIVA',
      empresa_identificador: null
    });

    const res = await registrar({
      nombre: 'Juan',
      apellido: 'Perez',
      rol: 'ADMINISTRADOR',
      correoValidacion: 'test@test.com',
      contra: '1234'
    });

    expect(res).toHaveProperty('id');
    expect(usuarioRepo.create).toHaveBeenCalled();
  });

  /* =========================
     LOGIN
  ========================== */

  test('❌ login: captcha inválido', async () => {
    recaptchaService.verificarRecaptcha.mockResolvedValue({ valido: false });

    await expect(login(
      { correo: 'a', contra: 'b', captchaToken: 'x' },
      '127.0.0.1'
    )).rejects.toThrow(AppError);
  });

  test('❌ login: usuario no existe', async () => {
    recaptchaService.verificarRecaptcha.mockResolvedValue({ valido: true });
    usuarioRepo.findByCorreo.mockResolvedValue(null);

    await expect(login(
      { correo: 'a', contra: 'b', captchaToken: 'x' },
      '127.0.0.1'
    )).rejects.toThrow(AppError);

    expect(intentoRepo.registrar).toHaveBeenCalled();
  });

  test('❌ login: cuenta bloqueada', async () => {
    recaptchaService.verificarRecaptcha.mockResolvedValue({ valido: true });
    usuarioRepo.findByCorreo.mockResolvedValue({ bloqueado: true });

    await expect(login(
      { correo: 'a', contra: 'b', captchaToken: 'x' },
      '127.0.0.1'
    )).rejects.toThrow(AppError);
  });

  test('❌ login: cuenta inactiva', async () => {
    recaptchaService.verificarRecaptcha.mockResolvedValue({ valido: true });
    usuarioRepo.findByCorreo.mockResolvedValue({
      estado: 'INACTIVA',
      bloqueado: false
    });

    await expect(login(
      { correo: 'a', contra: 'b', captchaToken: 'x' },
      '127.0.0.1'
    )).rejects.toThrow(AppError);
  });

  test('❌ login: password incorrecta con bloqueo', async () => {
    recaptchaService.verificarRecaptcha.mockResolvedValue({ valido: true });

    usuarioRepo.findByCorreo.mockResolvedValue({
      id_usuario: 1,
      contra_hash: 'hash',
      bloqueado: false,
      estado: 'ACTIVA'
    });

    verifyPassword.mockResolvedValue(false);
    usuarioRepo.incrementarIntentosFallidos.mockResolvedValue(3);

    await expect(login(
      { correo: 'a', contra: 'b', captchaToken: 'x' },
      '127.0.0.1'
    )).rejects.toThrow(AppError);
  });

  test('❌ login: password incorrecta sin bloqueo', async () => {
    recaptchaService.verificarRecaptcha.mockResolvedValue({ valido: true });

    usuarioRepo.findByCorreo.mockResolvedValue({
      id_usuario: 1,
      contra_hash: 'hash',
      bloqueado: false,
      estado: 'ACTIVA'
    });

    verifyPassword.mockResolvedValue(false);
    usuarioRepo.incrementarIntentosFallidos.mockResolvedValue(1);

    await expect(login(
      { correo: 'a', contra: 'b', captchaToken: 'x' },
      '127.0.0.1'
    )).rejects.toThrow(AppError);
  });

  test('✅ login: correcto', async () => {
    recaptchaService.verificarRecaptcha.mockResolvedValue({ valido: true });

    usuarioRepo.findByCorreo.mockResolvedValue({
      id_usuario: 1,
      rol: 'ADMINISTRADOR',
      correo: 'a@a.com',
      empresa_identificador: 10,
      contra_hash: 'hash',
      estado: 'ACTIVA',
      bloqueado: false
    });

    verifyPassword.mockResolvedValue(true);
    signToken.mockReturnValue('token123');

    const res = await login(
      { correo: 'a', contra: 'b', captchaToken: 'x' },
      '127.0.0.1'
    );

    expect(res.token).toBe('token123');
    expect(sesionRepo.crearSesion).toHaveBeenCalled();
  });

  /* =========================
     LOGOUT
  ========================== */

  test('logout: revoca token', async () => {
    await logout('token123');

    expect(sesionRepo.revocarPorToken).toHaveBeenCalledWith('token123');
  });

});