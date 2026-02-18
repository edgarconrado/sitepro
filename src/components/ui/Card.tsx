/**
 * SitePro — Componente Card
 * Contenedor base para cards de la app
 */

import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors } from '@theme/colors';
import { borderRadius, shadows, spacing } from '@theme/tokens';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
  pressable?: boolean;
}

export function Card({
  children,
  onPress,
  style,
  padding = spacing.base,
  pressable = true,
}: CardProps) {
  if (onPress && pressable) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[styles.card, { padding }, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
});
