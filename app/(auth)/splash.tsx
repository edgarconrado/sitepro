/**
 * SitePro — Splash Screen
 * Primera pantalla: gradiente azul, logo animado, tagline, barra de carga
 */

import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Building2 } from 'lucide-react-native';
import { colors } from '@theme/colors';
import { fontSize, fontWeight, spacing, borderRadius, shadows, duration } from '@theme/tokens';

const { width } = Dimensions.get('window');
const SPLASH_DURATION = 2500;

export default function SplashScreen() {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de entrada (fade in)
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: duration.slow,
      useNativeDriver: true,
    }).start();

    // Bounce del logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -12,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Barra de progreso
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: SPLASH_DURATION,
      useNativeDriver: false,
    }).start();

    // Navegar a onboarding
    const timer = setTimeout(() => {
      router.replace('/(auth)/onboarding');
    }, SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          { transform: [{ translateY: bounceAnim }] },
        ]}
      >
        <Building2 size={52} color={colors.primary[600]} strokeWidth={1.5} />
      </Animated.View>

      {/* Nombre */}
      <Text style={styles.appName}>SitePro</Text>

      {/* Tagline */}
      <Text style={styles.tagline}>Professional Construction Management</Text>

      {/* Barra de progreso */}
      <View style={styles.progressContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
    width: 96,
    height: 96,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '12deg' }],
    marginBottom: spacing.lg,
    ...shadows.xl,
  },
  appName: {
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.black,
    color: colors.white,
    letterSpacing: -1,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: `${colors.primary[100]}CC`,
    textAlign: 'center',
    marginBottom: spacing['3xl'],
  },
  progressContainer: {
    position: 'absolute',
    bottom: 60,
    width: width * 0.5,
    height: 4,
    backgroundColor: `${colors.white}4D`,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
  },
});
