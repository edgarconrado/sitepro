/**
 * SitePro — Home Dashboard
 * Orquesta subcomponentes de src/features/home/
 */
import { ScreenEntrance } from '@components/ui/Animated';
import { HomeScreenSkeleton, useSimulatedLoading } from '@components/ui/Skeletons';
import { useSyncStore } from '@components/ui/SyncManager';
import { useToast } from '@components/ui/Toast';
import {
  ActivityFeed,
  ProjectCard,
  ProjectSelectorModal,
  QuickActions,
  UrgentTasksList,
} from '@features/home';
import { TaskDetailModal } from '@features/tasks';
import { useTheme } from '@hooks/useTheme';
import { useAppStore } from '@store/appStore';
import { fontSize, fontWeight, spacing } from '@theme/tokens';
import type { Task } from '@types/index';
import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { currentProject, urgentTasks, activity } = useAppStore();
  const project = currentProject();
  const urgent = urgentTasks();

  // Demo utilities (remove in production)
  const toast = useToast();
  const sync = useSyncStore();

  const isLoading = useSimulatedLoading();
  if (isLoading) return <HomeScreenSkeleton />;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background.secondary }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background.secondary}
      />

      <ScreenEntrance>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.content}
        >
          {/* Project card */}
          <ProjectCard project={project} onPress={() => setShowProjectSelector(true)} />

          {/* Quick actions */}
          <QuickActions />

          {/* Urgent tasks */}
          <UrgentTasksList tasks={urgent} onTaskPress={setSelectedTask} />

          {/* Activity feed */}
          <ActivityFeed items={activity} />

          {/* ── Demo toasts/sync (quitar en producción) ── */}
          <DemoSection toast={toast} sync={sync} colors={colors} />
        </ScrollView>
      </ScreenEntrance>

      <ProjectSelectorModal visible={showProjectSelector} onClose={() => setShowProjectSelector(false)} />
      <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
    </SafeAreaView>
  );
}

function DemoSection({ toast, sync, colors }: any) {
  return (
    <View style={[s.demo, { backgroundColor: colors.background.primary }]}>
      <Text style={[s.demoTitle, { color: colors.text.tertiary }]}>Demo — Sistema de notificaciones</Text>
      <View style={s.demoRow}>
        {[
          { label: '✓ Éxito', bg: colors.success[500], fn: () => toast.success('Cambios guardados', 'El proyecto fue actualizado') },
          { label: '✕ Error', bg: colors.error[500], fn: () => toast.error('Error al guardar', 'Intenta de nuevo más tarde') },
          { label: '⚠ Aviso', bg: colors.warning[500], fn: () => toast.warning('Permiso por vencer', 'Vence en 5 días') },
          { label: 'ℹ Info', bg: colors.primary[500], fn: () => toast.info('Nueva actualización', 'v2.1 disponible') },
        ].map(({ label, bg, fn }) => (
          <TouchableOpacity key={label} style={[s.demoBtn, { backgroundColor: bg }]} onPress={fn} activeOpacity={0.8}>
            <Text style={s.demoBtnText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={[s.demoBtn, { backgroundColor: colors.dark[700], width: '100%' }]} onPress={() => sync.mockSave()} activeOpacity={0.8}>
        <Text style={s.demoBtnText}>☁ Simular sincronización</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingVertical: spacing.base, gap: spacing.base, paddingBottom: 40 },
  demo: { margin: spacing.base, borderRadius: 12, padding: spacing.base, gap: spacing.sm },
  demoTitle: { fontSize: fontSize.small, fontWeight: fontWeight.medium, textAlign: 'center', marginBottom: spacing.xs },
  demoRow: { flexDirection: 'row', gap: spacing.sm },
  demoBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: 8, alignItems: 'center' },
  demoBtnText: { fontSize: 11, fontWeight: fontWeight.semibold, color: '#FFFFFF' },
});