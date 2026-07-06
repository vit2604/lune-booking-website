import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  clearAuth,
  getChatSession,
  listChatSessions,
  login,
  markAdminRead,
  sendAdminMessage,
  translateText,
  connectAdminSocket,
} from './src/api';
import { defaultApiBaseUrl, defaultSocketUrl, quickReplies, storageKeys } from './src/config';
import { getLanguageLabel, isStaffLanguage, normalizeLanguage } from './src/language';

const colors = {
  ink: '#171412',
  muted: '#6f665f',
  line: '#e7dfd4',
  cream: '#f7f1e8',
  panel: '#fffaf2',
  gold: '#b98e4b',
  goldDark: '#7b562c',
  danger: '#b42318',
  success: '#16784c',
  white: '#ffffff',
};

function formatTime(value) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch (_error) {
    return String(value);
  }
}

function getMessageText(message) {
  return message?.message || message?.text || '';
}

function uniqueMessages(messages = []) {
  const seen = new Set();
  return messages.filter((message) => {
    const key = message.id || message.createdAt || `${message.senderType}-${message.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function LoginScreen({ onLogin, onSettings }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!username.trim() || !password.trim()) {
      setError('Nhập tài khoản và mật khẩu admin.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await login(username.trim(), password);
      onLogin(data);
    } catch (loginError) {
      setError(loginError.message || 'Không đăng nhập được. Kiểm tra API hoặc tài khoản.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.loginHero}>
        <Text style={styles.logoMark}>LUNE</Text>
        <Text style={styles.loginTitle}>Support App</Text>
        <Text style={styles.loginSubtitle}>
          Trả lời tin nhắn khách từ website Lune, kèm dịch tự động realtime.
        </Text>
      </View>
      <View style={styles.loginCard}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          autoCapitalize="none"
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="admin"
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Nhập mật khẩu admin"
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Pressable style={[styles.primaryButton, loading && styles.disabledButton]} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryButtonText}>Login</Text>}
        </Pressable>
        <Pressable style={styles.ghostButton} onPress={onSettings}>
          <Text style={styles.ghostButtonText}>API settings</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function SettingsScreen({ onBack }) {
  const [apiUrl, setApiUrl] = useState(defaultApiBaseUrl);
  const [socketUrl, setSocketUrl] = useState(defaultSocketUrl);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([storageKeys.apiBaseUrl, storageKeys.socketUrl]).then((pairs) => {
      const values = Object.fromEntries(pairs);
      setApiUrl(values[storageKeys.apiBaseUrl] || defaultApiBaseUrl);
      setSocketUrl(values[storageKeys.socketUrl] || defaultSocketUrl);
    });
  }, []);

  async function save() {
    await AsyncStorage.multiSet([
      [storageKeys.apiBaseUrl, apiUrl.trim() || defaultApiBaseUrl],
      [storageKeys.socketUrl, socketUrl.trim() || defaultSocketUrl],
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  return (
    <SafeAreaView style={styles.safeLight}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.topBarTitle}>API Settings</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>Backend API URL</Text>
        <TextInput autoCapitalize="none" style={styles.input} value={apiUrl} onChangeText={setApiUrl} />
        <Text style={styles.label}>Socket URL</Text>
        <TextInput autoCapitalize="none" style={styles.input} value={socketUrl} onChangeText={setSocketUrl} />
        <Text style={styles.helperText}>
          Production mặc định dùng Render backend của Lune. Không nhập secret/API key trong app.
        </Text>
        {saved ? <Text style={styles.successText}>Đã lưu cấu hình.</Text> : null}
        <Pressable style={styles.primaryButton} onPress={save}>
          <Text style={styles.primaryButtonText}>Save settings</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function SessionCard({ item, selected, onPress }) {
  const latest = item.messages?.[0];
  const unread = Number(item.unreadByAdmin || 0);
  return (
    <Pressable style={[styles.sessionCard, selected && styles.sessionCardSelected]} onPress={onPress}>
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionName}>{item.guestName || 'Guest'}</Text>
        {unread > 0 ? <Text style={styles.badge}>{unread}</Text> : null}
      </View>
      <Text style={styles.sessionMeta}>
        {item.bookingCode || item.sessionCode} · {getLanguageLabel(item.language)}
      </Text>
      <Text numberOfLines={2} style={styles.sessionPreview}>
        {getMessageText(latest) || 'Chưa có tin nhắn'}
      </Text>
      <Text style={styles.sessionTime}>{formatTime(item.updatedAt || latest?.createdAt)}</Text>
    </Pressable>
  );
}

function SessionList({ sessions, selectedCode, refreshing, onRefresh, onSelect, onLogout, onSettings }) {
  return (
    <View style={styles.listPane}>
      <View style={styles.appHeader}>
        <View>
          <Text style={styles.appTitle}>Lune Messages</Text>
          <Text style={styles.appSubtitle}>Tin khách từ website</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconButton} onPress={onSettings}>
            <Text style={styles.iconButtonText}>⚙</Text>
          </Pressable>
          <Pressable style={styles.iconButton} onPress={onLogout}>
            <Text style={styles.iconButtonText}>↪</Text>
          </Pressable>
        </View>
      </View>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.sessionCode}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Chưa có tin nhắn</Text>
            <Text style={styles.emptyBody}>Khi khách nhắn từ web Lune, cuộc trò chuyện sẽ xuất hiện tại đây.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <SessionCard item={item} selected={selectedCode === item.sessionCode} onPress={() => onSelect(item)} />
        )}
      />
    </View>
  );
}

function MessageBubble({ message, translation }) {
  const isGuest = message.senderType === 'GUEST' || message.sender === 'guest';
  const isSystem = message.senderType === 'SYSTEM' || message.sender === 'system';
  const text = getMessageText(message);
  return (
    <View style={[styles.messageRow, isGuest ? styles.messageRowLeft : styles.messageRowRight]}>
      <View style={[styles.messageBubble, isGuest ? styles.guestBubble : styles.adminBubble, isSystem && styles.systemBubble]}>
        <Text style={[styles.messageText, !isGuest && styles.adminMessageText]}>{text}</Text>
        {isGuest && translation?.translated && translation.translatedText !== text ? (
          <View style={styles.translationBox}>
            <Text style={styles.translationLabel}>Dịch tiếng Việt</Text>
            <Text style={styles.translationText}>{translation.translatedText}</Text>
          </View>
        ) : null}
        <Text style={[styles.messageTime, !isGuest && styles.adminMessageTime]}>{formatTime(message.createdAt)}</Text>
      </View>
    </View>
  );
}

function ChatPane({ session, messages, translations, loading, sending, onSend, onRefresh, onBack }) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);
  const guestLanguage = normalizeLanguage(session?.language);
  const needsTranslation = !isStaffLanguage(guestLanguage);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 80);
  }, [messages.length, session?.sessionCode]);

  if (!session) {
    return (
      <View style={styles.chatEmpty}>
        <Text style={styles.emptyTitle}>Chọn một cuộc trò chuyện</Text>
        <Text style={styles.emptyBody}>App sẽ tự dịch tin khách sang tiếng Việt để nhân viên dễ trả lời.</Text>
      </View>
    );
  }

  async function submit(text = draft) {
    const clean = text.trim();
    if (!clean || sending) return;
    setDraft('');
    await onSend(clean);
  }

  return (
    <KeyboardAvoidingView
      style={styles.chatPane}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      <View style={styles.chatHeader}>
        <Pressable onPress={onBack} style={styles.mobileBackButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <View style={styles.chatHeaderMain}>
          <Text style={styles.chatGuest}>{session.guestName || 'Guest'}</Text>
          <Text style={styles.chatMeta}>
            {session.sessionCode} · {getLanguageLabel(guestLanguage)}
          </Text>
        </View>
        <Pressable style={styles.smallButton} onPress={onRefresh}>
          <Text style={styles.smallButtonText}>Refresh</Text>
        </Pressable>
      </View>

      <View style={styles.translateNotice}>
        <Text style={styles.translateNoticeText}>
          {needsTranslation
            ? `Khách dùng ${getLanguageLabel(guestLanguage)}. Tin khách được dịch sang tiếng Việt, câu trả lời tiếng Việt sẽ tự dịch ngược trước khi gửi.`
            : 'Khách dùng tiếng Việt. Tin nhắn sẽ gửi trực tiếp, không cần dịch.'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.gold} />
          <Text style={styles.helperText}>Đang tải tin nhắn...</Text>
        </View>
      ) : (
        <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messagesContent}>
          {messages.map((message) => (
            <MessageBubble key={message.id || message.createdAt} message={message} translation={translations[message.id]} />
          ))}
        </ScrollView>
      )}

      <View style={styles.quickReplyRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickReplies.map((reply) => (
            <Pressable key={reply} style={styles.quickReply} onPress={() => submit(reply)} disabled={sending}>
              <Text style={styles.quickReplyText}>{reply}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.replyBox}>
        <TextInput
          multiline
          value={draft}
          onChangeText={setDraft}
          style={styles.replyInput}
          placeholder="Nhập câu trả lời bằng tiếng Việt..."
          placeholderTextColor="#958a7d"
        />
        <Pressable
          style={[styles.sendButton, (!draft.trim() || sending) && styles.disabledButton]}
          onPress={() => submit()}
          disabled={!draft.trim() || sending}
        >
          {sending ? <ActivityIndicator color={colors.white} /> : <Text style={styles.sendButtonText}>Gửi</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function App() {
  const [screen, setScreen] = useState('boot');
  const [admin, setAdmin] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [translations, setTranslations] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef(null);

  const selectedCode = selected?.sessionCode;

  const translateGuestMessages = useCallback(async (nextMessages, guestLanguage) => {
    const guestMessages = nextMessages.filter((message) => message.senderType === 'GUEST' && message.id);
    for (const message of guestMessages) {
      setTranslations((current) => {
        if (current[message.id]) return current;
        return { ...current, [message.id]: { loading: true } };
      });
      try {
        const result = await translateText({
          text: getMessageText(message),
          sourceLanguage: guestLanguage || 'auto',
          targetLanguage: 'vi',
        });
        setTranslations((current) => ({ ...current, [message.id]: result }));
      } catch (_error) {
        setTranslations((current) => ({
          ...current,
          [message.id]: {
            translated: false,
            translatedText: getMessageText(message),
            provider: 'fallback-original',
          },
        }));
      }
    }
  }, []);

  const loadSessions = useCallback(async () => {
    setRefreshing(true);
    setError('');
    try {
      const data = await listChatSessions({ limit: 50 });
      setSessions(data.items || []);
    } catch (loadError) {
      setError(loadError.message || 'Không tải được danh sách tin nhắn.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const openSession = useCallback(
    async (session) => {
      setSelected(session);
      setScreen('chat');
      setLoadingMessages(true);
      try {
        const detail = await getChatSession(session.sessionCode);
        setSelected(detail);
        const nextMessages = uniqueMessages(detail.messages || []);
        setMessages(nextMessages);
        await markAdminRead(session.sessionCode).catch(() => {});
        await translateGuestMessages(nextMessages, detail.language || session.language || 'auto');
      } catch (loadError) {
        Alert.alert('Không tải được chat', loadError.message || 'Vui lòng thử lại.');
      } finally {
        setLoadingMessages(false);
      }
    },
    [translateGuestMessages],
  );

  const refreshSelected = useCallback(async () => {
    if (!selectedCode) return;
    await openSession(selected);
  }, [openSession, selected, selectedCode]);

  const setupSocket = useCallback(async () => {
    socketRef.current?.disconnect?.();
    socketRef.current = await connectAdminSocket({
      onMessage: (message) => {
        setSessions((current) =>
          current.map((session) =>
            session.sessionCode === message.sessionCode ? { ...session, updatedAt: message.createdAt } : session,
          ),
        );
        if (message.sessionCode === selectedCode) {
          setMessages((current) => uniqueMessages([...current, message]));
          if (message.senderType === 'GUEST') {
            translateGuestMessages([message], selected?.language || 'auto');
          }
          markAdminRead(message.sessionCode).catch(() => {});
        } else {
          loadSessions();
        }
      },
      onSession: () => loadSessions(),
      onError: (socketError) => setError(socketError?.message || 'Socket disconnected'),
    });
  }, [loadSessions, selected?.language, selectedCode, translateGuestMessages]);

  useEffect(() => {
    AsyncStorage.multiGet([storageKeys.token, storageKeys.admin]).then((pairs) => {
      const values = Object.fromEntries(pairs);
      if (values[storageKeys.token]) {
        setAdmin(values[storageKeys.admin] ? JSON.parse(values[storageKeys.admin]) : {});
        setScreen('list');
      } else {
        setScreen('login');
      }
    });
  }, []);

  useEffect(() => {
    if (!admin) return undefined;
    loadSessions();
    setupSocket();
    return () => socketRef.current?.disconnect?.();
  }, [admin, loadSessions, setupSocket]);

  async function handleSend(text) {
    if (!selected) return;
    setSending(true);
    try {
      const guestLanguage = normalizeLanguage(selected.language);
      const translation = isStaffLanguage(guestLanguage)
        ? { translatedText: text, translated: false }
        : await translateText({ text, sourceLanguage: 'vi', targetLanguage: guestLanguage });
      const outboundText = translation.translatedText || text;
      const created = await sendAdminMessage(selected.sessionCode, outboundText);
      setMessages((current) => uniqueMessages([...current, { ...created, sessionCode: selected.sessionCode }]));
      if (translation.translated) {
        Alert.alert('Đã dịch trước khi gửi', `VI: ${text}\n\n${guestLanguage.toUpperCase()}: ${outboundText}`);
      }
      await loadSessions();
    } catch (sendError) {
      Alert.alert('Không gửi được tin', sendError.message || 'Vui lòng thử lại.');
      setDraftSafe(text);
    } finally {
      setSending(false);
    }
  }

  function setDraftSafe(_text) {
    // Reserved for a future draft persistence layer. Keeping this no-op avoids losing app stability.
  }

  async function logout() {
    socketRef.current?.disconnect?.();
    await clearAuth();
    setAdmin(null);
    setSelected(null);
    setMessages([]);
    setScreen('login');
  }

  const unreadTotal = useMemo(
    () => sessions.reduce((total, session) => total + Number(session.unreadByAdmin || 0), 0),
    [sessions],
  );

  if (screen === 'boot') {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.gold} />
      </SafeAreaView>
    );
  }

  if (screen === 'login') {
    return <LoginScreen onLogin={(data) => { setAdmin(data.admin); setScreen('list'); }} onSettings={() => setScreen('settings')} />;
  }

  if (screen === 'settings') {
    return <SettingsScreen onBack={() => setScreen(admin ? 'list' : 'login')} />;
  }

  return (
    <SafeAreaView style={styles.safeLight}>
      <StatusBar style="dark" />
      {error ? (
        <Pressable style={styles.errorBanner} onPress={() => setError('')}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </Pressable>
      ) : null}
      <View style={styles.statusStrip}>
        <Text style={styles.statusText}>Logged in: {admin?.username || admin?.name || 'admin'}</Text>
        <Text style={styles.statusText}>Unread: {unreadTotal}</Text>
      </View>
      <View style={styles.shell}>
        {screen === 'list' ? (
          <SessionList
            sessions={sessions}
            selectedCode={selectedCode}
            refreshing={refreshing}
            onRefresh={loadSessions}
            onSelect={openSession}
            onLogout={logout}
            onSettings={() => setScreen('settings')}
          />
        ) : (
          <ChatPane
            session={selected}
            messages={messages}
            translations={translations}
            loading={loadingMessages}
            sending={sending}
            onSend={handleSend}
            onRefresh={refreshSelected}
            onBack={() => setScreen('list')}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  safeLight: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  loginHero: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 26,
  },
  logoMark: {
    color: colors.white,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 8,
  },
  loginTitle: {
    marginTop: 18,
    color: colors.white,
    fontSize: 34,
    fontWeight: '900',
  },
  loginSubtitle: {
    marginTop: 12,
    color: '#dacdbc',
    fontSize: 16,
    lineHeight: 24,
  },
  loginCard: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: colors.panel,
    padding: 22,
  },
  topBar: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
  },
  topBarTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  backButton: {
    marginRight: 12,
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.cream,
  },
  backButtonText: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 36,
  },
  content: {
    padding: 20,
  },
  label: {
    marginTop: 14,
    marginBottom: 8,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    color: colors.ink,
    fontSize: 16,
  },
  primaryButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.gold,
    marginTop: 18,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.55,
  },
  ghostButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  ghostButtonText: {
    color: colors.goldDark,
    fontSize: 15,
    fontWeight: '800',
  },
  helperText: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  errorText: {
    marginTop: 12,
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  successText: {
    marginTop: 12,
    color: colors.success,
    fontSize: 14,
    fontWeight: '800',
  },
  statusStrip: {
    minHeight: 34,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusText: {
    color: '#f1e5d4',
    fontSize: 12,
    fontWeight: '700',
  },
  shell: {
    flex: 1,
  },
  listPane: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  appTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  appSubtitle: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 13,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.cream,
  },
  iconButtonText: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  listContent: {
    padding: 14,
  },
  sessionCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 22,
    backgroundColor: colors.white,
    padding: 16,
  },
  sessionCardSelected: {
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 4,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionName: {
    flex: 1,
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  badge: {
    minWidth: 26,
    overflow: 'hidden',
    borderRadius: 13,
    backgroundColor: colors.danger,
    color: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '900',
  },
  sessionMeta: {
    marginTop: 7,
    color: colors.goldDark,
    fontSize: 12,
    fontWeight: '800',
  },
  sessionPreview: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  sessionTime: {
    marginTop: 8,
    color: '#998e82',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  chatEmpty: {
    display: 'none',
  },
  chatPane: {
    flex: 1,
    backgroundColor: colors.panel,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.white,
    padding: 12,
  },
  mobileBackButton: {
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.cream,
    marginRight: 10,
  },
  chatHeaderMain: {
    flex: 1,
  },
  chatGuest: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  chatMeta: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 12,
  },
  smallButton: {
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.cream,
    paddingHorizontal: 12,
  },
  smallButtonText: {
    color: colors.goldDark,
    fontSize: 12,
    fontWeight: '900',
  },
  translateNotice: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: '#fff3d9',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  translateNoticeText: {
    color: colors.goldDark,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 14,
    paddingBottom: 22,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageRow: {
    marginVertical: 6,
    flexDirection: 'row',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '86%',
    borderRadius: 20,
    padding: 12,
  },
  guestBubble: {
    borderTopLeftRadius: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  adminBubble: {
    borderTopRightRadius: 6,
    backgroundColor: colors.ink,
  },
  systemBubble: {
    alignSelf: 'center',
    backgroundColor: '#efe8dc',
  },
  messageText: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 22,
  },
  adminMessageText: {
    color: colors.white,
  },
  messageTime: {
    marginTop: 7,
    color: '#9a9085',
    fontSize: 11,
  },
  adminMessageTime: {
    color: '#d3c3aa',
  },
  translationBox: {
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: '#f4eee5',
    padding: 10,
  },
  translationLabel: {
    color: colors.goldDark,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  translationText: {
    marginTop: 4,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 21,
  },
  quickReplyRow: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
    paddingVertical: 10,
  },
  quickReply: {
    maxWidth: 280,
    marginLeft: 10,
    borderRadius: 999,
    backgroundColor: colors.cream,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  quickReplyText: {
    color: colors.goldDark,
    fontSize: 13,
    fontWeight: '800',
  },
  replyBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: colors.white,
    padding: 12,
  },
  replyInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    backgroundColor: colors.panel,
    color: colors.ink,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sendButton: {
    minHeight: 48,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.gold,
    paddingHorizontal: 14,
  },
  sendButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900',
  },
  errorBanner: {
    backgroundColor: '#fff1f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ffd2cc',
    padding: 10,
  },
  errorBannerText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
});
