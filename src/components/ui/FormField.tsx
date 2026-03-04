/**
 * SitePro — FormField
 * Label + input/selector con validación — reutilizable en todos los formularios
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useTheme } from '@hooks/useTheme';
import { fontSize, fontWeight, spacing, borderRadius } from '@theme/tokens';

interface BaseFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
}

// ─── Text input field ─────────────────────────────────────────
interface TextFieldProps extends BaseFieldProps, Omit<TextInputProps, 'style'> {
  charCount?: number;
  maxChars?: number;
}

export function TextField({ label, error, required, hint, charCount, maxChars, ...inputProps }: TextFieldProps) {
  const { colors } = useTheme();
  return (
    <View style={s.wrapper}>
      <Text style={[s.label, { color: colors.text.secondary }]}>
        {label}{required && <Text style={{ color: colors.error[500] }}> *</Text>}
      </Text>
      <TextInput
        style={[
          s.input,
          { color: colors.text.primary, borderColor: colors.border.default, backgroundColor: colors.background.primary },
          error ? { borderColor: colors.error[500], borderWidth: 2 } : {},
        ]}
        placeholderTextColor={colors.text.disabled}
        {...inputProps}
      />
      {hint && !error && <Text style={[s.hint, { color: colors.text.tertiary }]}>{hint}</Text>}
      {error && <Text style={[s.error, { color: colors.error[500] }]}>{error}</Text>}
      {maxChars && (
        <Text style={[s.charCount, { color: colors.text.tertiary }]}>{charCount ?? 0}/{maxChars}</Text>
      )}
    </View>
  );
}

// ─── Textarea field ───────────────────────────────────────────
export function TextAreaField({ label, error, required, hint, charCount, maxChars, ...inputProps }: TextFieldProps) {
  const { colors } = useTheme();
  return (
    <View style={s.wrapper}>
      <Text style={[s.label, { color: colors.text.secondary }]}>
        {label}{required && <Text style={{ color: colors.error[500] }}> *</Text>}
      </Text>
      <TextInput
        style={[
          s.input, s.textarea,
          { color: colors.text.primary, borderColor: colors.border.default, backgroundColor: colors.background.primary },
          error ? { borderColor: colors.error[500], borderWidth: 2 } : {},
        ]}
        placeholderTextColor={colors.text.disabled}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        {...inputProps}
      />
      {hint && !error && <Text style={[s.hint, { color: colors.text.tertiary }]}>{hint}</Text>}
      {error && <Text style={[s.error, { color: colors.error[500] }]}>{error}</Text>}
      {maxChars && (
        <Text style={[s.charCount, { color: colors.text.tertiary }]}>{charCount ?? 0}/{maxChars}</Text>
      )}
    </View>
  );
}

// ─── Selector field (tap to open a sheet) ─────────────────────
interface SelectorFieldProps extends BaseFieldProps {
  value: string;
  placeholder: string;
  onPress: () => void;
  prefix?: React.ReactNode;
}

export function SelectorField({ label, value, placeholder, onPress, error, required, prefix }: SelectorFieldProps) {
  const { colors } = useTheme();
  return (
    <View style={s.wrapper}>
      <Text style={[s.label, { color: colors.text.secondary }]}>
        {label}{required && <Text style={{ color: colors.error[500] }}> *</Text>}
      </Text>
      <TouchableOpacity
        style={[
          s.selector,
          { borderColor: error ? colors.error[500] : colors.border.default, backgroundColor: colors.background.primary },
          error ? { borderWidth: 2 } : {},
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {prefix}
        <Text
          style={[s.selectorText, { color: value ? colors.text.primary : colors.text.disabled }, { flex: 1 }]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <ChevronDown size={16} color={colors.text.disabled} />
      </TouchableOpacity>
      {error && <Text style={[s.error, { color: colors.error[500] }]}>{error}</Text>}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  wrapper: { marginBottom: spacing.base },
  label: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    minHeight: 48,
  },
  textarea: {
    minHeight: 100,
    paddingTop: spacing.md,
  },
  selector: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    gap: spacing.sm,
  },
  selectorText: { fontSize: fontSize.base },
  error: { fontSize: fontSize.small, marginTop: spacing.xs },
  hint: { fontSize: fontSize.small, marginTop: spacing.xs },
  charCount: { fontSize: fontSize.small, textAlign: 'right', marginTop: spacing.xs },
});
