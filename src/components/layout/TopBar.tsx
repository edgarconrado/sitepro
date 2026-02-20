/**
 * SitePro — TopBar + NotificationsPanel
 * Fusionados en un solo archivo para evitar imports circulares
 */

import { useMenu } from '@hooks/useMenu';
import { useAppStore } from '@store/appStore';
import { colors } from '@theme/colors';
import { borderRadius, fontSize, fontWeight, iconSize, shadows, spacing } from '@theme/tokens';
import type { Notification } from '@types/index';
import {
  AlertTriangle,
  Bell,
  Building2,
  Camera,
  CheckCheck,
  CheckSquare,
  Menu,
  MessageSquare,
  X,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

function timeAgoShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Ahora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const TYPE_CONFIG: Record<string, { renderIcon: () => React.ReactNode; bg: string; color: string; label: string }> = {
  task: { renderIcon: () => <CheckSquare size={18} color={colors.primary[600]} />, bg: colors.primary[50], color: colors.primary[600], label: 'Tarea' },
  message: { renderIcon: () => <MessageSquare size={18} color={colors.success[600]} />, bg: colors.success[50], color: colors.success[600], label: 'Mensaje' },
  photo: { renderIcon: () => <Camera size={18} color={colors.purple[500]} />, bg: colors.purple[50], color: colors.purple[500], label: 'Foto' },
  system: { renderIcon: () => <AlertTriangle size={18} color={colors.warning[600]} />, bg: colors.warning[50], color: colors.warning[600], label: 'Sistema' },
};

function NotifItem({ notif, onRead }: { notif: Notification; onRead: () => void }) {
  const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system;
  return (
    <TouchableOpacity style={[np.item, !notif.isRead && np.itemUnread]} onPress={onRead} activeOpacity={0.85}>
      {!notif.isRead && <View style={np.unreadDot} />}
      <View style={[np.iconBg, { backgroundColor: cfg.bg }]}>{cfg.renderIcon()}</View>
      <View style={np.itemContent}>
        <View style={np.itemHeader}>
          <Text style={[np.itemTitle, !notif.isRead && np.itemTitleUnread]} numberOfLines={1}>{notif.title}</Text>
          <Text style={np.itemTime}>{timeAgoShort(notif.createdAt)}</Text>
        </View>
        <Text style={np.itemDesc} numberOfLines={2}>{notif.description}</Text>
        <View style={[np.typeBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[np.typeBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function NotificationsPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { notifications, unreadNotifications, markNotificationRead, markAllNotificationsRead } = useAppStore();
  const unread = notifications.filter(n => !n.isRead);
  const read = notifications.filter(n => n.isRead);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={np.overlay}>
        <TouchableOpacity style={np.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={np.panel}>
          <View style={np.header}>
            <View style={np.headerLeft}>
              <Bell size={iconSize.md} color={colors.text.primary} />
              <Text style={np.headerTitle}>Notificaciones</Text>
              {unreadNotifications > 0 && (
                <View style={np.badge}><Text style={np.badgeText}>{unreadNotifications}</Text></View>
              )}
            </View>
            <View style={np.headerRight}>
              {unreadNotifications > 0 && (
                <TouchableOpacity onPress={markAllNotificationsRead} style={np.markAllBtn}>
                  <CheckCheck size={16} color={colors.primary[600]} />
                  <Text style={np.markAllText}>Marcar todas</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={np.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={iconSize.md} color={colors.gray[500]} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
            {notifications.length === 0 ? (
              <View style={np.empty}>
                <View style={np.emptyIcon}><Bell size={32} color={colors.gray[300]} /></View>
                <Text style={np.emptyTitle}>Sin notificaciones</Text>
                <Text style={np.emptySubtitle}>Cuando haya actividad en tu proyecto aparecerá aquí</Text>
              </View>
            ) : (
              <>
                {unread.length > 0 && (
                  <>
                    <Text style={np.groupLabel}>Sin leer</Text>
                    {unread.map(n => <NotifItem key={n.id} notif={n} onRead={() => markNotificationRead(n.id)} />)}
                  </>
                )}
                {read.length > 0 && (
                  <>
                    <Text style={np.groupLabel}>Anteriores</Text>
                    {read.map(n => <NotifItem key={n.id} notif={n} onRead={() => { }} />)}
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

export function TopBar() {
  const { open } = useMenu();
  const unreadNotifications = useAppStore((s) => s.unreadNotifications);
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <View style={tb.topBar}>
      <TouchableOpacity onPress={open} style={tb.iconBtn} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
        <Menu size={iconSize.lg} color={colors.gray[800]} />
      </TouchableOpacity>
      <View style={tb.logoRow}>
        <View style={tb.logoIcon}>
          <Building2 size={16} color={colors.white} strokeWidth={2} />
        </View>
        <Text style={tb.logoText}>SitePro</Text>
      </View>
      <TouchableOpacity style={tb.iconBtn} onPress={() => setShowNotifs(true)}>
        <Bell size={iconSize.lg} color={colors.gray[800]} />
        {unreadNotifications > 0 && <View style={tb.notifDot} />}
      </TouchableOpacity>
      <NotificationsPanel visible={showNotifs} onClose={() => setShowNotifs(false)} />
    </View>
  );
}

const tb = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  iconBtn: { padding: spacing.sm, borderRadius: borderRadius.sm, position: 'relative' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoIcon: { width: 32, height: 32, backgroundColor: colors.primary[600], borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text.primary },
  notifDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error[500], borderWidth: 1.5, borderColor: colors.white },
});

const np = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  panel: { backgroundColor: colors.white, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '80%', ...shadows.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text.primary },
  badge: { backgroundColor: colors.error[500], borderRadius: borderRadius.full, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.white },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  markAllText: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: colors.primary[600] },
  closeBtn: { width: 32, height: 32, borderRadius: borderRadius.full, backgroundColor: colors.gray[100], alignItems: 'center', justifyContent: 'center' },
  groupLabel: { fontSize: fontSize.small, fontWeight: fontWeight.bold, color: colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing.xs },
  item: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing.base, paddingVertical: spacing.md, gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.gray[50], position: 'relative' },
  itemUnread: { backgroundColor: colors.primary[50] + '60' },
  unreadDot: { position: 'absolute', left: 6, top: '50%', width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary[600] },
  iconBg: { width: 40, height: 40, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  itemContent: { flex: 1, gap: 4 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemTitle: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: colors.text.secondary, flex: 1 },
  itemTitleUnread: { fontWeight: fontWeight.bold, color: colors.text.primary },
  itemTime: { fontSize: fontSize.small, color: colors.text.tertiary, marginLeft: spacing.xs },
  itemDesc: { fontSize: fontSize.small, color: colors.text.tertiary, lineHeight: 18 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  typeBadgeText: { fontSize: 10, fontWeight: fontWeight.bold },
  empty: { alignItems: 'center', paddingVertical: 48, gap: spacing.md },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.gray[100], alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text.secondary },
  emptySubtitle: { fontSize: fontSize.body, color: colors.text.tertiary, textAlign: 'center', paddingHorizontal: spacing.xl },
});