/**
 * SitePro — Skeleton Loaders
 * Placeholders animados para todas las pantallas principales
 */

import { ShimmerBox } from '@components/ui/Animated';
import { useTheme } from '@hooks/useTheme';
import { borderRadius, spacing } from '@theme/tokens';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - spacing.base * 2;

// ─── Primitive blocks ─────────────────────────────────────────

function SBox({ w, h, r = 8, style }: { w: number | string; h: number; r?: number; style?: object }) {
  const { colors, isDark } = useTheme();
  return <ShimmerBox width={w} height={h} borderRadius={r} style={style} />;
}

function Row({ children, gap = 8, style }: { children: React.ReactNode; gap?: number; style?: object }) {
  const { colors, isDark } = useTheme();
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

function Col({ children, gap = 8, style }: { children: React.ReactNode; gap?: number; style?: object }) {
  const { colors, isDark } = useTheme();
  return <View style={[{ flexDirection: 'column', gap }, style]}>{children}</View>;
}

// ─── Shared: section header ────────────────────────────────────
function SectionHeaderSkeleton() {
  const { colors, isDark } = useTheme();
  return (
    <Row style={{ justifyContent: 'space-between', marginBottom: spacing.md }}>
      <SBox w={120} h={16} r={6} />
      <SBox w={60} h={12} r={6} />
    </Row>
  );
}

// ─── HOME skeleton ────────────────────────────────────────────
function ProjectCardSkeleton() {
  const { colors, isDark } = useTheme();
  return (
    <View style={sk.projectCard}>
      <SBox w={100} h={12} r={4} style={{ opacity: 0.5 }} />
      <SBox w={220} h={22} r={6} style={{ marginTop: 6 }} />
      <Row style={{ marginTop: spacing.md, gap: spacing.sm }}>
        {[0, 1, 2].map(i => (
          <View key={i} style={sk.metricCard}>
            <SBox w={32} h={18} r={4} />
            <SBox w={50} h={10} r={4} style={{ marginTop: 4 }} />
          </View>
        ))}
      </Row>
      <View style={sk.progressBar}>
        <SBox w="100%" h={6} r={3} />
      </View>
    </View>
  );
}

function TaskCardSkeleton() {
  const { colors, isDark } = useTheme();
  return (
    <View style={sk.taskCard}>
      <View style={sk.taskLeft}>
        <SBox w={32} h={32} r={16} />
        <Col gap={6} style={{ flex: 1 }}>
          <SBox w="70%" h={14} r={5} />
          <Row gap={6}>
            <SBox w={60} h={10} r={4} />
            <SBox w={80} h={10} r={4} />
          </Row>
        </Col>
      </View>
      <SBox w={60} h={22} r={11} />
    </View>
  );
}

function QuickActionSkeleton() {
  const { colors, isDark } = useTheme();
  return (
    <View style={sk.quickAction}>
      <SBox w={44} h={44} r={22} />
      <SBox w={48} h={10} r={4} style={{ marginTop: 6 }} />
    </View>
  );
}

export function HomeScreenSkeleton() {
  const { colors, isDark } = useTheme();
  return (
    <ScrollView scrollEnabled={false} contentContainerStyle={sk.screen}>
      {/* Project card */}
      <ProjectCardSkeleton />

      {/* Quick actions */}
      <View style={sk.section}>
        <SectionHeaderSkeleton />
        <Row gap={spacing.base} style={{ justifyContent: 'space-around' }}>
          {[0, 1, 2, 3].map(i => <QuickActionSkeleton key={i} />)}
        </Row>
      </View>

      {/* Tasks */}
      <View style={sk.section}>
        <SectionHeaderSkeleton />
        <Col gap={spacing.sm}>
          {[0, 1, 2].map(i => <TaskCardSkeleton key={i} />)}
        </Col>
      </View>

      {/* Activity */}
      <View style={sk.section}>
        <SectionHeaderSkeleton />
        <Col gap={spacing.sm}>
          {[0, 1].map(i => (
            <Row key={i} style={sk.activityCard}>
              <SBox w={36} h={36} r={18} />
              <Col gap={5} style={{ flex: 1 }}>
                <SBox w="80%" h={13} r={5} />
                <SBox w="50%" h={10} r={4} />
              </Col>
              <SBox w={30} h={10} r={4} />
            </Row>
          ))}
        </Col>
      </View>
    </ScrollView>
  );
}

// ─── TASKS skeleton ───────────────────────────────────────────
function TaskRowSkeleton() {
  const { colors, isDark } = useTheme();
  return (
    <View style={sk.taskCard}>
      <Row gap={spacing.md} style={{ flex: 1 }}>
        <SBox w={36} h={36} r={18} />
        <Col gap={6} style={{ flex: 1 }}>
          <SBox w="75%" h={14} r={5} />
          <Row gap={8}>
            <SBox w={55} h={20} r={10} />
            <SBox w={70} h={20} r={10} />
          </Row>
          <Row gap={6}>
            <SBox w={14} h={14} r={7} />
            <SBox w={90} h={11} r={4} />
          </Row>
        </Col>
      </Row>
      <SBox w={24} h={24} r={12} />
    </View>
  );
}

export function TasksScreenSkeleton() {
  const { colors, isDark } = useTheme();
  return (
    <View style={sk.screen}>
      {/* Filter chips */}
      <Row gap={spacing.sm} style={{ paddingHorizontal: spacing.base, paddingVertical: spacing.sm }}>
        {[80, 70, 90, 65].map((w, i) => <SBox key={i} w={w} h={32} r={16} />)}
      </Row>

      {/* Stats row */}
      <Row gap={spacing.sm} style={{ paddingHorizontal: spacing.base, marginBottom: spacing.md }}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={sk.statChip}>
            <SBox w={24} h={18} r={4} />
            <SBox w={40} h={10} r={4} />
          </View>
        ))}
      </Row>

      <ScrollView scrollEnabled={false} contentContainerStyle={{ paddingHorizontal: spacing.base, gap: spacing.sm }}>
        {[0, 1, 2, 3, 4, 5].map(i => <TaskRowSkeleton key={i} />)}
      </ScrollView>
    </View>
  );
}

// ─── TEAM skeleton ────────────────────────────────────────────
function MemberCardSkeleton() {
  const { colors, isDark } = useTheme();
  return (
    <View style={sk.memberCard}>
      {/* Top */}
      <Row gap={spacing.md} style={{ marginBottom: spacing.md }}>
        <SBox w={52} h={52} r={26} />
        <Col gap={6} style={{ flex: 1 }}>
          <SBox w="65%" h={15} r={5} />
          <SBox w={80} h={20} r={10} />
          <SBox w="50%" h={11} r={4} />
        </Col>
        <SBox w={28} h={28} r={14} />
      </Row>
      {/* Stats row */}
      <Row gap={spacing.sm} style={{ justifyContent: 'space-between', marginBottom: spacing.md }}>
        {[0, 1, 2].map(i => (
          <View key={i} style={sk.memberStat}>
            <SBox w={28} h={18} r={4} />
            <SBox w={40} h={10} r={4} />
          </View>
        ))}
      </Row>
      {/* Actions */}
      <Row gap={spacing.sm}>
        <SBox w="50%" h={36} r={8} />
        <SBox w="50%" h={36} r={8} style={{ flex: 1 }} />
      </Row>
    </View>
  );
}

export function TeamScreenSkeleton() {
  const { colors, isDark } = useTheme();
  return (
    <View style={sk.screen}>
      {/* Search bar */}
      <View style={{ paddingHorizontal: spacing.base, paddingVertical: spacing.sm }}>
        <SBox w="100%" h={44} r={12} />
      </View>
      {/* Filter chips */}
      <Row gap={spacing.sm} style={{ paddingHorizontal: spacing.base, marginBottom: spacing.md }}>
        {[60, 80, 70, 90].map((w, i) => <SBox key={i} w={w} h={30} r={15} />)}
      </Row>
      <ScrollView scrollEnabled={false} contentContainerStyle={{ paddingHorizontal: spacing.base, gap: spacing.md }}>
        {[0, 1, 2].map(i => <MemberCardSkeleton key={i} />)}
      </ScrollView>
    </View>
  );
}

// ─── DOCUMENTS skeleton ───────────────────────────────────────
function DocCardSkeleton() {
  const { colors, isDark } = useTheme();
  return (
    <View style={sk.docCard}>
      <Row gap={spacing.md} style={{ flex: 1 }}>
        <SBox w={44} h={44} r={8} />
        <Col gap={6} style={{ flex: 1 }}>
          <SBox w="75%" h={14} r={5} />
          <Row gap={6}>
            <SBox w={50} h={18} r={9} />
            <SBox w={60} h={18} r={9} />
          </Row>
          <Row gap={spacing.lg}>
            <SBox w={80} h={10} r={4} />
            <SBox w={60} h={10} r={4} />
          </Row>
        </Col>
      </Row>
      <SBox w={20} h={20} r={10} />
    </View>
  );
}

export function DocumentsScreenSkeleton() {
  const { colors, isDark } = useTheme();
  return (
    <View style={sk.screen}>
      {/* Search */}
      <View style={{ paddingHorizontal: spacing.base, paddingVertical: spacing.sm }}>
        <SBox w="100%" h={44} r={12} />
      </View>
      {/* Category tabs */}
      <Row gap={spacing.sm} style={{ paddingHorizontal: spacing.base, marginBottom: spacing.md }}>
        {[55, 80, 100, 70].map((w, i) => <SBox key={i} w={w} h={32} r={16} />)}
      </Row>
      {/* Section label */}
      <View style={{ paddingHorizontal: spacing.base, marginBottom: spacing.sm }}>
        <SBox w={100} h={12} r={4} />
      </View>
      <ScrollView scrollEnabled={false} contentContainerStyle={{ paddingHorizontal: spacing.base, gap: spacing.sm }}>
        {[0, 1, 2, 3, 4].map(i => <DocCardSkeleton key={i} />)}
      </ScrollView>
    </View>
  );
}

// ─── PHOTOS skeleton ──────────────────────────────────────────
function PhotoGridSkeleton() {
  const { colors, isDark } = useTheme();
  const CELL = (SCREEN_W - spacing.base * 2 - spacing.sm * 2) / 3;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.base }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <SBox key={i} w={CELL} h={CELL} r={8} />
      ))}
    </View>
  );
}

export function PhotosScreenSkeleton() {
  const { colors, isDark } = useTheme();
  return (
    <View style={sk.screen}>
      {/* Zone filter */}
      <Row gap={spacing.sm} style={{ paddingHorizontal: spacing.base, paddingVertical: spacing.sm }}>
        {[55, 70, 80, 65, 75].map((w, i) => <SBox key={i} w={w} h={30} r={15} />)}
      </Row>
      {/* Stats */}
      <Row gap={spacing.md} style={{ paddingHorizontal: spacing.base, marginBottom: spacing.md }}>
        <SBox w={80} h={12} r={4} />
        <SBox w={60} h={12} r={4} />
      </Row>
      <PhotoGridSkeleton />
    </View>
  );
}

// ─── Generic list skeleton (Messages etc) ────────────────────
function MessageRowSkeleton() {
  const { colors, isDark } = useTheme();
  return (
    <Row style={sk.messageRow} gap={spacing.md}>
      <SBox w={46} h={46} r={23} />
      <Col gap={6} style={{ flex: 1 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <SBox w="50%" h={14} r={5} />
          <SBox w={35} h={10} r={4} />
        </Row>
        <SBox w="85%" h={12} r={4} />
      </Col>
    </Row>
  );
}

export function MessagesScreenSkeleton() {
  const { colors, isDark } = useTheme();
  return (
    <View style={sk.screen}>
      <View style={{ paddingHorizontal: spacing.base, paddingVertical: spacing.sm }}>
        <SBox w="100%" h={44} r={12} />
      </View>
      <ScrollView scrollEnabled={false}>
        {[0, 1, 2, 3, 4, 5].map(i => <MessageRowSkeleton key={i} />)}
      </ScrollView>
    </View>
  );
}

// ─── Hook: simulated loading ──────────────────────────────────
/**
 * Simula un estado de carga para demostrar el skeleton.
 * Al conectar la API real, reemplazar por el estado real del fetch.
 */
export function useSimulatedLoading(duration = 1800): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), duration);
    return () => clearTimeout(t);
  }, []);
  return loading;
}

// ─── Styles ───────────────────────────────────────────────────
const sk = StyleSheet.create({
  screen: {
    paddingBottom: spacing.xl,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: spacing.base,
    marginBottom: spacing.sm,
  },

  // Project card
  projectCard: {
    backgroundColor: '#EAAB00',
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  progressBar: {
    marginTop: spacing.md,
  },

  // Task card
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: spacing.base,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },

  // Quick action
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },

  // Activity
  activityCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    justifyContent: 'space-between',
  },

  // Stats chip (tasks)
  statChip: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
  },

  // Member card
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  memberStat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: 4,
  },

  // Doc card
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: spacing.base,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },

  // Message row
  messageRow: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
});