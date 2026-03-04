/**
 * SitePro — FilterBar
 * Barra de filtros horizontal scrollable — usado en tasks, documents, photos
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@hooks/useTheme';
import { fontSize, fontWeight, spacing, borderRadius } from '@theme/tokens';

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface FilterBarProps {
  options:  FilterOption[];
  active:   string;
  onChange: (value: string) => void;
}

export function FilterBar({ options, active, onChange }: FilterBarProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.content}
      style={s.scroll}
    >
      {options.map((opt) => {
        const isActive = opt.value === active;
        const label = opt.count !== undefined ? `${opt.label} (${opt.count})` : opt.label;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              s.pill,
              { borderColor: colors.border.default, backgroundColor: colors.background.primary },
              isActive && { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
            ]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.75}
          >
            <Text style={[
              s.pillText,
              { color: colors.text.tertiary },
              isActive && { color: '#000000', fontWeight: fontWeight.bold },
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flexGrow: 0 },
  content: {
    paddingHorizontal: spacing.base,
    paddingVertical:   spacing.sm,
    gap:               spacing.sm,
    flexDirection:     'row',
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.xs,
    borderRadius:      borderRadius.full,
    borderWidth:       1,
  },
  pillText: { fontSize: fontSize.small },
});
