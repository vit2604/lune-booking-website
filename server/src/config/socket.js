import { Server } from 'socket.io';
import { env } from './env.js';
import { parseOrigins } from './cors.js';
import { registerChatSocket } from '../modules/chat/chat.socket.js';

export function createSocketServer(httpServer) {
  const origins = parseOrigins(env.SOCKET_CORS_ORIGIN || env.CORS_ORIGIN);
  const io = new Server(httpServer, {
    cors: {
      origin: origins,
      credentials: true,
    },
  });

  registerChatSocket(io);
  return io;
}
