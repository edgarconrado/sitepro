/**
 * SitePro — TopBar
 * Barra superior compartida por todas las pantallas de tabs
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Menu, Bell, Building2 } from 'lucide-react-native';
import { colors } from '@theme/colors';
import { fontSize, fontWeight, spacing, borderRadius, iconSize } from '@theme/tokens';
import { useMenu } from '@hooks/useMenu';
import { useAppStore } from '@store/appStore';

export function TopBar() {
  const { open } = useMenu();
  const unreadNotifications = useAppStore((s) => s.unreadNotifications);

  return (
    <View style={styles.topBar}>
      <TouchableOpacity onPress={open} style={styles.iconBtn} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
        <Menu size={iconSize.lg} color={colors.gray[800]} />
      </TouchableOpacity>

      <View style={styles.logoRow}>
        <View style={styles.logoIcon}>
          <Building2 size={16} color={colors.white} strokeWidth={2} />
        </View>
        <Text style={styles.logoText}>SitePro</Text>
      </View>

      <TouchableOpacity style={styles.iconBtn}>
        <Bell size={iconSize.lg} color={colors.gray[800]} />
        {unreadNotifications > 0 && <View style={styles.notifDot} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  iconBtn: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    position: 'relative',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoIcon: {
    width: 32,
    height: 32,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error[500],
    borderWidth: 1.5,
    borderColor: colors.white,
  },
});
