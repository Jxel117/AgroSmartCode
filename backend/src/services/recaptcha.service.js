import { env } from '../config/env.js';

/**
 * Verifica un token de reCAPTCHA v2 contra el servicio de Google.
 * Devuelve true si el captcha es valido, false en caso contrario.
 * Si RECAPTCHA_ENABLED=false, siempre devuelve true (modo desarrollo).
 */
export async function verificarRecaptcha(token, ip) {
  if (!env.recaptcha.enabled) {
    return { valido: true, motivo: 'CAPTCHA deshabilitado (modo desarrollo)' };
  }

  if (!token) {
    return { valido: false, motivo: 'Token de captcha vacio' };
  }

  if (!env.recaptcha.secret) {
    console.error('RECAPTCHA_SECRET no esta configurado en el servidor');
    return { valido: false, motivo: 'Configuracion del servidor incompleta' };
  }

  try {
    const params = new URLSearchParams({
      secret: env.recaptcha.secret,
      response: token,
    });
    if (ip) params.append('remoteip', ip);

    const respuesta = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = await respuesta.json();

    if (data.success) {
      return { valido: true };
    }
    return {
      valido: false,
      motivo: 'Captcha invalido',
      detalle: data['error-codes'],
    };
  } catch (err) {
    console.error('Error al verificar captcha:', err.message);
    return { valido: false, motivo: 'No se pudo verificar el captcha' };
  }
}