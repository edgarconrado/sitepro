/**
 * SitePro — Confirmaciones de Acciones Destructivas
 * iOS-compatible: sin Modals anidados, overlay absoluto con pointerEvents correcto
 */

import { colors } from '@/theme';
import { useTheme } from '@hooks/useTheme';
import { borderRadius, fontSize, fontWeight, spacing } from '@theme/tokens';
import {
  AlertTriangle,
  FolderMinus,
  Info,
  LogOut,
  Trash2,
  UserMinus,
  X,
} from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────
type DialogVariant = 'danger' | 'warning' | 'info';
type DialogIcon = 'trash' | 'alert' | 'user-remove' | 'folder-remove' | 'logout' | 'info';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
  icon?: DialogIcon;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmStore {
  visible: boolean;
  options: ConfirmOptions | null;
  confirm: (opts: ConfirmOptions) => void;
  dismiss: () => void;
}

// ─── Store ────────────────────────────────────────────────────
export const useConfirm = create<ConfirmStore>((set, get) => ({
  visible: false,
  options: null,
  confirm: (opts) => set({ visible: true, options: opts }),
  dismiss: () => {
    get().options?.onCancel?.();
    set({ visible: false, options: null });
  },
}));

// ─── Variant config ───────────────────────────────────────────
const VARIANT_CONFIG: Record<DialogVariant, {
  iconBg: string; iconColor: string; btnBg: string; btnText: string;
}> = {
  danger: { iconBg: colors.error[50], iconColor: colors.error[500], btnBg: colors.error[500], btnText: colors.white },
  warning: { iconBg: colors.warning[50], iconColor: colors.warning[500], btnBg: colors.warning[500], btnText: colors.white },
  info: { iconBg: colors.primary[50], iconColor: colors.primary[700], btnBg: colors.primary[600], btnText: colors.dark[900] },
};

const ICON_MAP: Record<DialogIcon, (color: string) => React.ReactNode> = {
  'trash': (c) => <Trash2 size={24} color={c} strokeWidth={2} />,
  'alert': (c) => <AlertTriangle size={24} color={c} strokeWidth={2} />,
  'user-remove': (c) => <UserMinus size={24} color={c} strokeWidth={2} />,
  'folder-remove': (c) => <FolderMinus size={24} color={c} strokeWidth={2} />,
  'logout': (c) => <LogOut size={24} color={c} strokeWidth={2} />,
  'info': (c) => <Info size={24} color={c} strokeWidth={2} />,
};

// ─── Dialog inner ─────────────────────────────────────────────
function ConfirmDialogInner({ options, onDismiss }: {
  options: ConfirmOptions; onDismiss: () => void;
}) {
  const cfg = VARIANT_CONFIG[options.variant ?? 'danger'];

  const backdropOpacity = useSharedValue(0);
  const sheetOpacity = useSharedValue(0);
  const sheetScale = useSharedValue(0.92);
  const sheetTranslateY = useSharedValue(20);

  useEffect(() => {
    backdropOpacity.value = withTiming(1, { duration: 220 });
    sheetOpacity.value = withTiming(1, { duration: 200 });
    sheetScale.value = withSpring(1, { damping: 20, stiffness: 280 });
    sheetTranslateY.value = withSpring(0, { damping: 20, stiffness: 280 });
  }, []);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: sheetOpacity.value,
    transform: [{ scale: sheetScale.value }, { translateY: sheetTranslateY.value }],
  }));

  return (
    <View style={s.root} pointerEvents="box-none">
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onDismiss}>
        <Animated.View style={[s.backdrop, backdropStyle]} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View style={[s.sheetWrap, sheetStyle]} pointerEvents="box-none">
        <View style={s.sheet}>
          <TouchableOpacity
            style={s.closeBtn}
            onPress={onDismiss}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.6}
          >
            <X size={15} color={colors.gray[400]} strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={[s.iconWrap, { backgroundColor: cfg.iconBg }]}>
            {ICON_MAP[options.icon ?? 'trash'](cfg.iconColor)}
          </View>

          <Text style={s.title}>{options.title}</Text>
          <Text style={s.message}>{options.message}</Text>

          <View style={s.actions}>
            <TouchableOpacity style={s.cancelBtn} onPress={onDismiss} activeOpacity={0.65}>
              <Text style={s.cancelText}>{options.cancelLabel ?? 'Cancelar'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.confirmBtn, { backgroundColor: cfg.btnBg }]}
              onPress={() => { options.onConfirm(); onDismiss(); }}
              activeOpacity={0.8}
            >
              <Text style={[s.confirmText, { color: cfg.btnText }]}>
                {options.confirmLabel ?? 'Eliminar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Container — mount once in root _layout.tsx ───────────────
export function ConfirmDialogContainer() {
  const { colors, isDark } = useTheme();
  const { visible, options, dismiss } = useConfirm();
  if (!visible || !options) return null;
  return <ConfirmDialogInner options={options} onDismiss={dismiss} />;
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 99,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  sheetWrap: {
    width: '100%',
    zIndex: 1,
  },
  sheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#0F0F0F',
    textAlign: 'center',
  },
  message: {
    fontSize: fontSize.body,
    color: '#737373',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    marginTop: spacing.xs,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  cancelText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: '#333333',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
});