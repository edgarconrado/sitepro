/**
 * SitePro — Toast Notifications (estilo Sileo)
 * Píldoras flotantes con spring animation, badge de color y apilado
 */

import { colors } from '@/theme';
import { useTheme } from '@hooks/useTheme';
import { borderRadius, fontSize, fontWeight, shadows, spacing } from '@theme/tokens';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Loader,
  X,
  XCircle,
} from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number | null; // null = no auto-dismiss
  action?: { label: string; onPress: () => void };
}

interface ToastStore {
  toasts: ToastItem[];
  show: (item: Omit<ToastItem, 'id'>) => string;
  hide: (id: string) => void;
  clear: () => void;
  // Convenience
  success: (title: string, description?: string, opts?: Partial<ToastItem>) => string;
  error: (title: string, description?: string, opts?: Partial<ToastItem>) => string;
  warning: (title: string, description?: string, opts?: Partial<ToastItem>) => string;
  info: (title: string, description?: string, opts?: Partial<ToastItem>) => string;
  loading: (title: string, description?: string) => string;
  promise: <T>(
    p: Promise<T>,
    opts: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    }
  ) => Promise<T>;
}

// ─── Store ────────────────────────────────────────────────────
export const useToast = create<ToastStore>((set, get) => ({
  toasts: [],

  show: (item) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set((s) => ({ toasts: [{ ...item, id }, ...s.toasts].slice(0, 4) }));
    return id;
  },

  hide: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  clear: () => set({ toasts: [] }),

  success: (title, description, opts) =>
    get().show({ type: 'success', title, description, duration: 3500, ...opts }),

  error: (title, description, opts) =>
    get().show({ type: 'error', title, description, duration: 5000, ...opts }),

  warning: (title, description, opts) =>
    get().show({ type: 'warning', title, description, duration: 4500, ...opts }),

  info: (title, description, opts) =>
    get().show({ type: 'info', title, description, duration: 4000, ...opts }),

  loading: (title, description) =>
    get().show({ type: 'loading', title, description, duration: null }),

  promise: async (p, opts) => {
    const id = get().loading(opts.loading);
    try {
      const data = await p;
      get().hide(id);
      const title = typeof opts.success === 'function' ? opts.success(data) : opts.success;
      get().success(title);
      return data;
    } catch (err) {
      get().hide(id);
      const title = typeof opts.error === 'function' ? opts.error(err) : opts.error;
      get().error(title);
      throw err;
    }
  },
}));

// ─── Config per type ──────────────────────────────────────────
const TYPE_CONFIG: Record<ToastType, {
  bg: string;
  icon: React.ReactNode;
  label: string;
}> = {
  success: {
    bg: colors.success[500],
    icon: <CheckCircle size={14} color={colors.white} strokeWidth={2.5} />,
    label: 'Éxito',
  },
  error: {
    bg: colors.error[500],
    icon: <XCircle size={14} color={colors.white} strokeWidth={2.5} />,
    label: 'Error',
  },
  warning: {
    bg: '#F59E0B',
    icon: <AlertTriangle size={14} color={colors.white} strokeWidth={2.5} />,
    label: 'Aviso',
  },
  info: {
    bg: colors.primary[500],
    icon: <Info size={14} color={colors.white} strokeWidth={2.5} />,
    label: 'Info',
  },
  loading: {
    bg: colors.gray[600],
    icon: <Loader size={14} color={colors.white} strokeWidth={2.5} />,
    label: 'Cargando',
  },
};

// ─── Single Toast ─────────────────────────────────────────────
function ToastCard({ toast, index }: { toast: ToastItem; index: number }) {
  const { colors, isDark } = useTheme();
  const { hide } = useToast();
  const cfg = TYPE_CONFIG[toast.type];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss
  useEffect(() => {
    if (toast.duration !== null && toast.duration !== undefined) {
      timerRef.current = setTimeout(() => hide(toast.id), toast.duration);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toast.id, toast.duration]);

  // Spinning loader animation
  const rotation = useSharedValue(0);
  useEffect(() => {
    if (toast.type === 'loading') {
      const spin = () => {
        rotation.value = withTiming(rotation.value + 360, { duration: 900 }, () => {
          runOnJS(spin)();
        });
      };
      spin();
    }
  }, [toast.type]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      entering={FadeIn.springify().damping(18).stiffness(200)}
      exiting={FadeOut.duration(200)}
      layout={Layout.springify().damping(18).stiffness(200)}
      style={[
        styles.card,
        index > 0 && styles.cardStacked,
        { opacity: index === 0 ? 1 : Math.max(0.5, 1 - index * 0.25) },
        { transform: [{ scale: Math.max(0.88, 1 - index * 0.06) }, { translateY: index * 6 }] },
      ]}
    >
      {/* Badge */}
      <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
        {toast.type === 'loading' ? (
          <Animated.View style={spinStyle}>{cfg.icon}</Animated.View>
        ) : cfg.icon}
        <Text style={styles.badgeLabel}>{cfg.label}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{toast.title}</Text>
        {toast.description ? (
          <Text style={styles.description} numberOfLines={2}>{toast.description}</Text>
        ) : null}
        {toast.action ? (
          <TouchableOpacity onPress={() => { toast.action!.onPress(); hide(toast.id); }}>
            <Text style={[styles.actionLabel, { color: cfg.bg }]}>{toast.action.label}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Dismiss */}
      {toast.type !== 'loading' && (
        <TouchableOpacity
          onPress={() => hide(toast.id)}
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={12} color={colors.gray[400]} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// ─── Toast Container (mount in root layout) ───────────────────
export function ToastContainer() {
  const toasts = useToast((s) => s.toasts);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      style={[
        styles.container,
        { top: insets.top + spacing.sm },
      ]}
      pointerEvents="box-none"
    >
      {toasts.map((toast, index) => (
        <ToastCard key={toast.id} toast={toast} index={index} />
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const CARD_W = Math.min(Dimensions.get('window').width - spacing.base * 2, 380);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.base,
    right: spacing.base,
    zIndex: 9999,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  card: {
    width: CARD_W,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.full ?? 999,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm + 2,
    gap: spacing.sm,
    ...shadows.lg,
    // Sileo-style subtle border
    borderWidth: 1,
    borderColor: '#F5F5F5',
    marginBottom: 0,
  },
  cardStacked: {
    position: 'absolute',
    top: 0,
  },

  // Badge pill (colored)
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 999,
    flexShrink: 0,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Content
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    color: '#0F0F0F',
    lineHeight: 18,
  },
  description: {
    fontSize: fontSize.small,
    color: '#737373',
    lineHeight: 16,
  },
  actionLabel: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.bold,
    marginTop: 2,
  },

  // Close
  closeBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});