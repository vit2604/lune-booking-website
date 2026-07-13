function messageKey(message) {
  return message.id || message.createdAt;
}

function dedupeMessages(messages) {
  return messages.filter((message, index, all) => (
    all.findIndex((item) => messageKey(item) === messageKey(message)) === index
  ));
}

function isAdminMessage(message) {
  return message.senderType === 'ADMIN' || message.sender === 'admin';
}

export function appendWaitingMessage(messages, waitingMessage) {
  return [...messages.filter((message) => message.senderType !== 'SYSTEM'), waitingMessage];
}

export function receiveChatMessage(messages, message) {
  const current = isAdminMessage(message)
    ? messages.filter((item) => item.senderType !== 'SYSTEM')
    : messages;
  return dedupeMessages([...current, message]);
}

export function mergeChatMessages(persistedMessages, currentMessages) {
  const pendingMessages = currentMessages.filter((message) => String(message.id || '').startsWith('pending-'));
  const waitingMessage = currentMessages.filter((message) => message.senderType === 'SYSTEM').at(-1);
  const merged = dedupeMessages([...persistedMessages, ...pendingMessages]);
  if (!waitingMessage) return merged;

  const waitingAt = new Date(waitingMessage.createdAt || 0).getTime();
  const hasNewerAdminReply = merged.some((message) => (
    isAdminMessage(message) && new Date(message.createdAt || 0).getTime() >= waitingAt
  ));
  return hasNewerAdminReply ? merged : [...merged, waitingMessage];
}
