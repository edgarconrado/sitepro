/**
 * SitePro — Componente Button
 * Variantes: primary | secondary | text | danger
 */

import { colors } from '@/theme';
import { useTheme } from '@hooks/useTheme';
import { borderRadius, fontSize, fontWeight, shadows, spacing, touchSize } from '@theme/tokens';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const { colors, isDark } = useTheme(); 
  const variantStyles = getVariantStyles(variant);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.85}
      style={[
        styles.base,
        variantStyles.container,
        fullWidth && styles.fullWidth,
        (disabled || isLoading) && styles.disabled,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.dark[900] : colors.primary[700]}
          size="small"
        />
      ) : (
        <Text style={[styles.text, variantStyles.text, textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

function getVariantStyles(variant: ButtonVariant) {
  switch (variant) {
    case 'primary':
      return {
        container: {
          backgroundColor: colors.primary[600],
          ...shadows.primary,
        },
        text: { color: colors.dark[900] },
      };
    case 'secondary':
      return {
        container: { backgroundColor: colors.gray[100] },
        text: { color: colors.gray[700] },
      };
    case 'text':
      return {
        container: { backgroundColor: colors.transparent },
        text: { color: colors.primary[600] },
      };
    case 'danger':
      return {
        container: { backgroundColor: colors.error[50] },
        text: { color: colors.error[500] },
      };
  }
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchSize.button,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});