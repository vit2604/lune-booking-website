import { ImagePlus, MessageCircle, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { storageKeys } from '../../constants/storageKeys.js';
import { useTranslation } from '../../i18n/useTranslation.js';
import {
  createChatSessionWithFallback,
  getChatMessagesWithFallback,
  sendGuestImageWithFallback,
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

const imageUiText = {
  vi: {
    choose: 'Gửi hình ảnh',
    invalid: 'Chỉ hỗ trợ ảnh JPEG, PNG, WebP hoặc AVIF, dung lượng tối đa 8 MB.',
    failed: 'Chưa gửi được ảnh. Vui lòng thử lại.',
    sent: 'Hình ảnh',
  },
  en: {
    choose: 'Send an image',
    invalid: 'Please choose a JPEG, PNG, WebP or AVIF image up to 8 MB.',
    failed: 'The image could not be sent. Please try again.',
    sent: 'Image',
  },
};

const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

function readImagePreview(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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

function isMissingChatSessionError(error) {
  const message = error?.payload?.message || error?.message || '';
  return error?.status === 404 && /chat session not found/i.test(message);
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
  const [imageError, setImageError] = useState('');
  const listRef = useRef(null);
  const imageInputRef = useRef(null);
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
      if (!key || !isAdmin || message.attachmentData || currentLanguage === 'vi' || translatedMessages[key]) return;
      translateForGuest(message.message || message.text || '', currentLanguage).then((result) => {
        setTranslatedMessages((current) => ({
          ...current,
          [key]: result,
        }));
      });
    });
  }, [currentLanguage, messages, translatedMessages]);

  const ensureSession = async ({ reset = false } = {}) => {
    if (!reset && session?.sessionCode) return session;
    if (reset) localStorage.removeItem(storageKeys.chatSessionCode);
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
      let result;
      try {
        result = await sendGuestMessageWithFallback(currentSession.sessionCode, clean, {
          language: currentLanguage,
        });
      } catch (error) {
        if (!isMissingChatSessionError(error)) throw error;
        const freshSession = await ensureSession({ reset: true });
        result = await sendGuestMessageWithFallback(freshSession.sessionCode, clean, {
          language: currentLanguage,
        });
      }
      const { message } = result;
      setMessages((current) => [
        ...current.filter((item) => item.id !== optimisticMessage.id && item.id !== message.id),
        message,
      ]);
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  const sendImage = async (file) => {
    const copy = imageUiText[currentLanguage] || imageUiText.en;
    setImageError('');
    if (!file || !acceptedImageTypes.has(file.type) || file.size > 8 * 1024 * 1024) {
      setImageError(copy.invalid);
      return;
    }
    if (sending) return;
    setSending(true);
    let optimisticMessage;
    try {
      const currentSession = await ensureSession();
      optimisticMessage = {
        id: `pending-image-${Date.now()}`,
        sessionCode: currentSession.sessionCode,
        senderType: 'GUEST',
        message: '[Image]',
        attachmentData: await readImagePreview(file),
        createdAt: new Date().toISOString(),
      };
      setMessages((current) => [...current, optimisticMessage]);
      let result;
      try {
        result = await sendGuestImageWithFallback(currentSession.sessionCode, file, { language: currentLanguage });
      } catch (error) {
        if (!isMissingChatSessionError(error)) throw error;
        const freshSession = await ensureSession({ reset: true });
        result = await sendGuestImageWithFallback(freshSession.sessionCode, file, { language: currentLanguage });
      }
      setMessages((current) => [
        ...current.filter((item) => item.id !== optimisticMessage.id && item.id !== result.message.id),
        result.message,
      ]);
    } catch {
      if (optimisticMessage) setMessages((current) => current.filter((item) => item.id !== optimisticMessage.id));
      setImageError(copy.failed);
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = '';
      setSending(false);
    }
  };

  return (
    <div className={`fixed inset-x-3 z-50 sm:inset-x-auto sm:right-6 ${hasMobileBookingBar ? 'bottom-24 lg:bottom-5' : 'bottom-4 sm:bottom-5'}`}>
      {open ? (
        <section className="mb-3 flex h-[min(580px,calc(100svh-96px))] w-full flex-col overflow-hidden rounded-lg border border-stone-200 bg-white shadow-2xl sm:w-[calc(100vw-32px)] sm:max-w-sm">
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
              const hasImage = Boolean(message.attachmentData);
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
                  <div
                    className={`max-w-[82%] rounded-lg px-3 py-2 text-sm leading-6 ${
                      isGuest ? 'bg-lune-ink text-white' : 'bg-white text-stone-700'
                    }`}
                  >
                    {hasImage ? (
                      <a href={message.attachmentData} target="_blank" rel="noreferrer" aria-label={(imageUiText[currentLanguage] || imageUiText.en).sent}>
                        <img className="max-h-64 w-full rounded-md object-contain" src={message.attachmentData} alt={(imageUiText[currentLanguage] || imageUiText.en).sent} />
                      </a>
                    ) : null}
                    {displayText && (!hasImage || displayText !== '[Image]') ? <p className={hasImage ? 'mt-2' : ''}>{displayText}</p> : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-stone-200 bg-white p-3">
            {imageError ? <p className="mb-2 text-xs font-semibold text-red-700">{imageError}</p> : null}
            <div className="mb-3 grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">
              {quickQuestionKeys.map((key) => (
                <button
                  key={key}
                  className="min-h-10 max-w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-left text-xs font-semibold leading-4 text-stone-700 transition hover:border-lune-gold hover:bg-lune-cream disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  disabled={sending}
                  onClick={() => sendMessage(t(key))}
                >
                  {t(key)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                ref={imageInputRef}
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(event) => sendImage(event.target.files?.[0])}
              />
              <button
                className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-stone-200 text-lune-ink transition hover:border-lune-gold hover:bg-lune-cream disabled:opacity-50"
                type="button"
                disabled={sending}
                onClick={() => imageInputRef.current?.click()}
                aria-label={(imageUiText[currentLanguage] || imageUiText.en).choose}
                title={(imageUiText[currentLanguage] || imageUiText.en).choose}
              >
                <ImagePlus className="h-5 w-5" />
              </button>
              <input
                className="input-field min-h-11 flex-1"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') sendMessage();
                }}
                placeholder={t('chat.typeMessage')}
              />
              <button className="btn-gold min-h-11 rounded-lg px-3" type="button" disabled={sending} onClick={() => sendMessage()} aria-label={t('chat.sendMessage') || 'Send message'}>
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <button
        className="relative ml-auto grid h-14 w-14 place-items-center rounded-full bg-lune-ink text-white shadow-xl transition hover:bg-lune-charcoal"
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
