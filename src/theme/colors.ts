/**
 * SitePro — Tema Industrial Negro + Amarillo
 * Estética de construcción: bold, clara, profesional
 */

export const colors = {
  // ─── Primario: Amarillo Construcción ─────────────────────────
  primary: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',   // Amarillo cálido
    600: '#EAAB00',   // Amarillo construcción (main)
    700: '#CA8A04',   // Hover
    800: '#A16207',   // Pressed
    900: '#713F12',
  },

  // ─── Fondo oscuro (negro industrial) ─────────────────────────
  dark: {
    50: '#F7F7F7',
    100: '#EBEBEB',
    200: '#D4D4D4',
    300: '#A3A3A3',
    400: '#737373',
    500: '#525252',
    600: '#333333',
    700: '#1F1F1F',   // Negro suave
    800: '#141414',   // Negro profundo (hero bg)
    900: '#0A0A0A',   // Negro puro
  },

  // ─── Semáforo ─────────────────────────────────────────────────
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    500: '#10B981',
    700: '#047857',
  },
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  purple: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
  },
  orange: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
  },

  // ─── Neutros (grises industriales cálidos) ────────────────────
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E8E8E8',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#333333',
    800: '#1F1F1F',
    900: '#0F0F0F',
  },

  // ─── Base ─────────────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#0A0A0A',
  transparent: 'transparent',

  // ─── Semánticos ───────────────────────────────────────────────
  text: {
    primary: '#0F0F0F',
    secondary: '#333333',
    tertiary: '#737373',
    disabled: '#A3A3A3',
    inverse: '#FFFFFF',
    link: '#CA8A04',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#FAFAFA',
    tertiary: '#F5F5F5',
  },
  border: {
    light: '#F5F5F5',
    default: '#E8E8E8',
    dark: '#D4D4D4',
  },
} as const;

export type Colors = typeof colors;