import crypto from 'node:crypto';
import { prisma } from '../../config/prisma.js';
import { createHttpError } from '../../utils/responseUtils.js';
import { cleanText } from '../../utils/sanitizeUtils.js';

function createSessionCode() {
  return `CHAT-${Date.now().toString(36).toUpperCase()}-${crypto.randomInt(1000, 9999)}`;
}

function sessionInclude() {
  return {
    messages: { orderBy: { createdAt: 'asc' } },
  };
}

export async function createChatSession(input = {}) {
  return prisma.chatSession.create({
    data: {
      sessionCode: createSessionCode(),
      guestName: cleanText(input.guestName, 120) || null,
      guestPhone: cleanText(input.guestPhone, 60) || null,
      guestEmail: cleanText(input.guestEmail, 160) || null,
      language: cleanText(input.language, 12) || 'en',
      bookingCode: cleanText(input.bookingCode, 40) || null,
      status: 'OPEN',
      unreadByAdmin: 0,
      unreadByGuest: 0,
    },
    include: sessionInclude(),
  });
}

export async function getSessionByCode(sessionCode) {
  const session = await prisma.chatSession.findUnique({
    where: { sessionCode },
    include: sessionInclude(),
  });
  if (!session) throw createHttpError(404, 'Chat session not found');
  return session;
}

export async function listChatSessions(query = {}) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 30);
  const where = {
    status: query.status || undefined,
    unreadByAdmin: query.unread ? { gt: 0 } : undefined,
    OR: query.search
      ? [
          { sessionCode: { contains: query.search, mode: 'insensitive' } },
          { guestName: { contains: query.search, mode: 'insensitive' } },
          { guestPhone: { contains: query.search, mode: 'insensitive' } },
          { guestEmail: { contains: query.search, mode: 'insensitive' } },
          { bookingCode: { contains: query.search, mode: 'insensitive' } },
        ]
      : undefined,
  };

  const [items, total] = await Promise.all([
    prisma.chatSession.findMany({
      where,
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.chatSession.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function getMessages(sessionCode) {
  const session = await getSessionByCode(sessionCode);
  return session.messages;
}

export async function sendGuestMessage(sessionCode, message, meta = {}) {
  const session = await getSessionByCode(sessionCode);
  const [created] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        senderType: 'GUEST',
        senderName: cleanText(meta.guestName, 120) || session.guestName || 'Guest',
        message: cleanText(message, 2000),
        readByGuest: true,
        readByAdmin: false,
      },
    }),
    prisma.chatSession.update({
      where: { id: session.id },
      data: {
        status: session.status === 'CLOSED' ? 'OPEN' : 'PENDING',
        unreadByAdmin: { increment: 1 },
        updatedAt: new Date(),
        guestName: cleanText(meta.guestName, 120) || session.guestName,
      },
    }),
  ]);
  return created;
}

export async function sendAdminMessage(sessionCode, message, adminName = 'Lune Support') {
  const session = await getSessionByCode(sessionCode);
  const [created] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        senderType: 'ADMIN',
        senderName: cleanText(adminName, 120) || 'Lune Support',
        message: cleanText(message, 2000),
        readByGuest: false,
        readByAdmin: true,
      },
    }),
    prisma.chatSession.update({
      where: { id: session.id },
      data: {
        status: session.status === 'CLOSED' ? 'OPEN' : session.status,
        unreadByGuest: { increment: 1 },
        updatedAt: new Date(),
      },
    }),
  ]);
  return created;
}

export async function markAsRead(sessionCode, reader) {
  const session = await getSessionByCode(sessionCode);
  if (reader === 'admin') {
    await prisma.chatMessage.updateMany({ where: { sessionId: session.id }, data: { readByAdmin: true } });
    return prisma.chatSession.update({ where: { id: session.id }, data: { unreadByAdmin: 0 } });
  }
  await prisma.chatMessage.updateMany({ where: { sessionId: session.id }, data: { readByGuest: true } });
  return prisma.chatSession.update({ where: { id: session.id }, data: { unreadByGuest: 0 } });
}

export async function closeChatSession(sessionCode) {
  return prisma.chatSession.update({ where: { sessionCode }, data: { status: 'CLOSED' } });
}

export async function reopenChatSession(sessionCode) {
  return prisma.chatSession.update({ where: { sessionCode }, data: { status: 'OPEN' } });
}

export async function deleteChatSession(sessionCode) {
  await getSessionByCode(sessionCode);
  return prisma.chatSession.delete({ where: { sessionCode } });
}

export async function cleanupStaleChatSessions({ inactiveHours = 24, retentionDays = 30 } = {}) {
  const now = Date.now();
  const inactiveBefore = new Date(now - inactiveHours * 60 * 60 * 1000);
  const deleteBefore = new Date(now - retentionDays * 24 * 60 * 60 * 1000);
  const [closed, deleted] = await prisma.$transaction([
    prisma.chatSession.updateMany({
      where: { status: { in: ['OPEN', 'PENDING'] }, updatedAt: { lt: inactiveBefore } },
      data: { status: 'CLOSED' },
    }),
    prisma.chatSession.deleteMany({
      where: { status: 'CLOSED', updatedAt: { lt: deleteBefore } },
    }),
  ]);
  return { closed: closed.count, deleted: deleted.count };
}

export async function getUnreadCountForAdmin() {
  const result = await prisma.chatSession.aggregate({ _sum: { unreadByAdmin: true } });
  return result._sum.unreadByAdmin || 0;
}

export async function getOpenConversationCount() {
  return prisma.chatSession.count({ where: { status: { in: ['OPEN', 'PENDING'] } } });
}
