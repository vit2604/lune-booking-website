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

export async function createSession(req, res) {
  sendSuccess(res, await createChatSession(req.body), 'Chat session created', 201);
}

export async function publicMessages(req, res) {
  sendSuccess(res, await getMessages(req.params.sessionCode));
}

export async function publicSendMessage(req, res) {
  sendSuccess(res, await sendGuestMessage(req.params.sessionCode, req.body.message, req.body), 'Message sent', 201);
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
  sendSuccess(
    res,
    await sendAdminMessage(req.params.sessionCode, req.body.message, req.user?.name || 'Lune Support'),
    'Message sent',
    201,
  );
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
