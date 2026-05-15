import { Server } from 'socket.io';
import { env } from './env.js';
import { registerChatSocket } from '../modules/chat/chat.socket.js';

export function createSocketServer(httpServer) {
  const origins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
  const io = new Server(httpServer, {
    cors: {
      origin: origins,
      credentials: true,
    },
  });

  registerChatSocket(io);
  return io;
}
