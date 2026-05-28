import * as nodoRepo from '../modules/nodos/nodo.repository.js';
import { verifyPassword } from '../utils/password.js';
import { AppError } from '../utils/AppError.js';

// El dispositivo envia:
//   x-node-id: identificador de la credencial (ej. nodo_ab12cd34)
//   x-node-secret: secreto en texto plano
export async function authenticateDevice(req, res, next) {
  try {
    const identificador = req.headers['x-node-id'];
    const secreto = req.headers['x-node-secret'];

    if (!identificador || !secreto) {
      return next(AppError.unauthorized('Faltan credenciales del nodo'));
    }

    const registro = await nodoRepo.findByCredencialIdentificador(identificador);
    if (!registro || registro.estado_credencial !== 'ACTIVA') {
      return next(AppError.unauthorized('Credencial de nodo invalida'));
    }

    const valido = await verifyPassword(secreto, registro.secreto_hash);
    if (!valido) {
      return next(AppError.unauthorized('Secreto de nodo incorrecto'));
    }

    req.nodo = { id: registro.id_nodo };
    next();
  } catch (err) {
    next(err);
  }
}