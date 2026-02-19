/**
 * SitePro — Side Menu (Menú Lateral)
 * Responsive: usa porcentaje del ancho + safe area insets
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Home,
  CheckSquare,
  Camera,
  MessageSquare,
  Users,
  Map,
  FileText,
  Calendar,
  Settings,
  LogOut,
} from 'lucide-react-native';
import { colors } from '@theme/colors';
import { fontSize, fontWeight, spacing, borderRadius, shadows, iconSize } from '@theme/tokens';
import { Avatar } from '@components/ui/Avatar';
import { useAuthStore } from '@store/authStore';

// Ancho del drawer: 80% de la pantalla, máximo 300px
const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.80, 300);

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  { icon: Home,         label: 'Inicio',    href: '/(app)/(tabs)/home'     as const, tab: 'home'     },
  { icon: CheckSquare,  label: 'Tareas',    href: '/(app)/(tabs)/tasks'    as const, tab: 'tasks'    },
  { icon: Camera,       label: 'Fotos',     href: '/(app)/(tabs)/photos'   as const, tab: 'photos'   },
  { icon: MessageSquare,label: 'Mensajes',  href: '/(app)/(tabs)/messages' as const, tab: 'messages' },
  { icon: Users,        label: 'Equipo',    href: '/(app)/(tabs)/team'     as const, tab: 'team'     },
];

const SECONDARY_ITEMS = [
  { icon: Map,      label: 'Planos'      },
  { icon: FileText, label: 'Documentos'  },
  { icon: Calendar, label: 'Calendario'  },
];

export function SideMenu({ visible, onClose }: SideMenuProps) {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 180,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleNavigate = (href: string) => {
    onClose();
    setTimeout(() => router.push(href as any), 150);
  };

  const handleLogout = () => {
    onClose();
    setTimeout(() => {
      logout();
      router.replace('/(auth)/login');
    }, 150);
  };

  const handleSettings = () => {
    onClose();
    setTimeout(() => router.push('/(app)/settings' as any), 150);
  };

  const handlePlans = () => {
    onClose();
    setTimeout(() => router.push('/(app)/plans' as any), 150);
  };

  const handleDocuments = () => {
    onClose();
    setTimeout(() => router.push('/(app)/documents' as any), 150);
  };

  const handleCalendar = () => {
    onClose();
    setTimeout(() => router.push('/(app)/calendar' as any), 150);
  };

  const isActive = (tab: string) => pathname.includes(tab);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          { width: DRAWER_WIDTH, transform: [{ translateX: slideAnim }] },
        ]}
      >
        {/* Top safe area + close button */}
        <View style={[styles.drawerTop, { paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.profileRow}>
            <Avatar initials={user?.initials ?? 'U'} size={44} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {user?.name ?? 'Usuario'}
              </Text>
              <Text style={styles.profileRole} numberOfLines={1}>
                {user?.role ?? 'Sin rol'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color={colors.gray[500]} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Scrollable nav content */}
        <ScrollView
          style={styles.scrollArea}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Main nav */}
          <Text style={styles.sectionLabel}>NAVEGACIÓN</Text>
          {MENU_ITEMS.map((item) => {
            const active = isActive(item.tab);
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.tab}
                style={[styles.menuItem, active && styles.menuItemActive]}
                onPress={() => handleNavigate(item.href)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBg, active && styles.menuIconBgActive]}>
                  <Icon
                    size={iconSize.md}
                    color={active ? colors.primary[600] : colors.gray[500]}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                </View>
                <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>
                  {item.label}
                </Text>
                {active && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            );
          })}

          <View style={styles.divider} />

          {/* Secondary items */}
          <Text style={[styles.sectionLabel, { marginTop: spacing.xs }]}>MÁS</Text>
          {SECONDARY_ITEMS.map((item) => {
            const Icon = item.icon;
            const onPressItem = item.label === 'Planos' ? handlePlans : item.label === 'Documentos' ? handleDocuments : item.label === 'Calendario' ? handleCalendar : onClose;
            return (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={onPressItem}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBg, (item.label === 'Planos' || item.label === 'Documentos' || item.label === 'Calendario') && { backgroundColor: colors.primary[50] }]}>
                  <Icon size={iconSize.md} color={(item.label === 'Planos' || item.label === 'Documentos' || item.label === 'Calendario') ? colors.primary[600] : colors.gray[400]} strokeWidth={1.8} />
                </View>
                <Text style={[styles.menuLabel, (item.label === 'Planos' || item.label === 'Documentos' || item.label === 'Calendario') ? { color: colors.text.secondary } : styles.menuLabelSecondary]}>
                  {item.label}
                </Text>
                {item.label !== 'Planos' && item.label !== 'Documentos' && item.label !== 'Calendario' && (
                  <View style={styles.comingBadge}>
                    <Text style={styles.comingText}>Próximo</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Footer — respeta el safe area bottom */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.base) }]}>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.footerItem} onPress={handleSettings} activeOpacity={0.7}>
            <Settings size={iconSize.md} color={colors.gray[500]} strokeWidth={1.8} />
            <Text style={styles.footerLabel}>Configuración</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.footerItem, styles.logoutItem]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <LogOut size={iconSize.md} color={colors.error[500]} strokeWidth={1.8} />
            <Text style={styles.logoutLabel}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.white,
    ...shadows.xl,
    flexDirection: 'column',
  },

  // Top section (profile + close)
  drawerTop: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  profileRole: {
    fontSize: fontSize.small,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.sm,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
    flexShrink: 0,
  },

  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginHorizontal: spacing.base,
    marginVertical: spacing.xs,
  },

  // Scrollable area
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.gray[400],
    letterSpacing: 1.2,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },

  // Menu items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.md,
    marginBottom: 2,
    position: 'relative',
  },
  menuItemActive: {
    backgroundColor: colors.primary[50],
  },
  menuIconBg: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  menuIconBgActive: {
    backgroundColor: colors.primary[100],
  },
  menuLabel: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },
  menuLabelActive: {
    color: colors.primary[700],
    fontWeight: fontWeight.semibold,
  },
  menuLabelSecondary: {
    color: colors.gray[400],
  },
  activeIndicator: {
    width: 4,
    height: 20,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.full,
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -10 }],
  },

  // Coming soon badge
  comingBadge: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    flexShrink: 0,
  },
  comingText: {
    fontSize: 10,
    fontWeight: fontWeight.medium,
    color: colors.gray[400],
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    gap: spacing.xs,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  logoutItem: {
    backgroundColor: colors.error[50],
  },
  footerLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },
  logoutLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.error[500],
  },
});
