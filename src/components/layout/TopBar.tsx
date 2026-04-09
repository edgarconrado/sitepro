/**
 * SitePro — TopBar
 * Panel de notificaciones conectado a Supabase
 */

import { colors } from '@/theme';
import { GlobalSearch } from '@components/ui/GlobalSearch';
import { useMenu } from '@hooks/useMenu';
import { useTheme } from '@hooks/useTheme';
import { NOTIF_TYPE_UI, useNotificationsStore, type DbNotification } from '@store/notificationsStore';
import { borderRadius, fontSize, fontWeight, iconSize, shadows, spacing } from '@theme/tokens';
import {
  AlertTriangle, Bell, Building2, Camera,
  CheckCheck, CheckSquare, Menu, MessageSquare,
  Search, X
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  ActivityIndicator as RNActivityIndicator,
  ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Helpers ─────────────────────────────────────────────────
function timeAgoShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Ahora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const TYPE_CONFIG: Record<string, {
  renderIcon: () => React.ReactNode;
  bg: string; color: string; label: string;
}> = {
  task: {
    renderIcon: () => <CheckSquare size={18} color={colors.primary[600]} />,
    bg: colors.primary[50], color: colors.primary[600], label: 'Tarea',
  },
  message: {
    renderIcon: () => <MessageSquare size={18} color={colors.success[600]} />,
    bg: colors.success[50], color: colors.success[600], label: 'Mensaje',
  },
  photo: {
    renderIcon: () => <Camera size={18} color={colors.purple[500]} />,
    bg: colors.purple[50], color: colors.purple[500], label: 'Foto',
  },
  system: {
    renderIcon: () => <AlertTriangle size={18} color={colors.warning[600]} />,
    bg: colors.warning[50], color: colors.warning[600], label: 'Sistema',
  },
};

// ─── Notification Item ────────────────────────────────────────
function NotifItem({ notif, onRead }: { notif: DbNotification; onRead: () => void }) {
  const uiType = NOTIF_TYPE_UI[notif.type] ?? 'system';
  const cfg = TYPE_CONFIG[uiType] ?? TYPE_CONFIG.system;

  return (
    <TouchableOpacity
      style={[np.item, !notif.is_read && np.itemUnread]}
      onPress={onRead}
      activeOpacity={0.85}
    >
      {!notif.is_read && <View style={np.unreadDot} />}
      <View style={[np.iconBg, { backgroundColor: cfg.bg }]}>
        {cfg.renderIcon()}
      </View>
      <View style={np.itemContent}>
        <View style={np.itemHeader}>
          <Text
            style={[np.itemTitle, !notif.is_read && np.itemTitleUnread]}
            numberOfLines={1}
          >
            {notif.title}
          </Text>
          <Text style={np.itemTime}>{timeAgoShort(notif.created_at)}</Text>
        </View>
        {notif.description && (
          <Text style={np.itemDesc} numberOfLines={2}>{notif.description}</Text>
        )}
        <View style={[np.typeBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[np.typeBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Notifications Panel ──────────────────────────────────────
function NotificationsPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const {
    notifications, unreadCount, isLoading,
    loadNotifications, markRead, markAllRead,
    startRealtime, stopRealtime,
  } = useNotificationsStore();

  // Cargar y suscribir al abrir
  useEffect(() => {
    if (visible) {
      loadNotifications();
      startRealtime();
    } else {
      stopRealtime();
    }
  }, [visible]);

  const unread = notifications.filter(n => !n.is_read);
  const read = notifications.filter(n => n.is_read);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={np.overlay}>
        <TouchableOpacity style={np.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={np.panel}>
          {/* Header */}
          <View style={np.header}>
            <View style={np.headerLeft}>
              <Bell size={iconSize.md} color={colors.text.primary} />
              <Text style={np.headerTitle}>Notificaciones</Text>
              {unreadCount > 0 && (
                <View style={np.badge}>
                  <Text style={np.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <View style={np.headerRight}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllRead} style={np.markAllBtn}>
                  <CheckCheck size={16} color={colors.primary[600]} />
                  <Text style={np.markAllText}>Marcar todas</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onClose}
                style={np.closeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={iconSize.md} color={colors.gray[500]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={np.loading}>
              <RNActivityIndicator color={colors.primary[500]} />
              <Text style={np.loadingText}>Cargando notificaciones...</Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 32 }}
            >
              {notifications.length === 0 ? (
                <View style={np.empty}>
                  <View style={np.emptyIcon}>
                    <Bell size={32} color={colors.gray[300]} />
                  </View>
                  <Text style={np.emptyTitle}>Sin notificaciones</Text>
                  <Text style={np.emptySubtitle}>
                    Cuando haya actividad en tu proyecto aparecerá aquí
                  </Text>
                </View>
              ) : (
                <>
                  {unread.length > 0 && (
                    <>
                      <Text style={np.groupLabel}>Sin leer ({unread.length})</Text>
                      {unread.map(n => (
                        <NotifItem
                          key={n.id}
                          notif={n}
                          onRead={() => markRead(n.id)}
                        />
                      ))}
                    </>
                  )}
                  {read.length > 0 && (
                    <>
                      <Text style={np.groupLabel}>Anteriores</Text>
                      {read.map(n => (
                        <NotifItem key={n.id} notif={n} onRead={() => { }} />
                      ))}
                    </>
                  )}
                </>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── TopBar ───────────────────────────────────────────────────
export function TopBar() {
  const { colors: themeColors } = useTheme();
  const { open } = useMenu();
  const unreadCount = useNotificationsStore(s => s.unreadCount);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={[tb.topBar, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity
        onPress={open}
        style={tb.iconBtn}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        <Menu size={iconSize.lg} color={colors.gray[800]} />
      </TouchableOpacity>

      <View style={tb.logoRow}>
        <View style={tb.logoIcon}>
          <Building2 size={16} color={colors.white} strokeWidth={2} />
        </View>
        <Text style={tb.logoText}>SitePro</Text>
      </View>

      <TouchableOpacity style={tb.iconBtn} onPress={() => setShowSearch(true)}>
        <Search size={iconSize.lg} color={colors.gray[800]} />
      </TouchableOpacity>

      <TouchableOpacity style={tb.iconBtn} onPress={() => setShowNotifs(true)}>
        <Bell size={iconSize.lg} color={colors.gray[800]} />
        {unreadCount > 0 && (
          <View style={tb.notifBadge}>
            <Text style={tb.notifBadgeText}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <NotificationsPanel
        visible={showNotifs}
        onClose={() => setShowNotifs(false)}
      />
      <GlobalSearch visible={showSearch} onClose={() => setShowSearch(false)} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const tb = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingBottom: spacing.sm,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  iconBtn: { padding: spacing.sm, borderRadius: borderRadius.sm, position: 'relative' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoIcon: { width: 32, height: 32, backgroundColor: '#141414', borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#0F0F0F' },
  notifBadge: {
    position: 'absolute', top: 4, right: 4,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: '#FFFFFF',
  },
  notifBadgeText: { fontSize: 9, fontWeight: fontWeight.bold, color: '#FFFFFF' },
});

const np = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  panel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '82%',
    ...shadows.xl,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.base, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#0F0F0F' },
  badge: {
    backgroundColor: '#EF4444', borderRadius: borderRadius.full,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  badgeText: { fontSize: 11, fontWeight: fontWeight.bold, color: '#FFFFFF' },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  markAllText: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: '#EAAB00' },
  closeBtn: { width: 32, height: 32, borderRadius: borderRadius.full, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  loading: { padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  loadingText: { fontSize: fontSize.small, color: '#737373' },
  groupLabel: {
    fontSize: fontSize.small, fontWeight: fontWeight.bold, color: '#737373',
    textTransform: 'uppercase', letterSpacing: 0.5,
    paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing.xs,
  },
  item: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    gap: spacing.md, borderBottomWidth: 1, borderBottomColor: '#FAFAFA',
    position: 'relative',
  },
  itemUnread: { backgroundColor: '#FFFBEB60' },
  unreadDot: {
    position: 'absolute', left: 6, top: '50%',
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#EAAB00',
  },
  iconBg: { width: 40, height: 40, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  itemContent: { flex: 1, gap: 4 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemTitle: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: '#333333', flex: 1 },
  itemTitleUnread: { fontWeight: fontWeight.bold, color: '#0F0F0F' },
  itemTime: { fontSize: fontSize.small, color: '#737373', marginLeft: spacing.xs },
  itemDesc: { fontSize: fontSize.small, color: '#737373', lineHeight: 18 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  typeBadgeText: { fontSize: 10, fontWeight: fontWeight.bold },
  empty: { alignItems: 'center', paddingVertical: 48, gap: spacing.md },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: '#333333' },
  emptySubtitle: { fontSize: fontSize.body, color: '#737373', textAlign: 'center', paddingHorizontal: spacing.xl },
});