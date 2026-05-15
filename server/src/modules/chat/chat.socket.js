import {
  createChatSession,
  markAsRead,
  sendAdminMessage,
  sendGuestMessage,
} from './chat.service.js';

const adminRoom = 'admin:support';
const chatRoom = (sessionCode) => `chat:${sessionCode}`;

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

    socket.on('admin:join', () => {
      socket.join(adminRoom);
    });

    socket.on('guest:message', async ({ sessionCode, message, guest }) => {
      const created = await sendGuestMessage(sessionCode, message, guest || {});
      io.to(chatRoom(sessionCode)).emit('chat:message', created);
      io.to(adminRoom).emit('chat:message', created);
      io.to(adminRoom).emit('admin:unread_count');
    });

    socket.on('admin:message', async ({ sessionCode, message, adminName }) => {
      const created = await sendAdminMessage(sessionCode, message, adminName || 'Lune Support');
      io.to(chatRoom(sessionCode)).emit('chat:message', created);
      io.to(adminRoom).emit('chat:message', created);
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
