import { Archive, MessageCircle, RotateCcw, Send, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { readJsonStorage, storageKeys } from '../../constants/storageKeys.js';
import { canUseMockFallback } from '../../config/apiConfig.js';
import { getAdminToken } from '../../services/apiClient.js';
import {
  adminCloseChatSession,
  adminDeleteChatSession,
  adminGetChatSession,
  adminListChatSessions,
  adminMarkChatRead,
  adminReopenChatSession,
  adminSendChatMessage,
} from '../../services/adminApiService.js';
import { translateForAdmin } from '../../services/aiTranslationService.js';
import { connectChatSocket } from '../../services/socketChatClient.js';
import ConfirmModal from '../components/ConfirmModal.jsx';

function getLocalSessions() {
  return readJsonStorage(storageKeys.chatSessions, []);
}

function getLocalMessages(sessionCode) {
  return readJsonStorage(storageKeys.chatMessages, []).filter((message) => message.sessionCode === sessionCode);
}

function appendUniqueMessage(current, message) {
  const key = message.id || message.createdAt;
  if (key && current.some((item) => (item.id || item.createdAt) === key)) return current;
  return [...current, message];
}

export default function AdminMessages() {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [filter, setFilter] = useState('all');
  const [translatedMessages, setTranslatedMessages] = useState({});
  const [translationNotice, setTranslationNotice] = useState('');
  const [sendError, setSendError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const refresh = async () => {
    try {
      const data = await adminListChatSessions(filter === 'all' ? {} : { status: filter.toUpperCase() });
      setSendError('');
      setSessions(data.items || data);
    } catch (error) {
      if (canUseMockFallback()) {
        setSessions(getLocalSessions());
        return;
      }
      setSendError(error.message || 'Could not load live conversations. Please log in again.');
    }
  };

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener('lune:chat-updated', onUpdate);
    return () => window.removeEventListener('lune:chat-updated', onUpdate);
  }, [filter]);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) return undefined;

    const socket = connectChatSocket();
    socket.emit('admin:join', { token });

    const handleSessionUpdate = () => refresh();
    const handleMessage = (message) => {
      if (message.sessionCode !== selected?.sessionCode) {
        refresh();
        return;
      }
      setMessages((current) => appendUniqueMessage(current, message));
      setSessions((current) => current.map((session) => (
        session.sessionCode === message.sessionCode ? { ...session, unreadByAdmin: 0 } : session
      )));
      adminMarkChatRead(message.sessionCode).then(() => refresh()).catch(() => refresh());
    };

    socket.on('admin:new_session', handleSessionUpdate);
    socket.on('admin:unread_count', handleSessionUpdate);
    socket.on('chat:message', handleMessage);
    socket.on('admin:session_deleted', handleSessionUpdate);

    return () => {
      socket.off('admin:new_session', handleSessionUpdate);
      socket.off('admin:unread_count', handleSessionUpdate);
      socket.off('chat:message', handleMessage);
      socket.off('admin:session_deleted', handleSessionUpdate);
    };
  }, [filter, selected?.sessionCode]);

  useEffect(() => {
    if (!selected?.sessionCode) return;
    const sessionCode = selected.sessionCode;
    setSessions((current) => current.map((session) => (
      session.sessionCode === sessionCode ? { ...session, unreadByAdmin: 0 } : session
    )));
    setSelected((current) => current?.sessionCode === sessionCode ? { ...current, unreadByAdmin: 0 } : current);
    setMessages(getLocalMessages(sessionCode));
    Promise.all([adminGetChatSession(sessionCode), adminMarkChatRead(sessionCode)])
      .then(([session]) => setMessages(session.messages || []))
      .catch((error) => setSendError(error.message || 'Could not mark this conversation as read.'));
  }, [selected?.sessionCode]);

  useEffect(() => {
    messages.forEach((message) => {
      const key = message.id || message.createdAt;
      const isGuest = message.senderType === 'GUEST' || message.sender === 'guest';
      if (!key || !isGuest || translatedMessages[key]) return;
      translateForAdmin(message.message || message.text || '', selected?.language || 'auto').then((result) => {
        setTranslatedMessages((current) => ({ ...current, [key]: result }));
      });
    });
  }, [messages, selected?.language, translatedMessages]);

  const visibleSessions = useMemo(() => sessions, [sessions]);

  const sendReply = async () => {
    const clean = reply.trim();
    if (!clean || !selected) return;

    setTranslationNotice('');
    setSendError('');

    try {
      const created = await adminSendChatMessage(selected.sessionCode, clean);
      setMessages((current) => appendUniqueMessage(current, created));
    } catch (error) {
      if (!canUseMockFallback()) {
        setSendError(error.message || 'Could not send this reply. Please log in again and try once more.');
        return;
      }
      const localMessages = readJsonStorage(storageKeys.chatMessages, []);
      const created = {
        id: crypto.randomUUID(),
        sessionCode: selected.sessionCode,
        senderType: 'ADMIN',
        message: clean,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKeys.chatMessages, JSON.stringify([...localMessages, created]));
      setMessages((current) => appendUniqueMessage(current, created));
      window.dispatchEvent(new Event('lune:chat-updated'));
    }

    if ((selected.language || 'vi') !== 'vi') {
      setTranslationNotice(`Reply saved in Vietnamese. The guest chat translates it to ${(selected.language || 'en').toUpperCase()}.`);
    }
    setReply('');
  };

  const updateSessionStatus = async (status) => {
    if (!selected) return;
    setSendError('');
    try {
      const updated = status === 'CLOSED'
        ? await adminCloseChatSession(selected.sessionCode)
        : await adminReopenChatSession(selected.sessionCode);
      setSelected(updated);
      await refresh();
    } catch (error) {
      setSendError(error.message || 'Could not update this conversation.');
    }
  };

  const deleteSession = async () => {
    if (!deleteTarget) return;
    setSendError('');
    try {
      await adminDeleteChatSession(deleteTarget.sessionCode);
      if (selected?.sessionCode === deleteTarget.sessionCode) {
        setSelected(null);
        setMessages([]);
      }
      setDeleteTarget(null);
      await refresh();
    } catch (error) {
      setSendError(error.message || 'Could not delete this conversation.');
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Guest support</p>
        <h2 className="mt-2 font-display text-4xl font-bold text-lune-ink">Messages</h2>
        <p className="mt-2 text-sm text-stone-600">
          Guest messages are translated to Vietnamese for staff. Vietnamese staff replies are translated back to the guest language.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', 'open', 'pending', 'closed'].map((item) => (
          <button
            key={item}
            className={`min-h-10 rounded-md px-4 text-sm font-semibold ${filter === item ? 'bg-lune-ink text-white' : 'bg-white text-stone-700'}`}
            type="button"
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid min-h-[600px] overflow-hidden rounded-lg border border-stone-200 bg-white shadow-soft lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-stone-200 lg:border-b-0 lg:border-r">
          {visibleSessions.length ? (
            visibleSessions.map((session) => (
              <button
                key={session.sessionCode}
                className={`block w-full border-b border-stone-100 p-4 text-left hover:bg-lune-cream ${
                  selected?.sessionCode === session.sessionCode ? 'bg-lune-cream' : ''
                }`}
                type="button"
                onClick={() => {
                  setSelected(session);
                  setTranslationNotice('');
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-lune-ink">{session.guestName || 'Guest'}</p>
                  {session.unreadByAdmin ? (
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{session.unreadByAdmin}</span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-stone-500">{session.sessionCode}</p>
                <p className="mt-1 text-xs uppercase text-stone-500">
                  {session.status || 'OPEN'} · {session.language || 'en'}
                </p>
              </button>
            ))
          ) : (
            <div className="p-6 text-sm text-stone-500">No conversations yet.</div>
          )}
        </aside>

        <section className="flex min-h-[520px] flex-col">
          {selected ? (
            <>
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 p-4">
                <div>
                  <p className="font-semibold text-lune-ink">{selected.guestName || 'Guest'}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {selected.guestPhone || 'No phone'} · {selected.guestEmail || 'No email'} · Guest language: {selected.language || 'en'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(selected.status || '').toUpperCase() === 'CLOSED' ? (
                    <button className="btn-secondary" type="button" onClick={() => updateSessionStatus('OPEN')}>
                      <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reopen
                    </button>
                  ) : (
                    <button className="btn-secondary" type="button" onClick={() => updateSessionStatus('CLOSED')}>
                      <Archive className="h-4 w-4" aria-hidden="true" /> Close
                    </button>
                  )}
                  <button className="btn-secondary min-h-10 px-3 text-red-700" type="button" title="Delete conversation" aria-label="Delete conversation" onClick={() => setDeleteTarget(selected)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto bg-lune-cream p-4">
                {messages.map((message) => {
                  const isAdmin = message.senderType === 'ADMIN';
                  const translation = translatedMessages[message.id || message.createdAt];
                  const originalText = message.message || message.text;
                  const primaryText = !isAdmin && translation?.translated ? translation.translatedText : originalText;
                  return (
                    <div key={message.id || message.createdAt} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[78%] rounded-lg px-3 py-2 text-sm leading-6 ${isAdmin ? 'bg-lune-ink text-white' : 'bg-white text-stone-700'}`}>
                        <p>{primaryText}</p>
                        {!isAdmin && translation?.translated ? (
                          <p className="mt-2 rounded-md bg-lune-cream px-2 py-1 text-xs font-medium text-lune-ink">
                            Original: {originalText}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              <footer className="flex gap-2 border-t border-stone-200 p-4">
                <div className="flex-1">
                  {sendError ? <p className="mb-2 text-xs font-semibold text-red-700">{sendError}</p> : null}
                  {translationNotice ? <p className="mb-2 text-xs font-medium text-green-700">{translationNotice}</p> : null}
                  <input
                    className="input-field"
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    placeholder="Type a reply in Vietnamese. AI will translate it to the guest language."
                  />
                </div>
                <button className="btn-gold self-end" type="button" onClick={sendReply}>
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </footer>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-8 text-center text-stone-500">
              <div>
                <MessageCircle className="mx-auto h-10 w-10 text-lune-goldDark" />
                <p className="mt-3 font-semibold text-lune-ink">Select a conversation</p>
              </div>
            </div>
          )}
        </section>
      </div>
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete conversation"
        message="Delete this conversation and all of its messages permanently? This cannot be undone."
        confirmText="Delete"
        onConfirm={deleteSession}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
