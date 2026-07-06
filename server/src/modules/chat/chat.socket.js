import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import {
  createChatSession,
  markAsRead,
  sendAdminMessage,
  sendGuestMessage,
} from './chat.service.js';

const adminRoom = 'admin:support';
const chatRoom = (sessionCode) => `chat:${sessionCode}`;

async function verifyAdminToken(token) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive || !['ADMIN', 'STAFF'].includes(user.role)) return null;
    return {
      id: user.id,
      name: user.name,
      role: user.role,
    };
  } catch (_error) {
    return null;
  }
}

export function registerChatSocket(io) {
  io.on('connection', (socket) => {
    socket.on('guest:join', async ({ sessionCode, guest }) => {
      let code = sessionCode;
      if (!code) {
        const session = await createChatSession(guest || {});
        code = session.sessionCode;
        socket.emit('chat:session_updated', session);
        io.to(adminRoom).emit('admin:new_session', session);
      }
      socket.join(chatRoom(code));
    });

    socket.on('admin:join', async ({ token } = {}) => {
      const admin = await verifyAdminToken(token || socket.handshake.auth?.token);
      if (!admin) {
        socket.emit('chat:error', { message: 'Unauthorized admin socket' });
        return;
      }
      socket.data.admin = admin;
      socket.join(adminRoom);
      socket.emit('admin:joined', { ok: true });
    });

    socket.on('guest:message', async ({ sessionCode, message, guest }) => {
      const created = await sendGuestMessage(sessionCode, message, guest || {});
      const payload = { ...created, sessionCode };
      io.to(chatRoom(sessionCode)).emit('chat:message', payload);
      io.to(adminRoom).emit('chat:message', payload);
      io.to(adminRoom).emit('admin:unread_count');
    });

    socket.on('admin:message', async ({ sessionCode, message, adminName }) => {
      if (!socket.data.admin) {
        socket.emit('chat:error', { message: 'Unauthorized admin socket' });
        return;
      }
      const created = await sendAdminMessage(sessionCode, message, adminName || 'Lune Support');
      const payload = { ...created, sessionCode };
      io.to(chatRoom(sessionCode)).emit('chat:message', payload);
      io.to(adminRoom).emit('chat:message', payload);
    });

    socket.on('guest:typing', ({ sessionCode }) => {
      socket.to(chatRoom(sessionCode)).emit('chat:typing', { sessionCode, sender: 'guest' });
    });

    socket.on('admin:typing', ({ sessionCode }) => {
      socket.to(chatRoom(sessionCode)).emit('chat:typing', { sessionCode, sender: 'admin' });
    });

    socket.on('guest:read', async ({ sessionCode }) => {
      await markAsRead(sessionCode, 'guest');
      io.to(chatRoom(sessionCode)).emit('chat:read', { sessionCode, reader: 'guest' });
    });

    socket.on('admin:read', async ({ sessionCode }) => {
      await markAsRead(sessionCode, 'admin');
      io.to(chatRoom(sessionCode)).emit('chat:read', { sessionCode, reader: 'admin' });
    });
  });
}
