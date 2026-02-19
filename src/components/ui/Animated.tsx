/**
 * SitePro — Animated Components
 * Componentes con animaciones usando Reanimated 3
 */

import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  interpolate,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  ZoomIn,
  Layout,
  runOnJS,
} from 'react-native-reanimated';

// ─── Spring configs ───────────────────────────────────────────
export const SPRING = {
  gentle:  { damping: 18, stiffness: 160, mass: 0.8 },
  bouncy:  { damping: 12, stiffness: 200, mass: 0.7 },
  snappy:  { damping: 22, stiffness: 280, mass: 0.9 },
  slow:    { damping: 25, stiffness: 100, mass: 1.0 },
};

// ─── Pressable card con escala ────────────────────────────────
export function PressableScale({
  children,
  onPress,
  style,
  scaleTo = 0.97,
  disabled = false,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  scaleTo?: number;
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn  = () => { scale.value = withSpring(scaleTo, SPRING.snappy); };
  const handlePressOut = () => { scale.value = withSpring(1, SPRING.gentle);       };

  return (
    <Animated.View style={[animStyle, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={disabled}
        style={StyleSheet.absoluteFill.width ? undefined : { flex: 1 }}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Fade + slide al montar la pantalla ──────────────────────
export function ScreenEntrance({
  children,
  style,
  delay = 0,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(350).easing(Easing.out(Easing.cubic)).springify().damping(18)}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </Animated.View>
  );
}

// ─── Staggered list item ──────────────────────────────────────
export function StaggerItem({
  children,
  index,
  style,
}: {
  children: React.ReactNode;
  index: number;
  style?: ViewStyle;
}) {
  return (
    <Animated.View
      entering={FadeInDown
        .delay(index * 60)
        .duration(300)
        .easing(Easing.out(Easing.cubic))
      }
      layout={Layout.springify().damping(16)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

// ─── Tab icon animado ─────────────────────────────────────────
export function AnimatedTabIcon({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) {
  const scale   = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      scale.value      = withSequence(withSpring(1.18, SPRING.bouncy), withSpring(1, SPRING.gentle));
      translateY.value = withSequence(withSpring(-3, SPRING.bouncy),   withSpring(0, SPRING.gentle));
    }
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  return <Animated.View style={animStyle}>{children}</Animated.View>;
}

// ─── FAB animado con entrada spring + pulse ───────────────────
export function AnimatedFAB({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const scale  = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Entrada con spring
    scale.value = withDelay(300, withSpring(1, SPRING.bouncy));
  }, []);

  const handlePressIn  = () => {
    scale.value  = withSpring(0.9, SPRING.snappy);
    rotate.value = withSpring(-0.1, SPRING.snappy);
  };
  const handlePressOut = () => {
    scale.value  = withSpring(1, SPRING.gentle);
    rotate.value = withSpring(0, SPRING.gentle);
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}rad` },
    ],
  }));

  return (
    <Animated.View style={[animStyle, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Badge animado (número sin leer) ─────────────────────────
export function AnimatedBadge({
  count,
  style,
}: {
  count: number;
  style?: ViewStyle;
}) {
  const scale = useSharedValue(0);

  useEffect(() => {
    if (count > 0) {
      scale.value = withSequence(
        withSpring(1.3, SPRING.bouncy),
        withSpring(1,   SPRING.gentle),
      );
    } else {
      scale.value = withSpring(0, SPRING.snappy);
    }
  }, [count]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[animStyle, style]} />;
}

// ─── Shimmer / skeleton loader ────────────────────────────────
export function ShimmerBox({ width, height, borderRadius = 8, style }: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}) {
  const translateX = useSharedValue(-300);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(300, { duration: 1200, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: '#E5E7EB',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          shimmerStyle,
          {
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255,255,255,0.5)',
          },
        ]}
      />
    </Animated.View>
  );
}

// ─── Animated number (counter) ────────────────────────────────
export function AnimatedNumber({
  value,
  style,
  suffix = '',
}: {
  value: number;
  style?: any;
  suffix?: string;
}) {
  const animValue = useSharedValue(0);

  useEffect(() => {
    animValue.value = withTiming(value, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, [value]);

  const textStyle = useAnimatedStyle(() => ({}));

  // Use a simple approach with JS-driven animation for text
  const [displayed, setDisplayed] = React.useState(0);

  useEffect(() => {
    const start = displayed;
    const end   = value;
    const duration = 600;
    const startTime = Date.now();

    const update = () => {
      const elapsed  = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  }, [value]);

  return (
    <Animated.Text style={[textStyle, style]}>
      {displayed}{suffix}
    </Animated.Text>
  );
}
