/**
 * SitePro — NotificationsPanel
 * Panel deslizable desde la campanita del TopBar
 */

import { useAppStore } from '@store/appStore';
import { colors } from '@theme/colors';
import { borderRadius, fontSize, fontWeight, iconSize, shadows, spacing } from '@theme/tokens';
import type { Notification } from '@types/index';
import {
  AlertTriangle,
  Bell,
  Camera,
  CheckCheck,
  CheckSquare,
  MessageSquare,
  X,
} from 'lucide-react-native';
import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// ─── Helpers ──────────────────────────────────────────────────
function timeAgoShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Ahora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

const TYPE_CONFIG: Record<string, {
  renderIcon: () => React.ReactNode;
  bg: string;
  color: string;
  label: string;
}> = {
  task: {
    renderIcon: () => <CheckSquare size={18} color={colors.primary[600]} />,
    bg: colors.primary[50],
    color: colors.primary[600],
    label: 'Tarea',
  },
  message: {
    renderIcon: () => <MessageSquare size={18} color={colors.success[600]} />,
    bg: colors.success[50],
    color: colors.success[600],
    label: 'Mensaje',
  },
  photo: {
    renderIcon: () => <Camera size={18} color={colors.purple[500]} />,
    bg: colors.purple[50],
    color: colors.purple[500],
    label: 'Foto',
  },
  system: {
    renderIcon: () => <AlertTriangle size={18} color={colors.warning[600]} />,
    bg: colors.warning[50],
    color: colors.warning[600],
    label: 'Sistema',
  },
};

// ─── Notification Item ────────────────────────────────────────
function NotifItem({ notif, onRead }: { notif: Notification; onRead: () => void }) {
  const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system;

  return (
    <TouchableOpacity
      style={[styles.item, !notif.isRead && styles.itemUnread]}
      onPress={onRead}
      activeOpacity={0.85}
    >
      {/* Unread dot */}
      {!notif.isRead && <View style={styles.unreadDot} />}

      {/* Icon */}
      <View style={[styles.iconBg, { backgroundColor: cfg.bg }]}>
        {cfg.renderIcon()}
      </View>

      {/* Content */}
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemTitle, !notif.isRead && styles.itemTitleUnread]} numberOfLines={1}>
            {notif.title}
          </Text>
          <Text style={styles.itemTime}>{timeAgoShort(notif.createdAt)}</Text>
        </View>
        <Text style={styles.itemDesc} numberOfLines={2}>
          {notif.description}
        </Text>
        <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.typeBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Panel ───────────────────────────────────────────────
export function NotificationsPanel({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { notifications, unreadNotifications, markNotificationRead, markAllNotificationsRead } =
    useAppStore();

  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);

  const handleMarkAll = () => {
    markAllNotificationsRead();
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        {/* Panel */}
        <View style={styles.panel}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Bell size={iconSize.md} color={colors.text.primary} />
              <Text style={styles.headerTitle}>Notificaciones</Text>
              {unreadNotifications > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadNotifications}</Text>
                </View>
              )}
            </View>
            <View style={styles.headerRight}>
              {unreadNotifications > 0 && (
                <TouchableOpacity onPress={handleMarkAll} style={styles.markAllBtn}>
                  <CheckCheck size={16} color={colors.primary[600]} />
                  <Text style={styles.markAllText}>Marcar todas</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={iconSize.md} color={colors.gray[500]} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {notifications.length === 0 ? (
              /* Empty state */
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Bell size={32} color={colors.gray[300]} />
                </View>
                <Text style={styles.emptyTitle}>Sin notificaciones</Text>
                <Text style={styles.emptySubtitle}>Cuando haya actividad en tu proyecto aparecerá aquí</Text>
              </View>
            ) : (
              <>
                {/* Unread */}
                {unread.length > 0 && (
                  <>
                    <Text style={styles.groupLabel}>Sin leer</Text>
                    {unread.map((n) => (
                      <NotifItem
                        key={n.id}
                        notif={n}
                        onRead={() => markNotificationRead(n.id)}
                      />
                    ))}
                  </>
                )}

                {/* Read */}
                {read.length > 0 && (
                  <>
                    <Text style={styles.groupLabel}>Anteriores</Text>
                    {read.map((n) => (
                      <NotifItem
                        key={n.id}
                        notif={n}
                        onRead={() => { }}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const PANEL_HEIGHT = '80%';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  panel: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: PANEL_HEIGHT,
    ...shadows.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text.primary },
  badge: {
    backgroundColor: colors.error[500],
    borderRadius: borderRadius.full,
    minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.white },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  markAllText: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: colors.primary[600] },
  closeBtn: {
    width: 32, height: 32, borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100], alignItems: 'center', justifyContent: 'center',
  },

  // Group label
  groupLabel: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.bold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.xs,
  },

  // Item
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[50],
    position: 'relative',
  },
  itemUnread: { backgroundColor: colors.primary[50] + '60' },
  unreadDot: {
    position: 'absolute',
    left: 6, top: '50%',
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.primary[600],
  },
  iconBg: {
    width: 40, height: 40, borderRadius: borderRadius.full,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  itemContent: { flex: 1, gap: 4 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemTitle: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: colors.text.secondary, flex: 1 },
  itemTitleUnread: { fontWeight: fontWeight.bold, color: colors.text.primary },
  itemTime: { fontSize: fontSize.small, color: colors.text.tertiary, marginLeft: spacing.xs },
  itemDesc: { fontSize: fontSize.small, color: colors.text.tertiary, lineHeight: 18 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  typeBadgeText: { fontSize: 10, fontWeight: fontWeight.bold },

  // Empty
  empty: { alignItems: 'center', paddingVertical: spacing['3xl'] ?? 48, gap: spacing.md },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.gray[100],
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text.secondary },
  emptySubtitle: { fontSize: fontSize.body, color: colors.text.tertiary, textAlign: 'center', paddingHorizontal: spacing.xl },
});