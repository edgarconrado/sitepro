/**
 * SitePro — Sync Manager
 * Barra flotante de sincronización: guardando → sincronizado → error
 * Mock listo para conectar a API real
 */

import { colors } from '@/theme';
import { useTheme } from '@hooks/useTheme';
import { fontSize, fontWeight, shadows, spacing } from '@theme/tokens';
import { Check, CloudOff, RefreshCw, WifiOff } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────
type SyncStatus = 'idle' | 'saving' | 'synced' | 'error' | 'offline';

interface SyncState {
  status: SyncStatus;
  message: string;
  pendingOps: number;   // operaciones pendientes de sync
  lastSynced: Date | null;

  // Acciones
  startSaving: (message?: string) => void;
  markSynced: () => void;
  markError: (message?: string) => void;
  markOffline: () => void;
  markOnline: () => void;
  addPendingOp: () => void;
  reset: () => void;

  // Helper: simula un guardado completo (mock — reemplazar con fetch real)
  mockSave: (fn?: () => Promise<void>) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────
export const useSyncStore = create<SyncState>((set, get) => ({
  status: 'idle',
  message: '',
  pendingOps: 0,
  lastSynced: null,

  startSaving: (message = 'Guardando cambios...') =>
    set({ status: 'saving', message }),

  markSynced: () =>
    set({ status: 'synced', message: 'Cambios guardados', lastSynced: new Date(), pendingOps: 0 }),

  markError: (message = 'Error al guardar') =>
    set({ status: 'error', message }),

  markOffline: () =>
    set({ status: 'offline', message: 'Sin conexión — cambios pendientes' }),

  markOnline: () => {
    const { pendingOps } = get();
    if (pendingOps > 0) {
      set({ status: 'saving', message: `Sincronizando ${pendingOps} cambio${pendingOps > 1 ? 's' : ''}...` });
      setTimeout(() => get().markSynced(), 1800);
    } else {
      set({ status: 'idle', message: '' });
    }
  },

  addPendingOp: () =>
    set((s) => ({ pendingOps: s.pendingOps + 1 })),

  reset: () =>
    set({ status: 'idle', message: '', pendingOps: 0 }),

  mockSave: async (fn) => {
    get().startSaving();
    try {
      if (fn) {
        await fn();
      } else {
        // Simula latencia de red (400-900ms)
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 500));
      }
      get().markSynced();
      // Auto-reset a idle después de 2.5s
      setTimeout(() => {
        if (get().status === 'synced') get().reset();
      }, 2500);
    } catch {
      get().markError();
    }
  },
}));

// ─── Config per status ────────────────────────────────────────
const STATUS_CONFIG: Record<SyncStatus, {
  bg: string;
  textColor: string;
  renderIcon: () => React.ReactNode;
} | null> = {
  idle: null, // no se muestra
  saving: {
    bg: colors.gray[800],
    textColor: colors.white,
    renderIcon: () => <RefreshCw size={13} color={colors.white} strokeWidth={2.5} />,
  },
  synced: {
    bg: colors.success[500],
    textColor: colors.white,
    renderIcon: () => <Check size={13} color={colors.white} strokeWidth={2.5} />,
  },
  error: {
    bg: colors.error[500],
    textColor: colors.white,
    renderIcon: () => <CloudOff size={13} color={colors.white} strokeWidth={2.5} />,
  },
  offline: {
    bg: colors.gray[700],
    textColor: colors.white,
    renderIcon: () => <WifiOff size={13} color={colors.white} strokeWidth={2.5} />,
  },
};

// ─── Spinning Icon for 'saving' ───────────────────────────────
function SpinningIcon() {
  const { colors, isDark } = useTheme();
  const rotation = useSharedValue(0);

  useEffect(() => {
    const spin = () => {
      rotation.value = withTiming(rotation.value + 360, { duration: 900, easing: Easing.linear }, () => {
        runOnJS(spin)();
      });
    };
    spin();
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <RefreshCw size={13} color={colors.white} strokeWidth={2.5} />
    </Animated.View>
  );
}

// ─── Sync Bar Component ───────────────────────────────────────
export function SyncBar() {
  const { colors, isDark } = useTheme();
  const { status, message } = useSyncStore();
  const insets = useSafeAreaInsets();
  const cfg = STATUS_CONFIG[status];

  // Animation values
  const translateY = useSharedValue(80);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  const visible = status !== 'idle';

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 18, stiffness: 250 });
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 16, stiffness: 280 });
    } else {
      translateY.value = withSpring(80, { damping: 18, stiffness: 250 });
      opacity.value = withTiming(0, { duration: 180 });
      scale.value = withSpring(0.9, { damping: 16, stiffness: 280 });
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!cfg) return null;

  return (
    <Animated.View
      style={[
        styles.bar,
        { backgroundColor: cfg.bg, bottom: insets.bottom + 72 }, // above tab bar
        animStyle,
      ]}
      pointerEvents="box-none"
    >
      {status === 'saving' ? <SpinningIcon /> : cfg.renderIcon()}
      <Text style={[styles.barText, { color: cfg.textColor }]} numberOfLines={1}>
        {message}
      </Text>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm + 1,
    borderRadius: 999,
    zIndex: 9998,
    ...shadows.lg,
    // Sileo-style subtle glow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  barText: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.1,
  },
});