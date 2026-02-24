/**
 * SitePro — Estados Vacíos Ricos
 * Ilustraciones SVG + mensaje contextual + CTA
 */

import { colors } from '@/theme';
import { useTheme } from '@hooks/useTheme';
import { borderRadius, fontSize, fontWeight, shadows, spacing } from '@theme/tokens';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

// ─── Tipos ────────────────────────────────────────────────────
interface EmptyStateProps {
  title: string;
  subtitle: string;
  cta?: { label: string; onPress: () => void };
  ctaSecondary?: { label: string; onPress: () => void };
  compact?: boolean; // versión pequeña para resultados de búsqueda
}

// ─── Ilustraciones SVG ────────────────────────────────────────

function IlluTasks({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.primary[50]} />
          <Stop offset="1" stopColor={colors.primary[100]} />
        </LinearGradient>
      </Defs>
      {/* Background circle */}
      <Circle cx="60" cy="60" r="55" fill="url(#bg)" />
      {/* Clipboard */}
      <Rect x="30" y="28" width="60" height="70" rx="6" fill={colors.white} stroke={colors.primary[200]} strokeWidth="1.5" />
      {/* Clip top */}
      <Rect x="46" y="22" width="28" height="12" rx="6" fill={colors.primary[300]} />
      {/* Check lines */}
      <Line x1="44" y1="50" x2="76" y2="50" stroke={colors.primary[200]} strokeWidth="2" strokeLinecap="round" />
      <Line x1="44" y1="62" x2="76" y2="62" stroke={colors.primary[200]} strokeWidth="2" strokeLinecap="round" />
      <Line x1="44" y1="74" x2="65" y2="74" stroke={colors.primary[200]} strokeWidth="2" strokeLinecap="round" />
      {/* Checkmark circle */}
      <Circle cx="38" cy="50" r="4" fill={colors.primary[100]} stroke={colors.primary[300]} strokeWidth="1.2" />
      <Circle cx="38" cy="62" r="4" fill={colors.primary[100]} stroke={colors.primary[300]} strokeWidth="1.2" />
      {/* Plus badge */}
      <Circle cx="82" cy="82" r="14" fill={colors.primary[600]} />
      <Line x1="82" y1="76" x2="82" y2="88" stroke={colors.white} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="76" y1="82" x2="88" y2="82" stroke={colors.white} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function IlluPhotos({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <LinearGradient id="pbg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.purple[50]} />
          <Stop offset="1" stopColor="#EDE9FE" />
        </LinearGradient>
      </Defs>
      <Circle cx="60" cy="60" r="55" fill="url(#pbg)" />
      {/* Camera body */}
      <Rect x="22" y="38" width="76" height="52" rx="8" fill={colors.white} stroke="#C4B5FD" strokeWidth="1.5" />
      {/* Viewfinder notch */}
      <Path d="M46 38 L52 28 L68 28 L74 38" fill={colors.white} stroke="#C4B5FD" strokeWidth="1.5" />
      {/* Lens */}
      <Circle cx="60" cy="63" r="16" fill="#EDE9FE" stroke="#A78BFA" strokeWidth="1.5" />
      <Circle cx="60" cy="63" r="10" fill="#DDD6FE" stroke="#8B5CF6" strokeWidth="1" />
      <Circle cx="60" cy="63" r="5" fill={colors.purple[500]} />
      {/* Flash */}
      <Rect x="28" y="45" width="10" height="6" rx="3" fill="#DDD6FE" />
      {/* Sparkle */}
      <Line x1="92" y1="32" x2="92" y2="40" stroke={colors.purple[400]} strokeWidth="2" strokeLinecap="round" />
      <Line x1="88" y1="36" x2="96" y2="36" stroke={colors.purple[400]} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function IlluDocuments({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <LinearGradient id="dbg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.orange[50]} />
          <Stop offset="1" stopColor="#FFEDD5" />
        </LinearGradient>
      </Defs>
      <Circle cx="60" cy="60" r="55" fill="url(#dbg)" />
      {/* Back doc */}
      <Rect x="38" y="28" width="50" height="64" rx="5" fill="#FFEDD5" stroke={colors.orange[300]} strokeWidth="1.5" />
      {/* Front doc */}
      <Rect x="30" y="34" width="50" height="64" rx="5" fill={colors.white} stroke={colors.orange[300]} strokeWidth="1.5" />
      {/* Dog-ear fold */}
      <Path d="M68 34 L80 34 L80 46 Z" fill={colors.orange[100]} stroke={colors.orange[300]} strokeWidth="1" />
      {/* Lines */}
      <Line x1="40" y1="54" x2="70" y2="54" stroke={colors.orange[200]} strokeWidth="2" strokeLinecap="round" />
      <Line x1="40" y1="64" x2="70" y2="64" stroke={colors.orange[200]} strokeWidth="2" strokeLinecap="round" />
      <Line x1="40" y1="74" x2="58" y2="74" stroke={colors.orange[200]} strokeWidth="2" strokeLinecap="round" />
      {/* Badge */}
      <Circle cx="82" cy="84" r="14" fill={colors.orange[500]} />
      <Line x1="82" y1="78" x2="82" y2="90" stroke={colors.white} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="76" y1="84" x2="88" y2="84" stroke={colors.white} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function IlluTeam({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <LinearGradient id="tbg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.success[50] ?? '#F0FDF4'} />
          <Stop offset="1" stopColor="#DCFCE7" />
        </LinearGradient>
      </Defs>
      <Circle cx="60" cy="60" r="55" fill="url(#tbg)" />
      {/* Person 1 (center) */}
      <Circle cx="60" cy="44" r="12" fill="#BBF7D0" stroke={colors.success[400] ?? '#4ADE80'} strokeWidth="1.5" />
      <Ellipse cx="60" cy="70" rx="16" ry="10" fill="#BBF7D0" stroke={colors.success[400] ?? '#4ADE80'} strokeWidth="1.5" />
      {/* Person 2 (left) */}
      <Circle cx="34" cy="50" r="9" fill={colors.white} stroke={colors.success[300] ?? '#86EFAC'} strokeWidth="1.5" />
      <Ellipse cx="34" cy="72" rx="12" ry="8" fill={colors.white} stroke={colors.success[300] ?? '#86EFAC'} strokeWidth="1.5" />
      {/* Person 3 (right) */}
      <Circle cx="86" cy="50" r="9" fill={colors.white} stroke={colors.success[300] ?? '#86EFAC'} strokeWidth="1.5" />
      <Ellipse cx="86" cy="72" rx="12" ry="8" fill={colors.white} stroke={colors.success[300] ?? '#86EFAC'} strokeWidth="1.5" />
      {/* Connect lines */}
      <Line x1="44" y1="58" x2="52" y2="62" stroke={colors.success[300] ?? '#86EFAC'} strokeWidth="1.5" strokeDasharray="3,2" />
      <Line x1="76" y1="58" x2="68" y2="62" stroke={colors.success[300] ?? '#86EFAC'} strokeWidth="1.5" strokeDasharray="3,2" />
    </Svg>
  );
}

function IlluMessages({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <LinearGradient id="mbg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.primary[50]} />
          <Stop offset="1" stopColor="#DBEAFE" />
        </LinearGradient>
      </Defs>
      <Circle cx="60" cy="60" r="55" fill="url(#mbg)" />
      {/* Bubble 1 (big, left) */}
      <Rect x="22" y="30" width="56" height="36" rx="12" fill={colors.primary[100]} stroke={colors.primary[300]} strokeWidth="1.5" />
      <Path d="M30 66 L24 76 L40 66" fill={colors.primary[100]} stroke={colors.primary[300]} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Lines inside bubble 1 */}
      <Line x1="32" y1="44" x2="66" y2="44" stroke={colors.primary[300]} strokeWidth="2" strokeLinecap="round" />
      <Line x1="32" y1="54" x2="56" y2="54" stroke={colors.primary[300]} strokeWidth="2" strokeLinecap="round" />
      {/* Bubble 2 (small, right) */}
      <Rect x="54" y="66" width="44" height="28" rx="10" fill={colors.white} stroke={colors.primary[200]} strokeWidth="1.5" />
      <Path d="M90 94 L98 100 L86 94" fill={colors.white} stroke={colors.primary[200]} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Lines inside bubble 2 */}
      <Line x1="62" y1="77" x2="90" y2="77" stroke={colors.primary[200]} strokeWidth="2" strokeLinecap="round" />
      <Line x1="62" y1="85" x2="80" y2="85" stroke={colors.primary[200]} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function IlluSearch({ size = 100 }: { size?: number }) {
  const { colors, isDark } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="46" fill={colors.gray[100]} />
      {/* Magnifier */}
      <Circle cx="44" cy="44" r="18" fill={colors.white} stroke={colors.gray[300]} strokeWidth="2.5" />
      <Line x1="57" y1="57" x2="72" y2="72" stroke={colors.gray[300]} strokeWidth="4" strokeLinecap="round" />
      {/* X mark inside */}
      <Line x1="38" y1="38" x2="50" y2="50" stroke={colors.gray[300]} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="50" y1="38" x2="38" y2="50" stroke={colors.gray[300]} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function IlluPlans({ size = 120 }: { size?: number }) {
  const { colors, isDark } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <LinearGradient id="plbg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F0F9FF" />
          <Stop offset="1" stopColor="#E0F2FE" />
        </LinearGradient>
      </Defs>
      <Circle cx="60" cy="60" r="55" fill="url(#plbg)" />
      {/* Blueprint sheet */}
      <Rect x="20" y="24" width="80" height="72" rx="5" fill="#0EA5E9" opacity="0.15" stroke="#7DD3FC" strokeWidth="1.5" />
      {/* Grid lines */}
      <Line x1="20" y1="44" x2="100" y2="44" stroke="#BAE6FD" strokeWidth="0.8" />
      <Line x1="20" y1="64" x2="100" y2="64" stroke="#BAE6FD" strokeWidth="0.8" />
      <Line x1="20" y1="84" x2="100" y2="84" stroke="#BAE6FD" strokeWidth="0.8" />
      <Line x1="40" y1="24" x2="40" y2="96" stroke="#BAE6FD" strokeWidth="0.8" />
      <Line x1="60" y1="24" x2="60" y2="96" stroke="#BAE6FD" strokeWidth="0.8" />
      <Line x1="80" y1="24" x2="80" y2="96" stroke="#BAE6FD" strokeWidth="0.8" />
      {/* Floor plan outline */}
      <Rect x="30" y="34" width="60" height="52" rx="2" fill="none" stroke="#0284C7" strokeWidth="2" />
      <Line x1="55" y1="34" x2="55" y2="86" stroke="#0284C7" strokeWidth="1.5" />
      <Line x1="30" y1="60" x2="55" y2="60" stroke="#0284C7" strokeWidth="1.5" />
      {/* Door arcs */}
      <Path d="M55 50 Q62 50 62 57" fill="none" stroke="#38BDF8" strokeWidth="1.2" />
      {/* Plus badge */}
      <Circle cx="85" cy="85" r="14" fill="#0284C7" />
      <Line x1="85" y1="79" x2="85" y2="91" stroke={colors.white} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="79" y1="85" x2="91" y2="85" stroke={colors.white} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function IlluCalendar({ size = 120 }: { size?: number }) {
  const { colors, isDark } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <LinearGradient id="cbg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFF7ED" />
          <Stop offset="1" stopColor="#FFEDD5" />
        </LinearGradient>
      </Defs>
      <Circle cx="60" cy="60" r="55" fill="url(#cbg)" />
      {/* Calendar */}
      <Rect x="20" y="32" width="80" height="68" rx="8" fill={colors.white} stroke={colors.orange[200]} strokeWidth="1.5" />
      <Rect x="20" y="32" width="80" height="22" rx="8" fill={colors.orange[400]} />
      <Rect x="20" y="44" width="80" height="10" fill={colors.orange[400]} />
      {/* Hooks */}
      <Rect x="38" y="26" width="6" height="14" rx="3" fill={colors.orange[300]} />
      <Rect x="76" y="26" width="6" height="14" rx="3" fill={colors.orange[300]} />
      {/* Month text placeholder */}
      <Rect x="44" y="38" width="32" height="8" rx="4" fill={colors.orange[200]} />
      {/* Day dots */}
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <Circle key={i} cx={30 + i * 10} cy="68" r="3.5" fill={i === 3 ? colors.orange[500] : colors.gray[100]} />
      ))}
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <Circle key={i} cx={30 + i * 10} cy="82" r="3.5" fill={colors.gray[100]} />
      ))}
      {[0, 1, 2, 3].map(i => (
        <Circle key={i} cx={30 + i * 10} cy="96" r="3.5" fill={colors.gray[100]} />
      ))}
    </Svg>
  );
}

// ─── Base Empty State ─────────────────────────────────────────
function EmptyBase({
  illustration,
  title,
  subtitle,
  cta,
  ctaSecondary,
  compact,
  accentColor = colors.primary[600],
}: EmptyStateProps & {
  illustration: React.ReactNode;
  accentColor?: string;
}) {
  const { colors, isDark } = useTheme();
  return (
    <View style={[s.wrap, compact && s.wrapCompact]}>
      {!compact && <View style={s.illu}>{illustration}</View>}
      {compact && (
        <View style={s.illuSmall}>
          <IlluSearch size={80} />
        </View>
      )}

      <Text style={[s.title, compact && s.titleCompact]}>{title}</Text>
      <Text style={[s.subtitle, compact && s.subtitleCompact]}>{subtitle}</Text>

      {cta && (
        <TouchableOpacity
          style={[s.cta, { backgroundColor: accentColor }]}
          onPress={cta.onPress}
          activeOpacity={0.85}
        >
          <Text style={s.ctaText}>{cta.label}</Text>
        </TouchableOpacity>
      )}

      {ctaSecondary && (
        <TouchableOpacity
          style={[s.ctaSecondary, { borderColor: accentColor }]}
          onPress={ctaSecondary.onPress}
          activeOpacity={0.85}
        >
          <Text style={[s.ctaSecondaryText, { color: accentColor }]}>{ctaSecondary.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Exports por pantalla ─────────────────────────────────────

export function EmptyTasks(props: EmptyStateProps) {
  const { colors, isDark } = useTheme();
  return (
    <EmptyBase
      {...props}
      illustration={<IlluTasks />}
      accentColor={colors.primary[600]}
    />
  );
}

export function EmptyTasksSearch(props: EmptyStateProps) {
  return <EmptyBase {...props} illustration={null} compact accentColor={colors.primary[600]} />;
}

export function EmptyPhotos(props: EmptyStateProps) {
  const { colors, isDark } = useTheme();
  return (
    <EmptyBase
      {...props}
      illustration={<IlluPhotos />}
      accentColor={colors.purple[600]}
    />
  );
}

export function EmptyDocuments(props: EmptyStateProps) {
  const { colors, isDark } = useTheme();
  return (
    <EmptyBase
      {...props}
      illustration={<IlluDocuments />}
      accentColor={colors.orange[500]}
    />
  );
}

export function EmptyTeam(props: EmptyStateProps) {
  const { colors, isDark } = useTheme();
  return (
    <EmptyBase
      {...props}
      illustration={<IlluTeam />}
      accentColor={colors.success[600] ?? '#16A34A'}
    />
  );
}

export function EmptyMessages(props: EmptyStateProps) {
  const { colors, isDark } = useTheme();
  return (
    <EmptyBase
      {...props}
      illustration={<IlluMessages />}
      accentColor={colors.primary[600]}
    />
  );
}

export function EmptyPlans(props: EmptyStateProps) {
  const { colors, isDark } = useTheme();
  return (
    <EmptyBase
      {...props}
      illustration={<IlluPlans />}
      accentColor="#0284C7"
    />
  );
}

export function EmptyCalendar(props: EmptyStateProps) {
  const { colors, isDark } = useTheme();
  return (
    <EmptyBase
      {...props}
      illustration={<IlluCalendar />}
      accentColor={colors.orange[500]}
    />
  );
}

export function EmptySearch(props: EmptyStateProps) {
  const { colors, isDark } = useTheme();
  return <EmptyBase {...props} illustration={null} compact accentColor={colors.primary[600]} />;
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  wrapCompact: {
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  illu: {
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  illuSmall: {
    marginBottom: spacing.sm,
    opacity: 0.8,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#0F0F0F',
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: fontSize.base,
  },
  subtitle: {
    fontSize: fontSize.body,
    color: '#737373',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  subtitleCompact: {
    fontSize: fontSize.small,
    lineHeight: 18,
  },
  cta: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full ?? 999,
    marginTop: spacing.xs,
    ...shadows.sm,
  },
  ctaText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
  },
  ctaSecondary: {
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full ?? 999,
    borderWidth: 1.5,
    marginTop: spacing.xs,
  },
  ctaSecondaryText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});