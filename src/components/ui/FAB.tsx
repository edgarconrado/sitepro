/**
 * SitePro — Floating Action Button (FAB)
 */

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import { colors } from '@theme/colors';
import { shadows, touchSize, borderRadius, iconSize } from '@theme/tokens';

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
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.fab, { backgroundColor: color, bottom }]}
    >
      {icon ?? <Plus size={iconSize.lg} color={colors.white} strokeWidth={2.5} />}
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
