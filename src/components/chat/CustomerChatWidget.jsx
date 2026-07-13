import { MessageCircle, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { storageKeys } from '../../constants/storageKeys.js';
import { useTranslation } from '../../i18n/useTranslation.js';
import {
  createChatSessionWithFallback,
  getChatMessagesWithFallback,
  sendGuestMessageWithFallback,
} from '../../services/chatApiService.js';
import { translateForGuest } from '../../services/aiTranslationService.js';
import { connectChatSocket } from '../../services/socketChatClient.js';
import { mergeChatMessages, receiveChatMessage } from '../../utils/chatMessageUtils.js';

const quickQuestionKeys = [
  'chat.quickBookRoom',
  'chat.quickAvailability',
  'chat.quickEarlyCheckIn',
  'chat.quickPayment',
  'chat.quickBookingHelp',
];

const translationPendingText = {
  en: 'Translating staff reply...',
  vi: 'Đang dịch phản hồi...',
  ko: '직원 답변을 번역하는 중입니다...',
  zh: '正在翻译工作人员回复...',
  'zh-TW': '正在翻譯工作人員回覆...',
  ja: 'スタッフの返信を翻訳しています...',
  th: 'กำลังแปลคำตอบจากพนักงาน...',
  ru: 'Переводим ответ сотрудника...',
  fr: 'Traduction de la réponse...',
  de: 'Antwort wird ubersetzt...',
  es: 'Traduciendo la respuesta...',
};

const translationUnavailableText = {
  en: 'Staff sent a reply. Translation is temporarily unavailable.',
  vi: 'Nhân viên đã gửi phản hồi. Hiện chưa dịch được nội dung này.',
  ko: '직원이 답변을 보냈습니다. 현재 번역을 사용할 수 없습니다.',
  zh: '工作人员已回复。当前暂时无法翻译。',
  'zh-TW': '工作人員已回覆。目前暫時無法翻譯。',
  ja: 'スタッフが返信しました。現在翻訳を利用できません。',
  th: 'พนักงานตอบกลับแล้ว ขณะนี้ยังไม่สามารถแปลได้',
  ru: 'Сотрудник ответил. Перевод временно недоступен.',
  fr: 'Le personnel a repondu. La traduction est temporairement indisponible.',
  de: 'Das Team hat geantwortet. Die Ubersetzung ist vorubergehend nicht verfugbar.',
  es: 'El equipo respondio. La traduccion no esta disponible temporalmente.',
};

function getTranslationStatusText(map, language) {
  return map[language] || map.en;
}

export default function CustomerChatWidget() {
  const { t, currentLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [translatedMessages, setTranslatedMessages] = useState({});
  const listRef = useRef(null);
  const location = useLocation();
  const hasMobileBookingBar = location.pathname.startsWith('/rooms/');

  useEffect(() => {
    const sessionCode = localStorage.getItem(storageKeys.chatSessionCode);
    if (!sessionCode) return;
    setSession({ sessionCode });
  }, []);

  useEffect(() => {
    if (!session?.sessionCode) return undefined;
    const socket = connectChatSocket();
    socket.emit('guest:join', { sessionCode: session.sessionCode, guest: { language: currentLanguage } });
    const handleMessage = (message) => {
      setMessages((current) => receiveChatMessage(current, message));
      if (!open && message.senderType === 'ADMIN') setUnread((count) => count + 1);
    };
    socket.on('chat:message', handleMessage);
    return () => {
      socket.off('chat:message', handleMessage);
    };
  }, [currentLanguage, open, session?.sessionCode]);

  useEffect(() => {
    if (!session?.sessionCode || !open) return undefined;
    const refreshMessages = () => {
      getChatMessagesWithFallback(session.sessionCode)
        .then(({ messages: nextMessages }) => {
          setMessages((current) => mergeChatMessages(nextMessages, current));
        })
        .catch(() => {});
    };
    refreshMessages();
    const interval = window.setInterval(refreshMessages, 15000);
    return () => window.clearInterval(interval);
  }, [open, session?.sessionCode]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    if (open) setUnread(0);
  }, [messages, open]);

  useEffect(() => {
    messages.forEach((message) => {
      const key = message.id || message.createdAt;
      const isAdmin = message.senderType === 'ADMIN' || message.sender === 'admin';
      if (!key || !isAdmin || currentLanguage === 'vi' || translatedMessages[key]) return;
      translateForGuest(message.message || message.text || '', currentLanguage).then((result) => {
        setTranslatedMessages((current) => ({
          ...current,
          [key]: result,
        }));
      });
    });
  }, [currentLanguage, messages, translatedMessages]);

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
    try {
      const currentSession = await ensureSession();
      const now = Date.now();
      const optimisticMessage = {
        id: `pending-${now}`,
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
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`fixed right-4 z-50 sm:right-6 ${hasMobileBookingBar ? 'bottom-24 lg:bottom-5' : 'bottom-5'}`}>
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
            {messages.filter((message) => message.senderType !== 'SYSTEM').map((message) => {
              const isGuest = message.senderType === 'GUEST' || message.sender === 'guest';
              const isAdmin = message.senderType === 'ADMIN' || message.sender === 'admin';
              const translation = translatedMessages[message.id || message.createdAt];
              const needsTranslation = isAdmin && currentLanguage !== 'vi';
              const originalText = message.message || message.text;
              const displayText = needsTranslation
                ? translation?.translated
                  ? translation.translatedText
                  : translation
                    ? getTranslationStatusText(translationUnavailableText, currentLanguage)
                    : getTranslationStatusText(translationPendingText, currentLanguage)
                : originalText;
              return (
                <div
                  key={message.id || message.createdAt}
                  className={`flex ${isGuest ? 'justify-end' : 'justify-start'}`}
                >
                  <p
                    className={`max-w-[82%] rounded-lg px-3 py-2 text-sm leading-6 ${
                      isGuest ? 'bg-lune-ink text-white' : 'bg-white text-stone-700'
                    }`}
                  >
                    {displayText}
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
