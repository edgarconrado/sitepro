/**
 * SitePro — Messages Screen
 */

import { EmptyMessages, EmptySearch } from '@/components/ui/EmptyStates';
import { colors } from '@/theme';
import { Avatar } from '@components/ui/Avatar';
import { MessagesScreenSkeleton, useSimulatedLoading } from '@components/ui/Skeletons';
import { useTheme } from '@hooks/useTheme';
import { borderRadius, fontSize, fontWeight, iconSize, shadows, spacing } from '@theme/tokens';
import { timeAgo } from '@utils/index';
import {
  ArrowLeft,
  Camera,
  Paperclip,
  Search,
  Send,
  X,
} from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Mock Data ────────────────────────────────────────────────
interface MockMessage {
  id: string;
  text: string;
  sentAt: string;
  isOwn: boolean;
}

interface MockConversation {
  id: string;
  name: string;
  initials: string;
  isOnline: boolean;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: MockMessage[];
}

const CONVERSATIONS: MockConversation[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    initials: 'JP',
    isOnline: true,
    lastMessage: '¿Ya revisaron los planos del piso 5?',
    lastMessageAt: '2026-02-18T10:30:00Z',
    unreadCount: 2,
    messages: [
      { id: 'm1', text: 'Buenos días, ¿cómo va el avance eléctrico?', sentAt: '2026-02-18T09:00:00Z', isOwn: true },
      { id: 'm2', text: 'Va bien, terminamos el cableado del piso 4 ayer', sentAt: '2026-02-18T09:15:00Z', isOwn: false },
      { id: 'm3', text: 'Perfecto, ¿para cuándo el piso 5?', sentAt: '2026-02-18T09:20:00Z', isOwn: true },
      { id: 'm4', text: '¿Ya revisaron los planos del piso 5?', sentAt: '2026-02-18T10:30:00Z', isOwn: false },
    ],
  },
  {
    id: '2',
    name: 'María García',
    initials: 'MG',
    isOnline: true,
    lastMessage: 'Necesito aprobación para orden de materiales',
    lastMessageAt: '2026-02-18T09:15:00Z',
    unreadCount: 1,
    messages: [
      { id: 'm1', text: 'Hola, necesito pedir materiales para plomería', sentAt: '2026-02-18T08:00:00Z', isOwn: false },
      { id: 'm2', text: '¿Cuánto necesitas?', sentAt: '2026-02-18T08:30:00Z', isOwn: true },
      { id: 'm3', text: 'Necesito aprobación para orden de materiales', sentAt: '2026-02-18T09:15:00Z', isOwn: false },
    ],
  },
  {
    id: '3',
    name: 'Carlos Ruiz',
    initials: 'CR',
    isOnline: false,
    lastMessage: 'Inspección completada sin problemas',
    lastMessageAt: '2026-02-17T16:00:00Z',
    unreadCount: 0,
    messages: [
      { id: 'm1', text: '¿Cómo salió la inspección de columnas?', sentAt: '2026-02-17T15:00:00Z', isOwn: true },
      { id: 'm2', text: 'Inspección completada sin problemas', sentAt: '2026-02-17T16:00:00Z', isOwn: false },
    ],
  },
  {
    id: '4',
    name: 'Ana López',
    initials: 'AL',
    isOnline: true,
    lastMessage: 'Las muestras de pintura ya llegaron',
    lastMessageAt: '2026-02-17T11:00:00Z',
    unreadCount: 0,
    messages: [
      { id: 'm1', text: '¿Llegaron las muestras de pintura?', sentAt: '2026-02-17T10:30:00Z', isOwn: true },
      { id: 'm2', text: 'Las muestras de pintura ya llegaron', sentAt: '2026-02-17T11:00:00Z', isOwn: false },
    ],
  },
  {
    id: '5',
    name: 'Equipo General',
    initials: 'EG',
    isOnline: true,
    lastMessage: 'Reunión mañana a las 8am en obra',
    lastMessageAt: '2026-02-17T08:00:00Z',
    unreadCount: 5,
    messages: [
      { id: 'm1', text: 'Aviso importante para todos', sentAt: '2026-02-17T07:50:00Z', isOwn: true },
      { id: 'm2', text: 'Reunión mañana a las 8am en obra', sentAt: '2026-02-17T08:00:00Z', isOwn: true },
    ],
  },
];

// ─── Chat View ────────────────────────────────────────────────
function ChatView({ conversation, onBack }: { conversation: MockConversation; onBack: () => void }) {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<MockMessage[]>(conversation.messages);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = () => {
    if (!text.trim()) return;
    const newMsg: MockMessage = {
      id: `m${Date.now()}`,
      text: text.trim(),
      sentAt: new Date().toISOString(),
      isOwn: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    setText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView style={chat.safe}>
        {/* Chat Header */}
        <View style={chat.header}>
          <TouchableOpacity onPress={onBack} style={chat.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ArrowLeft size={iconSize.md} color={colors.gray[700]} />
          </TouchableOpacity>
          <Avatar initials={conversation.initials} size={36} showOnlineIndicator isOnline={conversation.isOnline} />
          <View style={chat.headerInfo}>
            <Text style={chat.headerName}>{conversation.name}</Text>
            <Text style={chat.headerStatus}>{conversation.isOnline ? 'En línea' : 'Desconectado'}</Text>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={chat.messages}
          contentContainerStyle={chat.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map((msg) => (
            <View key={msg.id} style={[chat.bubble, msg.isOwn ? chat.bubbleOwn : chat.bubbleOther]}>
              <Text style={[chat.bubbleText, msg.isOwn ? chat.bubbleTextOwn : chat.bubbleTextOther]}>
                {msg.text}
              </Text>
              <Text style={[chat.bubbleTime, msg.isOwn ? chat.bubbleTimeOwn : chat.bubbleTimeOther]}>
                {timeAgo(msg.sentAt)}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={chat.inputBar}>
          <TouchableOpacity style={chat.inputAction}>
            <Paperclip size={iconSize.md} color={colors.gray[400]} />
          </TouchableOpacity>
          <TouchableOpacity style={chat.inputAction}>
            <Camera size={iconSize.md} color={colors.gray[400]} />
          </TouchableOpacity>
          <TextInput
            style={chat.input}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={colors.gray[400]}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[chat.sendBtn, text.trim() ? chat.sendBtnActive : null]}
            onPress={sendMessage}
            disabled={!text.trim()}
            activeOpacity={0.8}
          >
            <Send size={18} color={text.trim() ? colors.white : colors.gray[400]} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ─── Conversation Card ────────────────────────────────────────
function ConversationCard({ conv, onPress }: { conv: MockConversation; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <Avatar initials={conv.initials} size={44} showOnlineIndicator isOnline={conv.isOnline} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={[styles.convName, conv.unreadCount > 0 && styles.convNameUnread]}>
            {conv.name}
          </Text>
          <Text style={styles.convTime}>{timeAgo(conv.lastMessageAt)}</Text>
        </View>
        <View style={styles.cardFooter}>
          <Text
            style={[styles.convPreview, conv.unreadCount > 0 && styles.convPreviewUnread]}
            numberOfLines={1}
          >
            {conv.lastMessage}
          </Text>
          {conv.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function MessagesScreen() {
  const { colors, isDark } = useTheme();

  const [search, setSearch] = useState('');
  const [openConv, setOpenConv] = useState<MockConversation | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return CONVERSATIONS;
    const q = search.toLowerCase();
    return CONVERSATIONS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q)
    );
  }, [search]);

  const totalUnread = CONVERSATIONS.reduce((acc, c) => acc + c.unreadCount, 0);

  const isLoading = useSimulatedLoading();

  // Open chat modal
  if (openConv) {
    return (
      <Modal visible animationType="slide">
        <ChatView conversation={openConv} onBack={() => setOpenConv(null)} />
      </Modal>
    );
  }

  if (isLoading) return <MessagesScreenSkeleton />;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>Mensajes</Text>
          {totalUnread > 0 && (
            <View style={styles.totalUnreadBadge}>
              <Text style={styles.totalUnreadText}>{totalUnread} sin leer</Text>
            </View>
          )}
        </View>
        <View style={styles.searchContainer}>
          <Search size={iconSize.sm} color={colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar conversaciones..."
            placeholderTextColor={colors.gray[400]}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={14} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          search
            ? <EmptySearch title="Sin resultados" subtitle={`No se encontraron conversaciones para "${search}"`} />
            : <EmptyMessages
              title="Sin mensajes aún"
              subtitle="Aquí verás los mensajes del proyecto. El equipo podrá comunicarse desde esta sección."
            />
        }
        renderItem={({ item }) => (
          <ConversationCard conv={item} onPress={() => setOpenConv(item)} />
        )}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    ...shadows.sm,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  screenTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: '#0F0F0F' },
  totalUnreadBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  totalUnreadText: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: '#CA8A04' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#D4D4D4',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md, height: 40, gap: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: fontSize.body, color: '#0F0F0F', paddingVertical: 0 },
  listContent: { paddingBottom: 32 },
  separator: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 72 },

  // Conversation card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  cardContent: { flex: 1, minWidth: 0 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  convName: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: '#0F0F0F' },
  convNameUnread: { fontWeight: fontWeight.bold },
  convTime: { fontSize: fontSize.small, color: '#737373', flexShrink: 0, marginLeft: spacing.sm },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  convPreview: { fontSize: fontSize.body, color: '#737373', flex: 1 },
  convPreviewUnread: { color: '#333333', fontWeight: fontWeight.medium },
  unreadBadge: {
    minWidth: 20, height: 20,
    backgroundColor: '#EAAB00',
    borderRadius: borderRadius.full,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5, marginLeft: spacing.sm, flexShrink: 0,
  },
  unreadText: { fontSize: 10, fontWeight: fontWeight.bold, color: '#FFFFFF' },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 60, gap: spacing.sm },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#333333' },
  emptySubtitle: { fontSize: fontSize.body, color: '#737373', textAlign: 'center', paddingHorizontal: spacing.xl },
});

// ─── Chat Styles ──────────────────────────────────────────────
const chat = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: spacing.md,
    ...shadows.sm,
  },
  backBtn: { padding: spacing.xs },
  headerInfo: { flex: 1 },
  headerName: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: '#0F0F0F' },
  headerStatus: { fontSize: fontSize.small, color: '#737373' },

  // Messages
  messages: { flex: 1 },
  messagesContent: { padding: spacing.base, gap: spacing.md, paddingBottom: spacing.lg },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: 4,
  },
  bubbleOwn: {
    alignSelf: 'flex-end',
    backgroundColor: '#EAAB00',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    ...shadows.sm,
  },
  bubbleText: { fontSize: fontSize.base, lineHeight: 20 },
  bubbleTextOwn: { color: '#FFFFFF' },
  bubbleTextOther: { color: '#0F0F0F' },
  bubbleTime: { fontSize: 10 },
  bubbleTimeOwn: { color: `${'#FFFFFF'}99`, alignSelf: 'flex-end' },
  bubbleTimeOther: { color: '#737373' },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    ...shadows.sm,
  },
  inputAction: { padding: spacing.sm, marginBottom: 2 },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#FAFAFA',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
    color: '#0F0F0F',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  sendBtn: {
    width: 40, height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#EAAB00',
  },
});