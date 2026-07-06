import { sendSuccess } from '../../utils/responseUtils.js';
import {
  closeChatSession,
  createChatSession,
  getMessages,
  getOpenConversationCount,
  getSessionByCode,
  getUnreadCountForAdmin,
  listChatSessions,
  markAsRead,
  reopenChatSession,
  sendAdminMessage,
  sendGuestMessage,
} from './chat.service.js';

const adminRoom = 'admin:support';
const chatRoom = (sessionCode) => `chat:${sessionCode}`;

function emitChatMessage(req, sessionCode, message) {
  const io = req.app.get('io');
  if (!io) return;
  const payload = { ...message, sessionCode };
  io.to(chatRoom(sessionCode)).emit('chat:message', payload);
  io.to(adminRoom).emit('chat:message', payload);
}

function emitSessionUpdate(req, eventName, payload) {
  const io = req.app.get('io');
  if (!io) return;
  io.to(adminRoom).emit(eventName, payload);
}

export async function createSession(req, res) {
  const session = await createChatSession(req.body);
  emitSessionUpdate(req, 'admin:new_session', session);
  sendSuccess(res, session, 'Chat session created', 201);
}

export async function publicMessages(req, res) {
  sendSuccess(res, await getMessages(req.params.sessionCode));
}

export async function publicSendMessage(req, res) {
  const message = await sendGuestMessage(req.params.sessionCode, req.body.message, req.body);
  emitChatMessage(req, req.params.sessionCode, message);
  emitSessionUpdate(req, 'admin:unread_count', { sessionCode: req.params.sessionCode });
  sendSuccess(res, message, 'Message sent', 201);
}

export async function publicRead(req, res) {
  sendSuccess(res, await markAsRead(req.params.sessionCode, 'guest'));
}

export async function adminSessions(req, res) {
  sendSuccess(res, await listChatSessions(req.query));
}

export async function adminSession(req, res) {
  sendSuccess(res, await getSessionByCode(req.params.sessionCode));
}

export async function adminSendMessage(req, res) {
  const message = await sendAdminMessage(req.params.sessionCode, req.body.message, req.user?.name || 'Lune Support');
  emitChatMessage(req, req.params.sessionCode, message);
  sendSuccess(res, message, 'Message sent', 201);
}

export async function adminRead(req, res) {
  sendSuccess(res, await markAsRead(req.params.sessionCode, 'admin'));
}

export async function adminClose(req, res) {
  sendSuccess(res, await closeChatSession(req.params.sessionCode));
}

export async function adminReopen(req, res) {
  sendSuccess(res, await reopenChatSession(req.params.sessionCode));
}

export async function adminChatStats(_req, res) {
  sendSuccess(res, {
    unreadMessages: await getUnreadCountForAdmin(),
    openConversations: await getOpenConversationCount(),
  });
}
