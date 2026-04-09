/**
 * SitePro — Messages Screen (Supabase + Realtime)
 * Conversaciones directas entre miembros del proyecto activo
 */

import { EmptyMessages, EmptySearch } from '@/components/ui/EmptyStates';
import { colors } from '@/theme';
import { Avatar } from '@components/ui/Avatar';
import { MessagesScreenSkeleton } from '@components/ui/Skeletons';
import { useTheme } from '@hooks/useTheme';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@store/authStore';
import { useProjectsStore } from '@store/projectsStore';
import { borderRadius, fontSize, fontWeight, iconSize, shadows, spacing } from '@theme/tokens';
import { timeAgo } from '@utils/index';
import {
  ArrowLeft, Camera, Paperclip, Search, Send, X,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Modal,
  Platform, ScrollView, StatusBar, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Tipos ────────────────────────────────────────────────────
interface Conversation {
  id: string;           // user_id del otro miembro
  name: string;
  initials: string;
  isOnline: boolean;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  conversationId: string | null; // ID real en tabla conversations
}

interface Message {
  id: string;
  text: string;
  sentAt: string;
  isOwn: boolean;
  senderName: string;
}

// ─── Helpers ─────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
}

// Obtener o crear conversación directa entre dos usuarios
async function getOrCreateConversation(userId: string, otherUserId: string): Promise<string> {
  // Buscar si ya existe una conversación entre los dos
  const { data: existing } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId);

  if (existing && existing.length > 0) {
    const myConvIds = existing.map((r: any) => r.conversation_id);

    const { data: shared } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', otherUserId)
      .in('conversation_id', myConvIds);

    if (shared && shared.length > 0) {
      // Verificar que sea 1:1 (no grupo)
      for (const row of shared) {
        const { count } = await supabase
          .from('conversation_participants')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', row.conversation_id);
        if (count === 2) return row.conversation_id;
      }
    }
  }

  // Crear conversación nueva
  const { data: conv, error } = await supabase
    .from('conversations')
    .insert({ is_group: false, created_by: userId })
    .select('id')
    .single();

  if (error) throw error;

  await supabase.from('conversation_participants').insert([
    { conversation_id: conv.id, user_id: userId },
    { conversation_id: conv.id, user_id: otherUserId },
  ]);

  return conv.id;
}

// ─── Chat View ────────────────────────────────────────────────
function ChatView({ conv, currentUserId, onBack }: {
  conv: Conversation;
  currentUserId: string;
  onBack: () => void;
}) {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [convId, setConvId] = useState<string | null>(conv.conversationId);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const realtimeSub = useRef<any>(null);

  // Cargar o crear conversación y mensajes
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const cId = convId ?? await getOrCreateConversation(currentUserId, conv.id);
        setConvId(cId);

        const { data } = await supabase
          .from('messages')
          .select('id, message, created_at, sender_id, profiles(full_name)')
          .eq('conversation_id', cId)
          .order('created_at', { ascending: true });

        setMessages((data ?? []).map((m: any) => ({
          id: m.id,
          text: m.message,
          sentAt: m.created_at,
          isOwn: m.sender_id === currentUserId,
          senderName: m.profiles?.full_name ?? 'Usuario',
        })));

        // Suscripción realtime
        realtimeSub.current = supabase
          .channel(`chat_${cId}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${cId}`,
          }, async (payload) => {
            const m = payload.new as any;
            // Obtener nombre del sender
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', m.sender_id)
              .single();

            setMessages(prev => [...prev, {
              id: m.id,
              text: m.message,
              sentAt: m.created_at,
              isOwn: m.sender_id === currentUserId,
              senderName: profile?.full_name ?? 'Usuario',
            }]);
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
          })
          .subscribe();
      } finally {
        setLoading(false);
      }
    };
    init();
    return () => { realtimeSub.current?.unsubscribe(); };
  }, []);

  const sendMessage = async () => {
    if (!text.trim() || !convId || sending) return;
    const msgText = text.trim();
    setText('');
    setSending(true);
    try {
      await supabase.from('messages').insert({
        conversation_id: convId,
        sender_id: currentUserId,
        message: msgText,
        status: 'sent',
      });
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView style={chat.safe}>
        {/* Header */}
        <View style={chat.header}>
          <TouchableOpacity onPress={onBack} style={chat.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ArrowLeft size={iconSize.md} color={colors.gray[700]} />
          </TouchableOpacity>
          <Avatar initials={conv.initials} size={36} showOnlineIndicator isOnline={conv.isOnline} />
          <View style={chat.headerInfo}>
            <Text style={chat.headerName}>{conv.name}</Text>
            <Text style={chat.headerStatus}>{conv.isOnline ? 'En línea' : 'Desconectado'}</Text>
          </View>
        </View>

        {/* Messages */}
        {loading ? (
          <View style={chat.loading}>
            <ActivityIndicator color={colors.primary[500]} />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={chat.messages}
            contentContainerStyle={chat.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            {messages.length === 0 && (
              <View style={chat.emptyChat}>
                <Text style={chat.emptyChatText}>Inicia la conversación con {conv.name}</Text>
              </View>
            )}
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
        )}

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
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[chat.sendBtn, text.trim() && !sending ? chat.sendBtnActive : null]}
            onPress={sendMessage}
            disabled={!text.trim() || sending}
            activeOpacity={0.8}
          >
            {sending
              ? <ActivityIndicator size="small" color={colors.white} />
              : <Send size={18} color={text.trim() ? colors.white : colors.gray[400]} />
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ─── Conversation Card ────────────────────────────────────────
function ConversationCard({ conv, onPress }: { conv: Conversation; onPress: () => void }) {
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
          <Text style={[styles.convPreview, conv.unreadCount > 0 && styles.convPreviewUnread]} numberOfLines={1}>
            {conv.lastMessage}
          </Text>
          {conv.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{conv.unreadCount > 9 ? '9+' : conv.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function MessagesScreen() {
  const { colors: themeColors, isDark } = useTheme();
  const { user } = useAuthStore();
  const { currentProjectId, loadProjects } = useProjectsStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');
  const [openConv, setOpenConv] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar miembros del proyecto como conversaciones potenciales
  const loadConversations = useCallback(async () => {
    const projectId = useProjectsStore.getState().currentProjectId;
    const userId = user?.id;
    if (!projectId || !userId) return;

    // Obtener miembros del proyecto (excluir yo mismo)
    const { data: members } = await supabase
      .from('project_members')
      .select('user_id, profiles(id, full_name, is_online)')
      .eq('project_id', projectId)
      .neq('user_id', userId);

    if (!members) { setIsLoading(false); return; }

    // Para cada miembro, ver si hay conversación existente
    const convs: Conversation[] = await Promise.all(
      members.map(async (m: any) => {
        const profile = m.profiles;
        const memberId = m.user_id;
        const name = profile?.full_name ?? 'Usuario';

        // Buscar conversación existente
        const { data: myConvs } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', userId);

        let lastMessage = 'Toca para iniciar conversación';
        let lastMessageAt = new Date().toISOString();
        let unreadCount = 0;
        let conversationId: string | null = null;

        if (myConvs && myConvs.length > 0) {
          const myIds = myConvs.map((r: any) => r.conversation_id);
          const { data: shared } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', memberId)
            .in('conversation_id', myIds);

          if (shared && shared.length > 0) {
            conversationId = shared[0].conversation_id;
            // Último mensaje
            const { data: lastMsg } = await supabase
              .from('messages')
              .select('message, created_at')
              .eq('conversation_id', conversationId)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (lastMsg) {
              lastMessage = lastMsg.message;
              lastMessageAt = lastMsg.created_at;
            }
          }
        }

        return {
          id: memberId,
          name,
          initials: getInitials(name),
          isOnline: profile?.is_online ?? false,
          lastMessage,
          lastMessageAt,
          unreadCount,
          conversationId,
        };
      })
    );

    // Ordenar: con conversación primero, luego por fecha
    convs.sort((a, b) => {
      if (a.conversationId && !b.conversationId) return -1;
      if (!a.conversationId && b.conversationId) return 1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

    setConversations(convs);
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadProjects().then(loadConversations);
  }, []);

  useEffect(() => {
    if (currentProjectId) loadConversations();
  }, [currentProjectId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  if (openConv && user?.id) {
    return (
      <Modal visible animationType="slide">
        <ChatView
          conv={openConv}
          currentUserId={user.id}
          onBack={() => { setOpenConv(null); loadConversations(); }}
        />
      </Modal>
    );
  }

  if (isLoading) return <MessagesScreenSkeleton />;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={themeColors.white} />

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

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          search
            ? <EmptySearch title="Sin resultados" subtitle={`No se encontraron conversaciones para "${search}"`} />
            : <EmptyMessages
              title="Sin mensajes aún"
              subtitle="Aquí verás los mensajes con los miembros de tu proyecto."
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
  header: { backgroundColor: '#FFFFFF', paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', ...shadows.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  screenTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: '#0F0F0F' },
  totalUnreadBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  totalUnreadText: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: '#CA8A04' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D4D4D4', borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, height: 40, gap: spacing.sm },
  searchInput: { flex: 1, fontSize: fontSize.body, color: '#0F0F0F', paddingVertical: 0 },
  listContent: { paddingBottom: 32 },
  separator: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 72 },
  card: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md, gap: spacing.md, backgroundColor: '#FFFFFF' },
  cardContent: { flex: 1, minWidth: 0 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  convName: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: '#0F0F0F' },
  convNameUnread: { fontWeight: fontWeight.bold },
  convTime: { fontSize: fontSize.small, color: '#737373', flexShrink: 0, marginLeft: spacing.sm },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  convPreview: { fontSize: fontSize.body, color: '#737373', flex: 1 },
  convPreviewUnread: { color: '#333333', fontWeight: fontWeight.medium },
  unreadBadge: { minWidth: 20, height: 20, backgroundColor: '#EAAB00', borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, marginLeft: spacing.sm, flexShrink: 0 },
  unreadText: { fontSize: 10, fontWeight: fontWeight.bold, color: '#FFFFFF' },
});

const chat = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: spacing.base, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', gap: spacing.md, ...shadows.sm },
  backBtn: { padding: spacing.xs },
  headerInfo: { flex: 1 },
  headerName: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: '#0F0F0F' },
  headerStatus: { fontSize: fontSize.small, color: '#737373' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyChat: { flex: 1, alignItems: 'center', paddingTop: 60 },
  emptyChatText: { fontSize: fontSize.base, color: '#A3A3A3', textAlign: 'center', paddingHorizontal: spacing.xl },
  messages: { flex: 1 },
  messagesContent: { padding: spacing.base, gap: spacing.md, paddingBottom: spacing.lg },
  bubble: { maxWidth: '78%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, gap: 4 },
  bubbleOwn: { alignSelf: 'flex-end', backgroundColor: '#EAAB00', borderBottomRightRadius: 4 },
  bubbleOther: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#F5F5F5', ...shadows.sm },
  bubbleText: { fontSize: fontSize.base, lineHeight: 20 },
  bubbleTextOwn: { color: '#FFFFFF' },
  bubbleTextOther: { color: '#0F0F0F' },
  bubbleTime: { fontSize: 10 },
  bubbleTimeOwn: { color: 'rgba(255,255,255,0.6)', alignSelf: 'flex-end' },
  bubbleTimeOther: { color: '#737373' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm, ...shadows.sm },
  inputAction: { padding: spacing.sm, marginBottom: 2 },
  input: { flex: 1, minHeight: 40, maxHeight: 100, backgroundColor: '#FAFAFA', borderRadius: borderRadius.xl, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.base, color: '#0F0F0F', borderWidth: 1, borderColor: '#E8E8E8' },
  sendBtn: { width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  sendBtnActive: { backgroundColor: '#EAAB00' },
});