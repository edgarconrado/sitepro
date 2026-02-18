/**
 * SitePro — Componente Avatar
 * Muestra iniciales del usuario con indicador de estado online
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@theme/colors';
import { fontSize, fontWeight, borderRadius } from '@theme/tokens';

interface AvatarProps {
  initials: string;
  size?: number;
  bgColor?: string;
  showOnlineIndicator?: boolean;
  isOnline?: boolean;
}

export function Avatar({
  initials,
  size = 40,
  bgColor = colors.primary[600],
  showOnlineIndicator = false,
  isOnline = false,
}: AvatarProps) {
  const indicatorSize = Math.max(size * 0.28, 10);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: borderRadius.full,
            backgroundColor: bgColor,
          },
        ]}
      >
        <Text
          style={[
            styles.initials,
            { fontSize: size * 0.35, color: colors.white },
          ]}
        >
          {initials}
        </Text>
      </View>

      {showOnlineIndicator && (
        <View
          style={[
            styles.indicator,
            {
              width: indicatorSize,
              height: indicatorSize,
              borderRadius: borderRadius.full,
              backgroundColor: isOnline ? colors.success[500] : colors.gray[400],
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: fontWeight.bold,
  },
  indicator: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.white,
  },
});
