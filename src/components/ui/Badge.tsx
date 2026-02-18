/**
 * SitePro — Componente Badge
 * Usado para estados de tarea, prioridad y proyecto
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fontSize, fontWeight, borderRadius, spacing } from '@theme/tokens';

interface BadgeProps {
  label: string;
  bg: string;
  textColor: string;
}

export function Badge({ label, bg, textColor }: BadgeProps) {
  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
  },
});
