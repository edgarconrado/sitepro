/**
 * SitePro — Tasks Screen
 * Orquesta subcomponentes de src/features/tasks/
 */
import { EmptySearch, EmptyTasks } from '@components/ui/EmptyStates';
import { FAB } from '@components/ui/FAB';
import { FilterBar } from '@components/ui/FilterBar';
import { TasksScreenSkeleton, useSimulatedLoading } from '@components/ui/Skeletons';
import {
  NewTaskModal,
  TaskCard,
  TaskDetailModal,
  useTaskFilters,
} from '@features/tasks';
import { useTheme } from '@hooks/useTheme';
import { borderRadius, fontSize, fontWeight, shadows, spacing } from '@theme/tokens';
import type { Task } from '@types/index';
import { Search, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  FlatList, StatusBar,
  StyleSheet,
  Text,
  TextInput, TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TasksScreen() {
  const { colors, isDark } = useTheme();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);

  const {
    search, setSearch,
    activeFilter, setActiveFilter,
    filtered, filterOptions,
  } = useTaskFilters();

  const isLoading = useSimulatedLoading();
  if (isLoading) return <TasksScreenSkeleton />;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background.secondary }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background.primary}
      />

      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.light }]}>
        <Text style={[s.title, { color: colors.text.primary }]}>Tareas</Text>

        {/* Search */}
        <View style={[s.searchBox, { borderColor: colors.border.dark, backgroundColor: colors.background.primary }]}>
          <Search size={16} color={colors.text.disabled} />
          <TextInput
            style={[s.searchInput, { color: colors.text.primary }]}
            placeholder="Buscar tareas..."
            placeholderTextColor={colors.text.disabled}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={14} color={colors.text.disabled} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter pills */}
        <FilterBar
          options={filterOptions}
          active={activeFilter}
          onChange={setActiveFilter}
        />
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        search
          ? <EmptySearch
            title="Sin resultados"
            subtitle={`No hay tareas para "${search}"`}
          />
          : <EmptyTasks
            title="Sin tareas aquí"
            subtitle="Esta categoría no tiene tareas. Crea la primera para empezar."
            cta={{ label: '+ Nueva tarea', onPress: () => setShowNewTask(true) }}
          />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TaskCard task={item} onPress={() => setSelectedTask(item)} />
          )}
        />
      )}

      <FAB onPress={() => setShowNewTask(true)} />

      <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      <NewTaskModal visible={showNewTask} onClose={() => setShowNewTask(false)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingTop: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, ...shadows.sm },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, marginBottom: spacing.md, paddingHorizontal: spacing.base },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, height: 40, marginBottom: spacing.sm, gap: spacing.sm, marginHorizontal: spacing.base },
  searchInput: { flex: 1, fontSize: fontSize.body, paddingVertical: 0 },
  list: { padding: spacing.base, gap: spacing.md, paddingBottom: 100 },
});