import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.email.user || !env.email.appPassword) {
    console.warn('Email SMTP no configurado (faltan EMAIL_USER o EMAIL_APP_PASSWORD)');
    return null;
  }
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.email.user,
      pass: env.email.appPassword,
    },
  });
  return transporter;
}

/**
 * Envia un email. Si EMAIL_ENABLED=false, solo lo imprime en consola
 * (util para desarrollo sin gastar emails).
 * Devuelve true si se envio correctamente.
 */
export async function enviarEmail({ destino, asunto, html, texto }) {
  if (!env.email.enabled) {
    console.log('--- EMAIL (modo deshabilitado) ---');
    console.log(`Para: ${destino}`);
    console.log(`Asunto: ${asunto}`);
    console.log(`Texto: ${texto ?? '(html only)'}`);
    console.log('-----------------------------------');
    return true;
  }

  const t = getTransporter();
  if (!t) return false;

  try {
    const info = await t.sendMail({
      from: `"${env.email.fromName}" <${env.email.user}>`,
      to: destino,
      subject: asunto,
      html,
      text: texto,
    });
    console.log(`Email enviado a ${destino}: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error('Error al enviar email:', err.message);
    return false;
  }
}

/**
 * Plantilla HTML reutilizable para los emails del sistema.
 * Diseño moderno con header de imagen agrícola y branding AgroSmart.
 */
export function plantillaEmail({ titulo, saludo, mensaje, botonTexto, botonUrl, despedida }) {
  const URL_IMAGEN_HEADER = 'https://images.unsplash.com/photo-1655929299728-93ee15ed7967?w=600&auto=format&fit=crop&q=75';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${titulo}</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f7f6f1;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1f2421;-webkit-font-smoothing:antialiased">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:40px 16px;background-color:#f7f6f1">
        <tr>
          <td align="center">

            <table width="560" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,46,26,0.08);max-width:560px;width:100%">

              <tr>
                <td background="${URL_IMAGEN_HEADER}" bgcolor="#2f5e2c" style="background-image: url('${URL_IMAGEN_HEADER}'); background-size: cover; background-position: center; padding: 0;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="height: 160px; background-color: rgba(47, 94, 44, 0.65);">
                    <tr>
                      <td align="center" valign="middle" style="padding: 30px; text-align: center;">
                        <h1 style="color:#ffffff;margin:0;font-size:30px;font-weight:700;letter-spacing:0.5px;text-shadow:0 2px 8px rgba(0,0,0,0.4);font-family:Georgia,'Times New Roman',serif">AgroSmart</h1>
                        <p style="color:#e3f2df;margin:6px 0 0;font-size:13px;font-style:italic;text-shadow:0 1px 4px rgba(0,0,0,0.3)">Riego inteligente basado en IoT</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:36px 40px 12px">
                  <h2 style="color:#2f5e2c;margin:0 0 18px;font-size:22px;font-weight:600;letter-spacing:-0.01em">${titulo}</h2>
                  <p style="font-size:16px;line-height:1.55;margin:0 0 14px;color:#1f2421">${saludo}</p>
                  <p style="font-size:15px;line-height:1.65;margin:0 0 28px;color:#41463f">${mensaje}</p>

                  ${botonUrl ? `
                    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 8px">
                      <tr>
                        <td style="background:#3d7a38;border-radius:10px;box-shadow:0 2px 8px rgba(61,122,56,0.25)">
                          <a href="${botonUrl}" target="_blank" style="display:inline-block;padding:14px 36px;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;letter-spacing:0.02em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${botonTexto}</a>
                        </td>
                      </tr>
                    </table>
                  ` : ''}
                </td>
              </tr>

              <tr>
                <td style="padding:0 40px 32px">
                  <p style="font-size:13px;color:#6f756c;margin:0;line-height:1.5;border-top:1px solid #eef0eb;padding-top:20px">${despedida ?? 'Este es un mensaje automático, por favor no respondas a este correo.'}</p>
                </td>
              </tr>

              <tr>
                <td style="background:#f7f6f1;padding:22px;text-align:center">
                  <p style="margin:0 0 4px;color:#41463f;font-size:13px;font-weight:600;letter-spacing:0.02em">AgroSmart</p>
                  <p style="margin:0;color:#999;font-size:11px">© ${new Date().getFullYear()} AgroSmart. Todos los derechos reservados.</p>
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}