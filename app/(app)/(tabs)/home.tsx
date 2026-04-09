/**
 * SitePro — Home Dashboard (conectado a Supabase)
 */
import { ScreenEntrance } from '@components/ui/Animated';
import { HomeScreenSkeleton } from '@components/ui/Skeletons';
import {
  ActivityFeed,
  ProjectCard,
  ProjectSelectorModal,
  QuickActions,
  UrgentTasksList,
} from '@features/home';
import type { ActivityItem } from '@features/home/ActivityFeed';
import { TaskDetailModal } from '@features/tasks';
import { useTheme } from '@hooks/useTheme';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@store/authStore';
import { useProjectsStore } from '@store/projectsStore';
import { useTasksStore, type DbTask } from '@store/tasksStore';
import { spacing } from '@theme/tokens';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


async function fetchActivity(projectId: string): Promise<ActivityItem[]> {
  const { data } = await supabase
    .from('activity_log')
    .select('id, action, resource_type, description, created_at, profiles(full_name)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(10);

  return (data ?? []).map((a: any) => {
    const who = a.profiles?.full_name ?? 'Alguien';
    const type = a.resource_type === 'photos' ? 'photo_uploaded'
      : a.action === 'completed' ? 'task_completed'
        : 'task_assigned';
    return {
      id: a.id,
      type,
      title: type === 'photo_uploaded' ? 'Foto subida'
        : type === 'task_completed' ? 'Tarea completada'
          : 'Actividad reciente',
      description: a.description
        ? `${who} — ${a.description}`
        : `${who} ${a.action} ${a.resource_type}`,
      timestamp: a.created_at,
    };
  });
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const { currentProjectId, loadProjects, currentProject } = useProjectsStore();
  const { tasks, loadTasks } = useTasksStore();

  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [selectedTask, setSelectedTask] = useState<DbTask | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const project = currentProject();
  const urgentTasks = tasks.filter(t => t.status === 'urgent' || t.status === 'in_progress').slice(0, 5);

  const load = useCallback(async () => {
    await loadProjects();
    const projectId = useProjectsStore.getState().currentProjectId;
    if (projectId) {
      await loadTasks(projectId);
      const act = await fetchActivity(projectId);
      setActivity(act);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  // Recargar tareas y actividad cuando cambia el proyecto
  useEffect(() => {
    if (currentProjectId) {
      loadTasks(currentProjectId);
      fetchActivity(currentProjectId).then(setActivity);
    }
  }, [currentProjectId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary[500]}
            />
          }
        >
          {/* Proyecto activo */}
          <ProjectCard project={project} onPress={() => setShowProjectSelector(true)} />

          {/* Acciones rápidas */}
          <QuickActions />

          {/* Tareas urgentes / en progreso */}
          <UrgentTasksList tasks={urgentTasks} onTaskPress={setSelectedTask} />

          {/* Actividad reciente */}
          <ActivityFeed items={activity} />
        </ScrollView>
      </ScreenEntrance>

      <ProjectSelectorModal
        visible={showProjectSelector}
        onClose={() => setShowProjectSelector(false)}
      />
      <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingVertical: spacing.base, gap: spacing.base, paddingBottom: 40 },
});