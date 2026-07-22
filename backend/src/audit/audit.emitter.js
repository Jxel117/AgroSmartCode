import amqp from 'amqplib';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { obtenerContexto } from './audit.context.js';

const QUEUE = 'auditoria.eventos';
let channel = null;

export async function conectarAuditoria() {
  if (!env.audit.enabled) {
    console.log('[Auditoría] Deshabilitada (AUDIT_ENABLED=false).');
    return;
  }

  try {
    const conn = await amqp.connect(env.audit.rabbitmqUrl);
    channel = await conn.createChannel();
    await channel.assertQueue(QUEUE, { 
      durable: true,
      arguments: {
        'x-message-ttl': 604800000
      }
    });

    conn.on('close', () => {
      console.warn('[Auditoría] Conexión RabbitMQ cerrada. Reintentando en 10s...');
      channel = null;
      setTimeout(conectarAuditoria, 10000);
    });

    conn.on('error', (err) => {
      console.error('[Auditoría] Error RabbitMQ:', err.message);
    });

    console.log('[Auditoría] Conectado a RabbitMQ correctamente.');
  } catch (err) {
    console.error('[Auditoría] No se pudo conectar a RabbitMQ:', err.message);
    console.warn('[Auditoría] El sistema sigue funcionando SIN auditoría.');
    setTimeout(conectarAuditoria, 30000);
  }
}

const CAMPOS_SENSIBLES = [
  'contra', 'password', 'passwordNueva', 'passwordActual',
  'token', 'captchaToken', 'refreshToken', 'contraHash',
  'secreto', 'secretoHash',
];

export function emitir({
  categoria,
  accion,
  resultado = 'EXITO',
  actor = {},
  recurso = {},
  contexto = {},
  metadatos = {},
}) {
  if (!channel) return;

  const metadatosSafe = { ...metadatos };
  for (const key of CAMPOS_SENSIBLES) {
    delete metadatosSafe[key];
  }

  // El contexto de la peticion en curso (si lo hay) rellena los huecos que el
  // llamador no haya especificado: quien, desde que IP, con que navegador y
  // sobre que ruta. Lo explicito siempre tiene prioridad.
  const peticion = obtenerContexto();
  const actorPeticion = peticion?.actor ?? {};

  const evento = {
    evento_id: randomUUID(),
    timestamp: new Date().toISOString(),
    categoria,
    accion,
    resultado,
    actor: {
      usuario_id: actor.usuario_id ?? actorPeticion.usuario_id ?? null,
      correo: actor.correo ?? actorPeticion.correo ?? null,
      rol: actor.rol ?? actorPeticion.rol ?? null,
      empresa_id: actor.empresa_id ?? actorPeticion.empresa_id ?? null,
    },
    recurso: {
      entidad_tipo: recurso.entidad_tipo ?? null,
      entidad_id: recurso.entidad_id ?? null,
      entidad_nombre: recurso.entidad_nombre ?? null,
    },
    contexto: {
      ip: contexto.ip ?? peticion?.ip ?? null,
      user_agent: contexto.user_agent ?? peticion?.user_agent ?? null,
      ruta: contexto.ruta ?? peticion?.ruta ?? null,
    },
    metadatos: metadatosSafe,
  };

  try {
    channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(evento)), {
      persistent: true,
      contentType: 'application/json',
    });
  } catch (err) {
    console.error('[Auditoría] Error al emitir evento:', err.message);
  }
}

export async function cerrarAuditoria() {
  if (channel) {
    try { await channel.close(); } catch { /* ya cerrado */ }
    channel = null;
    console.log('[Auditoría] Canal cerrado.');
  }
}
