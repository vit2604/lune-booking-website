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

export function receiveChatMessage(messages, message) {
  if (message.senderType === 'SYSTEM') return messages;
  const current = isAdminMessage(message)
    ? messages.filter((item) => item.senderType !== 'SYSTEM')
    : messages;
  return dedupeMessages([...current, message]);
}

export function mergeChatMessages(persistedMessages, currentMessages) {
  const pendingMessages = currentMessages.filter((message) => String(message.id || '').startsWith('pending-'));
  return dedupeMessages([...persistedMessages, ...pendingMessages]).filter(
    (message) => message.senderType !== 'SYSTEM',
  );
}
