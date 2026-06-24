import * as nodoRepo from '../modules/nodos/nodo.repository.js';
import { verifyPassword } from '../utils/password.js';
import { AppError } from '../utils/AppError.js';

export async function authenticateDevice(req, res, next) {
  try {
    const identificador = req.headers['x-node-id'];
    const secreto = req.headers['x-node-secret'];

    // 1. Validación básica de presencia
    if (!identificador || !secreto) {
      console.warn(`[AUTH FAIL] Faltan cabeceras: ID=${identificador}, Secret=${!!secreto}`);
      return next(AppError.unauthorized('Faltan credenciales del nodo'));
    }

    // 2. Búsqueda en repositorio
    
    const registro = await nodoRepo.findByCredencialIdentificador(identificador);

    // 3. Validación de existencia y estado
    if (!registro) {
      console.warn(`[AUTH FAIL] Nodo no encontrado: ${identificador}`);
      return next(AppError.unauthorized('Credencial de nodo invalida'));
    }

    if (registro.estado_credencial !== 'ACTIVA') {
      console.warn(`[AUTH FAIL] Nodo inactivo: ${identificador}`);
      return next(AppError.unauthorized('Credencial de nodo invalida'));
    }

    // 4. Verificación de hash (El punto crítico)
    const valido = await verifyPassword(secreto, registro.secreto_hash);
    
    if (!valido) {
      // Si llega aquí, el ID existe, pero el secreto es incorrecto
      console.warn(`[AUTH FAIL] Secreto incorrecto para el nodo: ${identificador}`);
      return next(AppError.unauthorized('Secreto de nodo incorrecto'));
    }

    // Si todo es correcto
    req.nodo = { id: registro.id_nodo };
    next();
  } catch (err) {
    console.error('[AUTH ERROR] Error en middleware:', err);
    next(err);
  }
}