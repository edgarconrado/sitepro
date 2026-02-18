/**
 * SitePro — Onboarding (3 pantallas)
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '@theme/colors';
import { fontSize, fontWeight, spacing, borderRadius, touchSize } from '@theme/tokens';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    emoji: '🏗️',
    title: 'Gestiona tus Proyectos',
    description:
      'Controla el avance de tus obras en tiempo real. Asigna tareas, revisa el progreso y mantén a tu equipo sincronizado.',
    gradientStart: colors.primary[500],
    gradientEnd: colors.primary[600],
  },
  {
    id: '2',
    emoji: '👥',
    title: 'Colaboración en Tiempo Real',
    description:
      'Comunícate con tu equipo al instante. Comparte actualizaciones, asigna responsabilidades y resuelve problemas rápidamente.',
    gradientStart: colors.purple[500],
    gradientEnd: colors.purple[600],
  },
  {
    id: '3',
    emoji: '📸',
    title: 'Documentación Visual',
    description:
      'Captura el progreso de la obra con fotos geolocalizadas. Mantén un registro visual completo de cada etapa.',
    gradientStart: colors.orange[500],
    gradientEnd: colors.orange[600],
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const goToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex });
      setCurrentIndex(nextIndex);
    } else {
      router.replace('/(auth)/login');
    }
  };

  const skip = () => {
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {/* Illustration card */}
            <View
              style={[
                styles.illustrationCard,
                { backgroundColor: item.gradientStart },
              ]}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>

            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />

      {/* Indicadores de progreso */}
      <View style={styles.dotsContainer}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      {/* Botones */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity onPress={skip} style={styles.skipButton}>
          <Text style={styles.skipText}>Saltar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goToNext}
          style={styles.nextButton}
          activeOpacity={0.85}
        >
          <Text style={styles.nextText}>
            {currentIndex === SLIDES.length - 1 ? 'Comenzar' : 'Siguiente'}
          </Text>
          {currentIndex < SLIDES.length - 1 && (
            <ChevronRight size={20} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingBottom: spacing.xl,
  },
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
  },
  illustrationCard: {
    width: 180,
    height: 180,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emoji: {
    fontSize: 80,
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  description: {
    fontSize: fontSize.lg,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 340,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: borderRadius.full,
  },
  dotActive: {
    width: 32,
    backgroundColor: colors.primary[600],
  },
  dotInactive: {
    width: 8,
    backgroundColor: colors.gray[300],
  },
  buttonsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  skipButton: {
    flex: 1,
    minHeight: touchSize.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  skipText: {
    fontSize: fontSize.base,
    color: colors.gray[500],
    fontWeight: fontWeight.medium,
  },
  nextButton: {
    flex: 1,
    minHeight: touchSize.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.md,
  },
  nextText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
