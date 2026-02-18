/**
 * SitePro — Tokens de Color
 * Basados en Brand Guidelines v1.0
 */

export const colors = {
  // ─── Primarios ───────────────────────────────────────────────
  primary: {
    50:  '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB', // Main brand color
    700: '#1D4ED8',
    800: '#1E40AF', // Hover / dark
    900: '#1E3A8A',
  },

  // ─── Secundarios ─────────────────────────────────────────────
  success: {
    50:  '#ECFDF5',
    100: '#D1FAE5',
    500: '#10B981',
    700: '#047857',
  },
  error: {
    50:  '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    700: '#B91C1C',
  },
  warning: {
    50:  '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    700: '#B45309',
  },
  purple: {
    50:  '#F5F3FF',
    100: '#EDE9FE',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
  },
  orange: {
    50:  '#FFF7ED',
    100: '#FFEDD5',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
  },

  // ─── Neutros ──────────────────────────────────────────────────
  gray: {
    50:  '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // ─── Base ─────────────────────────────────────────────────────
  white:       '#FFFFFF',
  black:       '#000000',
  transparent: 'transparent',

  // ─── Semánticos (alias) ───────────────────────────────────────
  text: {
    primary:   '#111827', // gray.900
    secondary: '#374151', // gray.700
    tertiary:  '#6B7280', // gray.500
    disabled:  '#9CA3AF', // gray.400
    inverse:   '#FFFFFF',
    link:      '#2563EB', // primary.600
  },
  background: {
    primary:   '#FFFFFF',
    secondary: '#F9FAFB', // gray.50
    tertiary:  '#F3F4F6', // gray.100
  },
  border: {
    light:   '#F3F4F6', // gray.100
    default: '#D1D5DB', // gray.300
    dark:    '#9CA3AF', // gray.400
  },
} as const;

export type Colors = typeof colors;
