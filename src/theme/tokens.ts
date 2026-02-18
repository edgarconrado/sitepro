/**
 * SitePro — Tokens de Espaciado, Tipografía, Radios y Sombras
 * Basados en Brand Guidelines v1.0 (sistema base de 4px)
 */

// ─── Espaciado (base 4px) ──────────────────────────────────────
export const spacing = {
  xs:   4,   // 0.25rem
  sm:   8,   // 0.5rem
  md:   12,  // 0.75rem
  base: 16,  // 1rem
  lg:   24,  // 1.5rem
  xl:   32,  // 2rem
  '2xl': 48, // 3rem
  '3xl': 64, // 4rem
} as const;

// ─── Tipografía ────────────────────────────────────────────────
export const fontSize = {
  caption: 10, // Badges, tags pequeños
  small:   12, // Metadatos, timestamps
  body:    14, // Texto general
  base:    16, // Body standard
  lg:      18, // Subtítulos, labels grandes
  xl:      20, // Títulos de sección
  '2xl':   24, // Card titles, valores
  '3xl':   30, // Page titles
  '4xl':   36, // Títulos grandes
  '5xl':   48, // Hero / Splash
} as const;

export const fontWeight = {
  regular:   '400',
  medium:    '500',
  semibold:  '600',
  bold:      '700',
  extrabold: '800',
  black:     '900',
} as const;

export const lineHeight = {
  tight:   1.2,
  snug:    1.35,
  normal:  1.5,
  relaxed: 1.625,
  loose:   2,
} as const;

// ─── Border Radius ────────────────────────────────────────────
export const borderRadius = {
  xs:   4,    // Elementos muy pequeños
  sm:   8,    // Botones pequeños, badges, search bar
  md:   12,   // Cards, inputs, botones estándar
  lg:   16,   // Cards grandes, project cards
  xl:   24,   // Bottom sheets, splash elements
  full: 9999, // Avatares, FAB, pills
} as const;

// ─── Tamaños de iconos ────────────────────────────────────────
export const iconSize = {
  xs:  12,
  sm:  16,
  md:  20, // Estándar en UI
  lg:  24, // Bottom nav, acciones
  xl:  32,
  '2xl': 44, // Logo en Login
  '3xl': 48, // Quick action buttons
} as const;

// ─── Alturas de elementos interactivos ───────────────────────
export const touchSize = {
  min:  44, // Mínimo WCAG / Apple HIG
  sm:   40,
  md:   48,
  lg:   56, // FAB
  input: 48,
  button: 52,
  navBar: 64,
} as const;

// ─── Sombras ──────────────────────────────────────────────────
// React Native usa shadowColor, shadowOffset, shadowOpacity, shadowRadius
// + elevation para Android

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  // Sombra con color de marca (para FAB y botones primarios)
  primary: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 6,
  },
  purple: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// ─── Duración de animaciones ──────────────────────────────────
export const duration = {
  fast:   150, // Micro-interacciones (button press)
  base:   200, // Fade in/out
  normal: 300, // Modales, transiciones
  slow:   500, // Splash, onboarding
} as const;

// ─── Z-Index ──────────────────────────────────────────────────
export const zIndex = {
  base:    0,
  raised:  10,
  overlay: 100,
  modal:   200,
  toast:   300,
} as const;
