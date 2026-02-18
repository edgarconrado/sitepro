/**
 * SitePro — Tema Principal
 * Exporta todos los tokens unificados + helpers
 */

import { colors } from './colors';
import {
  spacing,
  fontSize,
  fontWeight,
  lineHeight,
  borderRadius,
  iconSize,
  touchSize,
  shadows,
  duration,
  zIndex,
} from './tokens';

export const theme = {
  colors,
  spacing,
  fontSize,
  fontWeight,
  lineHeight,
  borderRadius,
  iconSize,
  touchSize,
  shadows,
  duration,
  zIndex,
} as const;

export type Theme = typeof theme;

// ─── Re-exports para conveniencia ─────────────────────────────
export { colors } from './colors';
export {
  spacing,
  fontSize,
  fontWeight,
  lineHeight,
  borderRadius,
  iconSize,
  touchSize,
  shadows,
  duration,
  zIndex,
} from './tokens';
