import { MessageCircle, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { storageKeys } from '../../constants/storageKeys.js';
import { useTranslation } from '../../i18n/useTranslation.js';
import {
  createChatSessionWithFallback,
  getChatMessagesWithFallback,
  sendGuestMessageWithFallback,
} from '../../services/chatApiService.js';
import { connectChatSocket } from '../../services/socketChatClient.js';

const quickQuestionKeys = [
  'chat.quickBookRoom',
  'chat.quickAvailability',
  'chat.quickEarlyCheckIn',
  'chat.quickPayment',
  'chat.quickBookingHelp',
];

export default function CustomerChatWidget() {
  const { t, currentLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    const sessionCode = localStorage.getItem(storageKeys.chatSessionCode);
    if (!sessionCode) return;
    setSession({ sessionCode });
    getChatMessagesWithFallback(sessionCode).then(({ messages: nextMessages }) => setMessages(nextMessages));
  }, []);

  useEffect(() => {
    if (!session?.sessionCode) return undefined;
    const socket = connectChatSocket();
    socket.emit('guest:join', { sessionCode: session.sessionCode, guest: { language: currentLanguage } });
    const handleMessage = (message) => {
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
      if (!open && message.senderType === 'ADMIN') setUnread((count) => count + 1);
    };
    socket.on('chat:message', handleMessage);
    return () => {
      socket.off('chat:message', handleMessage);
    };
  }, [currentLanguage, open, session?.sessionCode]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    if (open) setUnread(0);
  }, [messages, open]);

  const ensureSession = async () => {
    if (session?.sessionCode) return session;
    const { session: created } = await createChatSessionWithFallback({ language: currentLanguage });
    localStorage.setItem(storageKeys.chatSessionCode, created.sessionCode);
    setSession(created);
    return created;
  };

  const sendMessage = async (text = draft) => {
    const clean = text.trim();
    if (!clean || sending) return;
    setSending(true);
    const currentSession = await ensureSession();
    const optimisticMessage = {
      id: `pending-${Date.now()}`,
      sessionCode: currentSession.sessionCode,
      senderType: 'GUEST',
      message: clean,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimisticMessage]);
    const { message } = await sendGuestMessageWithFallback(currentSession.sessionCode, clean, {
      language: currentLanguage,
    });
    setMessages((current) => current.map((item) => (item.id === optimisticMessage.id ? message : item)));
    setDraft('');
    setSending(false);
  };

  return (
    <div className="fixed bottom-5 right-4 z-50 sm:right-6">
      {open ? (
        <section className="mb-3 flex h-[min(620px,calc(100vh-120px))] w-[calc(100vw-32px)] max-w-sm flex-col overflow-hidden rounded-lg border border-stone-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between bg-lune-ink px-4 py-3 text-white">
            <div>
              <p className="font-semibold">{t('chat.luneSupport')}</p>
              <p className="text-xs text-white/70">{t('chat.usuallyReplies')}</p>
            </div>
            <button className="rounded-md p-2 hover:bg-white/10" type="button" onClick={() => setOpen(false)} aria-label="Close chat">
              <X className="h-4 w-4" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-lune-cream p-4">
            {!messages.length ? (
              <div className="rounded-lg bg-white p-4 text-sm leading-6 text-stone-600">
                {t('chat.startConversation')}
              </div>
            ) : null}
            {messages.map((message) => {
              const isGuest = message.senderType === 'GUEST' || message.sender === 'guest';
              return (
                <div key={message.id || message.createdAt} className={`flex ${isGuest ? 'justify-end' : 'justify-start'}`}>
                  <p
                    className={`max-w-[82%] rounded-lg px-3 py-2 text-sm leading-6 ${
                      isGuest ? 'bg-lune-ink text-white' : 'bg-white text-stone-700'
                    }`}
                  >
                    {message.message || message.text}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="border-t border-stone-200 bg-white p-3">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {quickQuestionKeys.map((key) => (
                <button
                  key={key}
                  className="shrink-0 rounded-full border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700"
                  type="button"
                  onClick={() => sendMessage(t(key))}
                >
                  {t(key)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input-field min-h-11 flex-1"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') sendMessage();
                }}
                placeholder={t('chat.typeMessage')}
              />
              <button className="btn-gold min-h-11 px-3" type="button" disabled={sending} onClick={() => sendMessage()}>
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <button
        className="relative grid h-14 w-14 place-items-center rounded-full bg-lune-ink text-white shadow-xl transition hover:bg-lune-charcoal"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t('chat.chatWithUs')}
      >
        <MessageCircle className="h-6 w-6" />
        {unread ? (
          <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
            {unread}
          </span>
        ) : null}
      </button>
    </div>
  );
}
