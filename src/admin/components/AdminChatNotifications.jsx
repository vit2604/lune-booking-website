import { Bell, MessageCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminListChatSessions } from '../../services/adminApiService.js';
import { getAdminToken } from '../../services/apiClient.js';
import { connectChatSocket } from '../../services/socketChatClient.js';

function getNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

function getUnreadTotal(sessions) {
  return sessions.reduce((total, session) => total + Number(session.unreadByAdmin || 0), 0);
}

export default function AdminChatNotifications() {
  const [permission, setPermission] = useState(getNotificationPermission());
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);
  const lastNotifiedRef = useRef('');
  const navigate = useNavigate();

  const openMessages = (sessionCode) => {
    navigate(sessionCode ? `/admin/messages?session=${encodeURIComponent(sessionCode)}` : '/admin/messages');
    setToast(null);
  };

  const refreshUnreadCount = async () => {
    try {
      const data = await adminListChatSessions();
      setUnreadCount(getUnreadTotal(data.items || data || []));
    } catch (_error) {
      // Keep the existing count when the network blips; socket events will retry soon.
    }
  };

  useEffect(() => {
    refreshUnreadCount();

    const handleChatUpdate = () => refreshUnreadCount();
    window.addEventListener('lune:chat-updated', handleChatUpdate);
    return () => window.removeEventListener('lune:chat-updated', handleChatUpdate);
  }, []);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) return undefined;

    const socket = connectChatSocket();
    socket.emit('admin:join', { token });

    const handleMessage = (message) => {
      const isGuest = message.senderType === 'GUEST' || message.sender === 'guest';
      if (!isGuest) return;

      const messageKey = message.id || `${message.sessionCode}:${message.createdAt}`;
      if (messageKey && lastNotifiedRef.current === messageKey) return;
      lastNotifiedRef.current = messageKey;

      const title = message.guestName || message.senderName || 'Guest message';
      const body = message.message || message.text || 'New message from website chat';
      setToast({
        sessionCode: message.sessionCode,
        title,
        body,
      });
      setUnreadCount((count) => count + 1);
      window.dispatchEvent(new Event('lune:chat-updated'));

      if (getNotificationPermission() === 'granted') {
        const notification = new Notification('New website message', {
          body: `${title}: ${body}`,
          tag: message.sessionCode || messageKey,
          icon: '/favicon.png',
        });
        notification.onclick = () => {
          window.focus();
          openMessages(message.sessionCode);
          notification.close();
        };
      }
    };

    const handleSessionUpdate = () => refreshUnreadCount();

    socket.on('chat:message', handleMessage);
    socket.on('admin:new_session', handleSessionUpdate);
    socket.on('admin:unread_count', handleSessionUpdate);
    socket.on('admin:session_deleted', handleSessionUpdate);

    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('admin:new_session', handleSessionUpdate);
      socket.off('admin:unread_count', handleSessionUpdate);
      socket.off('admin:session_deleted', handleSessionUpdate);
    };
  }, [navigate]);

  const requestPermission = async () => {
    if (getNotificationPermission() === 'unsupported') return;
    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
  };

  return (
    <div className="flex items-center gap-2">
      {permission === 'default' ? (
        <button
          className="hidden min-h-10 items-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-sm font-semibold text-lune-ink shadow-sm hover:bg-lune-cream md:flex"
          type="button"
          onClick={requestPermission}
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          Enable chat alerts
        </button>
      ) : null}

      <button
        className="relative grid min-h-10 w-10 place-items-center rounded-md border border-stone-200 bg-white text-lune-ink shadow-sm hover:bg-lune-cream"
        type="button"
        onClick={() => openMessages()}
        title="Open guest messages"
        aria-label={`Open guest messages${unreadCount ? `, ${unreadCount} unread` : ''}`}
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {toast ? (
        <div className="fixed right-4 top-24 z-[80] w-[calc(100vw-32px)] max-w-sm rounded-lg border border-stone-200 bg-white p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-lune-ink text-white">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <button className="min-w-0 flex-1 text-left" type="button" onClick={() => openMessages(toast.sessionCode)}>
              <p className="text-sm font-bold text-lune-ink">{toast.title}</p>
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-stone-600">{toast.body}</p>
            </button>
            <button className="rounded-md p-1 text-stone-500 hover:bg-stone-100" type="button" onClick={() => setToast(null)} aria-label="Dismiss notification">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
