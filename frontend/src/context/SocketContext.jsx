import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

// La URL del backend WebSocket es la misma que la API, pero sin el /api final
function obtenerUrlWS() {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
  return apiUrl.replace(/\/api\/?$/, '');
}

export function SocketProvider({ children }) {
  const { usuario } = useAuth();
  const [conectado, setConectado] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Solo conectamos si hay usuario logueado
    if (!usuario) {
      // Si habia un socket activo, lo desconectamos
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConectado(false);
      }
      return;
    }

    const token = sessionStorage.getItem('agrosmart_token');
    if (!token) return;

    // Crear la conexion al servidor Socket.IO
    const socket = io(obtenerUrlWS(), {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[WS] Conectado:', socket.id);
      setConectado(true);
    });

    socket.on('disconnect', (motivo) => {
      console.log('[WS] Desconectado:', motivo);
      setConectado(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('[WS] Error de conexion:', err.message);
      setConectado(false);
    });

    socketRef.current = socket;

    // Cleanup al desmontar o cambiar de usuario
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConectado(false);
    };
  }, [usuario]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, conectado }}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * Hook para acceder al socket en cualquier componente.
 */
export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocket debe usarse dentro de SocketProvider');
  }
  return ctx;
}

/**
 * Hook practico para suscribirse a un evento del backend.
 * Limpia el listener automaticamente al desmontar.
 *
 * Uso:
 *   useEventoSocket('lectura_nueva', (lectura) => {
 *     console.log('Nueva lectura:', lectura);
 *   });
 */
export function useEventoSocket(evento, callback) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on(evento, callback);
    return () => {
      socket.off(evento, callback);
    };
  }, [socket, evento, callback]);
}