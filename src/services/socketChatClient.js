import { io } from 'socket.io-client';
import { apiConfig, shouldUseMockOnly } from '../config/apiConfig.js';

let socket;

const noopSocket = {
  connected: false,
  connect: () => noopSocket,
  disconnect: () => noopSocket,
  emit: () => noopSocket,
  on: () => noopSocket,
  off: () => noopSocket,
};

export function getChatSocket() {
  if (shouldUseMockOnly()) return noopSocket;
  if (!socket) {
    socket = io(apiConfig.socketUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectChatSocket() {
  const client = getChatSocket();
  if (!client.connected) client.connect();
  return client;
}

export function disconnectChatSocket() {
  if (socket?.connected) socket.disconnect();
}
