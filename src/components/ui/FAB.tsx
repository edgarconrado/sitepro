/**
 * SitePro — Floating Action Button (FAB)
 */
import { colors } from '@/theme';
import { useTheme } from '@hooks/useTheme';
import { borderRadius, iconSize, shadows, touchSize } from '@theme/tokens';
import { Plus } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface FABProps {
  onPress: () => void;
  icon?: React.ReactNode;
  color?: string;
  bottom?: number;
}

export function FAB({
  onPress,
  icon,
  color = colors.primary[600],
  bottom = 96,
}: FABProps) {
  const { colors, isDark } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.fab, { backgroundColor: color, bottom }]}
    >
      {icon ?? <Plus size={iconSize.lg} color={colors.dark[900]} strokeWidth={2.5} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    width: touchSize.lg,
    height: touchSize.lg,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
});