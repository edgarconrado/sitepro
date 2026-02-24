/**
 * SitePro — useTheme hook
 * Devuelve la paleta correcta según modo elegido + sistema
 */

import { useThemeStore } from '@store/themeStore';
import type { Colors } from '@theme/colors';
import { colors as lightColors } from '@theme/colors';
import { darkColors } from '@theme/darkColors';
import { useColorScheme } from 'react-native';

export function useTheme(): {
  colors: Colors;
  isDark: boolean;
  mode: 'light' | 'dark' | 'system';
} {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const mode = useThemeStore((s) => s.mode);

  const isDark =
    mode === 'dark' ||
    (mode === 'system' && systemScheme === 'dark');

  return {
    colors: isDark ? darkColors : lightColors,
    isDark,
    mode,
  };
}