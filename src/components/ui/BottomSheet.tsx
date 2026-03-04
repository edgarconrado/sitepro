/**
 * SitePro — BottomSheet
 * Wrapper reutilizable para modales tipo hoja inferior
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '@hooks/useTheme';
import { fontSize, fontWeight, spacing, borderRadius, shadows, iconSize } from '@theme/tokens';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** Si true, usa KeyboardAvoidingView para forms */
  avoidKeyboard?: boolean;
  children: React.ReactNode;
  /** Altura máxima como porcentaje (default '90%') */
  maxHeight?: string | number;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  avoidKeyboard = false,
  children,
  maxHeight = '90%',
}: BottomSheetProps) {
  const { colors } = useTheme();

  const sheet = (
    <View style={[s.sheet, { maxHeight }]}>
      {title !== undefined && (
        <View style={[s.header, { borderBottomColor: colors.border.light }]}>
          <Text style={[s.title, { color: colors.text.primary }]}>{title}</Text>
          <TouchableOpacity
            onPress={onClose}
            style={[s.closeBtn, { backgroundColor: colors.gray[100] }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={18} color={colors.gray[500]} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      )}
      {children}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
        {avoidKeyboard ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={s.kav}
          >
            {sheet}
          </KeyboardAvoidingView>
        ) : (
          sheet
        )}
      </View>
    </Modal>
  );
}

// ─── Subcomponent: BottomSheetHeader for custom headers ──────
export function BottomSheetHeader({
  onCancel,
  onSave,
  title,
  saveLabel = 'Guardar',
  saveDisabled = false,
}: {
  onCancel: () => void;
  onSave: () => void;
  title: string;
  saveLabel?: string;
  saveDisabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={[sh.header, { borderBottomColor: colors.border.light, backgroundColor: colors.background.primary }]}>
      <TouchableOpacity onPress={onCancel}>
        <Text style={[sh.cancel, { color: colors.text.tertiary }]}>Cancelar</Text>
      </TouchableOpacity>
      <Text style={[sh.title, { color: colors.text.primary }]}>{title}</Text>
      <TouchableOpacity onPress={onSave} disabled={saveDisabled}>
        <Text style={[sh.save, { color: saveDisabled ? colors.text.disabled : colors.primary[600] }]}>
          {saveLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: { ...StyleSheet.absoluteFillObject },
  kav: { justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...shadows.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const sh = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  title: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  cancel: { fontSize: fontSize.base },
  save: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
});
