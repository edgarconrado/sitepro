/**
 * SitePro — Paleta Oscura Industrial
 * Negro profundo + amarillo construcción
 */

import type { Colors } from './colors';

export const darkColors: Colors = {
  primary: {
    50:  '#2A2000',
    100: '#3D2E00',
    200: '#5C4500',
    300: '#7A5C00',
    400: '#A07800',
    500: '#C79600',
    600: '#EAAB00',   // Amarillo sigue siendo el acento brillante
    700: '#F5C842',
    800: '#FDE68A',
    900: '#FEF3C7',
  },

  dark: {
    50:  '#F7F7F7',
    100: '#EBEBEB',
    200: '#D4D4D4',
    300: '#A3A3A3',
    400: '#737373',
    500: '#525252',
    600: '#333333',
    700: '#1F1F1F',
    800: '#141414',
    900: '#0A0A0A',
  },

  success: {
    50:  '#052E16',
    100: '#14532D',
    500: '#22C55E',
    700: '#4ADE80',
  },
  error: {
    50:  '#2D0A0A',
    100: '#450A0A',
    500: '#F87171',
    600: '#EF4444',
    700: '#FCA5A5',
  },
  warning: {
    50:  '#2A1A00',
    100: '#3D2700',
    500: '#FCD34D',
    600: '#FBBF24',
    700: '#FDE68A',
  },
  purple: {
    50:  '#1E0A3C',
    100: '#2E1065',
    500: '#A78BFA',
    600: '#8B5CF6',
    700: '#C4B5FD',
  },
  orange: {
    50:  '#2A0F00',
    100: '#431407',
    500: '#FB923C',
    600: '#F97316',
    700: '#FDBA74',
  },

  gray: {
    50:  '#1A1A1A',
    100: '#232323',
    200: '#2E2E2E',
    300: '#404040',
    400: '#5A5A5A',
    500: '#808080',
    600: '#A0A0A0',
    700: '#C0C0C0',
    800: '#E0E0E0',
    900: '#F5F5F5',
  },

  white:       '#1A1A1A',   // "white" = fondo oscuro en dark mode
  black:       '#F5F5F5',   // "black" = texto claro en dark mode
  transparent: 'transparent',

  text: {
    primary:   '#F0F0F0',   // Blanco suave
    secondary: '#C8C8C8',   // Gris claro
    tertiary:  '#888888',   // Gris medio
    disabled:  '#555555',
    inverse:   '#0A0A0A',   // Texto oscuro sobre amarillo
    link:      '#EAAB00',
  },
  background: {
    primary:   '#111111',   // Negro principal
    secondary: '#1A1A1A',   // Negro secundario
    tertiary:  '#232323',   // Negro tarjetas
  },
  border: {
    light:   '#2E2E2E',
    default: '#404040',
    dark:    '#5A5A5A',
  },
};