import * as nodoRepo from '../modules/nodos/nodo.repository.js';
import { verifyPassword } from '../utils/password.js';
import { AppError } from '../utils/AppError.js';
import { emitir } from '../audit/audit.emitter.js';

function auditarRechazo(identificador, motivo) {
  emitir({
    categoria: 'SISTEMA_IOT', accion: 'DISPOSITIVO_AUTENTICACION_FALLIDA', resultado: 'FALLO',
    recurso: { entidad_tipo: 'nodo', entidad_nombre: identificador ?? null },
    metadatos: { motivo },
  });
}

// El dispositivo envia:
//   x-node-id: identificador de la credencial (ej. nodo_ab12cd34)
//   x-node-secret: secreto en texto plano
export async function authenticateDevice(req, res, next) {
  try {
    const identificador = req.headers['x-node-id'];
    const secreto = req.headers['x-node-secret'];

    if (!identificador || !secreto) {
      auditarRechazo(identificador, 'Faltan credenciales del nodo');
      return next(AppError.unauthorized('Faltan credenciales del nodo'));
    }

    const registro = await nodoRepo.findByCredencialIdentificador(identificador);
    if (!registro || registro.estado_credencial !== 'ACTIVA') {
      auditarRechazo(identificador, 'Credencial inexistente o revocada');
      return next(AppError.unauthorized('Credencial de nodo invalida'));
    }

    const valido = await verifyPassword(secreto, registro.secreto_hash);
    if (!valido) {
      auditarRechazo(identificador, 'Secreto incorrecto');
      return next(AppError.unauthorized('Secreto de nodo incorrecto'));
    }

    req.nodo = { id: registro.id_nodo };
    next();
  } catch (err) {
    next(err);
  }
}
