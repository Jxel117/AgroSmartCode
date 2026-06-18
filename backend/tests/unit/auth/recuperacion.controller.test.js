import { jest } from '@jest/globals';

/* =========================
   MOCK DEL SERVICE (ESM)
========================= */

jest.unstable_mockModule(
  '../../../src/modules/auth/recuperacion.service.js',
  () => ({
    solicitarRecuperacion: jest.fn(),
    verificarToken: jest.fn(),
    completarRecuperacion: jest.fn()
  })
);

/* =========================
   IMPORTS DESPUÉS DE MOCKS
========================= */

const service =
  await import('../../../src/modules/auth/recuperacion.service.js');

const controller =
  await import('../../../src/modules/auth/recuperacion.controller.js');

/* =========================
   HELPERS MOCK req/res
========================= */

const mockRes = () => {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (data = {}) => data;

/* =========================
   TESTS
========================= */

describe('RECUPERACION CONTROLLER - caja blanca', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* =========================
     SOLICITAR
  ========================== */

  test('solicitar: debe llamar service y responder mensaje neutro', async () => {
    service.solicitarRecuperacion.mockResolvedValue();

    const req = mockReq({ body: { correoValidacion: 'test@test.com' } });
    const res = mockRes();

    await controller.solicitar(req, res);

    expect(service.solicitarRecuperacion)
      .toHaveBeenCalledWith('test@test.com');

    expect(res.json).toHaveBeenCalledWith({
      mensaje:
        'Si el correo está registrado, recibirás un enlace de recuperación en breve.'
    });
  });

  /* =========================
     VERIFICAR
  ========================== */

  test('verificar: debe retornar resultado del service', async () => {
    service.verificarToken.mockResolvedValue({
      valido: true,
      usuarioId: 1
    });

    const req = mockReq({ params: { token: 'abc123' } });
    const res = mockRes();

    await controller.verificar(req, res);

    expect(service.verificarToken)
      .toHaveBeenCalledWith('abc123');

    expect(res.json).toHaveBeenCalledWith({
      valido: true,
      usuarioId: 1
    });
  });

  /* =========================
     COMPLETAR
  ========================== */

  test('completar: debe cambiar contraseña y responder mensaje', async () => {
    service.completarRecuperacion.mockResolvedValue({
      correo: 'test@test.com'
    });

    const req = mockReq({
      params: { token: 'abc123' },
      body: { passwordNueva: '123456' }
    });

    const res = mockRes();

    await controller.completar(req, res);

    expect(service.completarRecuperacion)
      .toHaveBeenCalledWith('abc123', '123456');

    expect(res.json).toHaveBeenCalledWith({
      mensaje:
        'Contraseña restablecida correctamente. Ya puedes iniciar sesión.',
      correo: 'test@test.com'
    });
  });

});