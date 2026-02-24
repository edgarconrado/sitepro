/**
 * SitePro — Banner de estado offline
 * Aparece debajo del TopBar cuando no hay conexión
 */

import { useSyncStore } from '@components/ui/SyncManager';
import { useNetworkStatus } from '@hooks/useNetworkStatus';
import { useTheme } from '@hooks/useTheme';
import { fontSize, fontWeight, spacing } from '@theme/tokens';
import { WifiOff } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export function OfflineBanner() {
  const { colors, isDark } = useTheme();
  // This mounts the hook so it starts monitoring
  const isOffline = useNetworkStatus();
  const status = useSyncStore((s) => s.status);

  // Show banner when offline, briefly when back online
  const showBanner = isOffline || status === 'offline';

  const translateY = useSharedValue(-48);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (showBanner) {
      translateY.value = withSpring(0, { damping: 18, stiffness: 260 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(-48, { duration: 300 });
      opacity.value = withTiming(0, { duration: 250 });
    }
  }, [showBanner]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[s.banner, animStyle]} pointerEvents="none">
      <WifiOff size={14} color={colors.white} strokeWidth={2} />
      <Text style={s.text}>Sin conexión — los cambios se guardarán localmente</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 7,
    paddingHorizontal: spacing.base,
    backgroundColor: '#1F1F1F',
  },
  text: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    color: '#FFFFFF',
  },
});