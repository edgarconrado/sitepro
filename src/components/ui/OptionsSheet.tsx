/**
 * SitePro — OptionsSheet
 * Selector de opciones reutilizable — extraído de tasks.tsx
 * Usado en tasks, documents, calendar, settings
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { BottomSheet } from '@components/ui/BottomSheet';
import { useTheme } from '@hooks/useTheme';
import { fontSize, fontWeight, spacing, borderRadius } from '@theme/tokens';

interface OptionsSheetProps<T extends string> {
  visible:    boolean;
  title:      string;
  options:    T[];
  selected:   T | null;
  onSelect:   (value: T) => void;
  onClose:    () => void;
  renderItem?: (option: T) => React.ReactNode;
  maxHeight?: number | string;
}

export function OptionsSheet<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  renderItem,
  maxHeight = '60%',
}: OptionsSheetProps<T>) {
  const { colors } = useTheme();

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} maxHeight={maxHeight}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {options.map((opt) => {
          const isSelected = opt === selected;
          return (
            <TouchableOpacity
              key={opt}
              style={[
                s.option,
                { borderBottomColor: colors.border.light },
                isSelected && { backgroundColor: colors.primary[50] },
              ]}
              onPress={() => { onSelect(opt); onClose(); }}
              activeOpacity={0.75}
            >
              {renderItem ? renderItem(opt) : (
                <Text style={[s.optionText, { color: isSelected ? colors.primary[700] : colors.text.primary }]}>
                  {opt}
                </Text>
              )}
              {isSelected && (
                <CheckCircle2 size={18} color={colors.primary[600]} />
              )}
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  option: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: spacing.base,
    paddingVertical:   spacing.md,
    borderBottomWidth: 1,
    gap:               spacing.md,
  },
  optionText: {
    flex:       1,
    fontSize:   fontSize.base,
    fontWeight: fontWeight.medium,
  },
});
