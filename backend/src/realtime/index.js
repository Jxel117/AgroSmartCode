import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

let io = null;

/**
 * Inicializa el servidor Socket.IO sobre el servidor HTTP existente.
 * Debe llamarse despues de app.listen().
 */
export function iniciarRealtime(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: env.corsOrigin,
            credentials: true,
        },
        // Tiempo maximo sin actividad antes de desconectar
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    // Middleware de autenticacion: solo entran usuarios con JWT valido
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Token requerido'));
        }
        try {
            const payload = jwt.verify(token, env.jwt.secret);
            socket.usuario = {
                id: payload.sub,
                rol: payload.rol,
                empresa: payload.empresa,
            };
            next();
        } catch (err) {
            console.error('[WS] Error verificando JWT:', err.message);
            next(new Error('Token invalido'));
        }
    });

    io.on('connection', (socket) => {
        const { id, empresa, rol } = socket.usuario;
        console.log(`[WS] Cliente conectado: usuario=${id}, empresa=${empresa}, rol=${rol}`);

        // Cada cliente entra a la "sala" de su empresa
        // asi solo recibe eventos de su empresa (multi-tenancy)
        socket.join(`empresa:${empresa}`);

        socket.on('disconnect', (motivo) => {
            console.log(`[WS] Cliente desconectado: usuario=${id}, motivo=${motivo}`);
        });
    });

    console.log('[WS] Servidor Socket.IO iniciado');
    return io;
}

/**
 * Cierre ordenado del servidor Socket.IO.
 */
export async function cerrarRealtime() {
    if (io) {
        await new Promise((resolve) => io.close(resolve));
        io = null;
        console.log('[WS] Servidor Socket.IO cerrado');
    }
}

// ===== Emisores de eventos =====
// Estas funciones las llama el resto del backend para emitir eventos a los clientes

/**
 * Emite una lectura nueva a todos los clientes de una empresa.
 */
export function emitirLecturaNueva(empresa, lectura) {
    if (!io) return;
    io.to(`empresa:${empresa}`).emit('lectura_nueva', lectura);
}

/**
 * Emite una alerta nueva a todos los clientes de una empresa.
 */
export function emitirAlertaNueva(empresa, alerta) {
    if (!io) return;
    io.to(`empresa:${empresa}`).emit('alerta_nueva', alerta);
}

/**
 * Emite una transicion de estado del AFD a todos los clientes de una empresa.
 */
export function emitirTransicionAfd(empresa, transicion) {
    if (!io) return;
    io.to(`empresa:${empresa}`).emit('transicion_afd', transicion);
}