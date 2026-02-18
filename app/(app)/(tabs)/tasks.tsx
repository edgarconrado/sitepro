/**
 * SitePro — Tasks Screen
 */

import { Avatar } from '@components/ui/Avatar';
import { Badge } from '@components/ui/Badge';
import { FAB } from '@components/ui/FAB';
import { useAppStore } from '@store/appStore';
import { colors } from '@theme/colors';
import {
  borderRadius,
  fontSize,
  fontWeight,
  iconSize,
  shadows,
  spacing,
} from '@theme/tokens';
import type { Task, TaskStatus } from '@types/index';
import {
  formatShortDate,
  getTaskPriorityColors,
  getTaskStatusColors,
} from '@utils/index';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  MapPin,
  Search,
  Users,
  X,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FilterType = 'Todas' | TaskStatus;

const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'Todas', value: 'Todas' },
  { label: 'Urgentes', value: 'Urgente' },
  { label: 'En Progreso', value: 'En Progreso' },
  { label: 'Pendientes', value: 'Pendiente' },
  { label: 'Completadas', value: 'Completada' },
];

function StatusIcon({ status, size = iconSize.md }: { status: TaskStatus; size?: number }) {
  const sc = getTaskStatusColors(status);
  switch (status) {
    case 'Urgente':     return <AlertCircle size={size} color={sc.icon} />;
    case 'En Progreso': return <Clock size={size} color={sc.icon} />;
    case 'Pendiente':   return <Circle size={size} color={sc.icon} />;
    case 'Completada':  return <CheckCircle2 size={size} color={sc.icon} />;
  }
}

function TaskDetailModal({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const { updateTaskStatus } = useAppStore();
  if (!task) return null;
  const statusColors = getTaskStatusColors(task.status);
  const priorityColors = getTaskPriorityColors(task.priority);

  return (
    <Modal visible={!!task} transparent animationType="slide">
      <View style={tModal.overlay}>
        <View style={tModal.sheet}>
          <View style={tModal.header}>
            <Text style={tModal.headerTitle}>Detalle de Tarea</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={iconSize.md} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={tModal.body}>
            <View style={tModal.titleRow}>
              <StatusIcon status={task.status} />
              <Text style={tModal.taskTitle}>{task.title}</Text>
            </View>
            <View style={tModal.badgesRow}>
              <Badge label={task.status} bg={statusColors.bg} textColor={statusColors.text} />
              <Badge label={`Prioridad: ${task.priority}`} bg={priorityColors.bg} textColor={priorityColors.text} />
            </View>
            <View style={tModal.descCard}>
              <Text style={tModal.descLabel}>Descripción</Text>
              <Text style={tModal.descText}>{task.description}</Text>
            </View>
            <View style={tModal.infoGrid}>
              <View style={tModal.infoCard}>
                <Text style={tModal.infoLabel}>Asignado a</Text>
                <View style={tModal.infoRow}>
                  <Avatar initials={task.assignedTo.initials} size={28} />
                  <Text style={tModal.infoValue}>{task.assignedTo.name}</Text>
                </View>
              </View>
              <View style={tModal.infoCard}>
                <Text style={tModal.infoLabel}>Fecha límite</Text>
                <View style={tModal.infoRow}>
                  <Calendar size={14} color={colors.gray[500]} />
                  <Text style={tModal.infoValue}>{formatShortDate(task.deadline)}</Text>
                </View>
              </View>
              <View style={tModal.infoCard}>
                <Text style={tModal.infoLabel}>Ubicación</Text>
                <View style={tModal.infoRow}>
                  <MapPin size={14} color={colors.gray[500]} />
                  <Text style={tModal.infoValue}>{task.location}</Text>
                </View>
              </View>
              <View style={tModal.infoCard}>
                <Text style={tModal.infoLabel}>Estado actual</Text>
                <Text style={[tModal.infoValue, { color: statusColors.text }]}>{task.status}</Text>
              </View>
            </View>
          </ScrollView>
          <View style={tModal.actions}>
            {task.status !== 'Completada' && (
              <TouchableOpacity
                style={tModal.btnPrimary}
                onPress={() => { updateTaskStatus(task.id, 'Completada'); onClose(); }}
                activeOpacity={0.85}
              >
                <CheckCircle2 size={18} color={colors.white} />
                <Text style={tModal.btnPrimaryText}>Marcar como Completada</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={tModal.btnSecondary} onPress={onClose} activeOpacity={0.85}>
              <Text style={tModal.btnSecondaryText}>Cerrar</Text>
            </TouchableOpacity>
            {task.status !== 'Completada' && (
              <TouchableOpacity style={tModal.btnDanger} activeOpacity={0.85}>
                <Text style={tModal.btnDangerText}>Eliminar tarea</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TaskCard({ task, onPress }: { task: Task; onPress: () => void }) {
  const statusColors = getTaskStatusColors(task.status);
  const priorityColors = getTaskPriorityColors(task.priority);

  return (
    <TouchableOpacity style={styles.taskCard} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.taskRow1}>
        <StatusIcon status={task.status} />
        <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
        <ChevronRight size={iconSize.sm} color={colors.gray[400]} />
      </View>
      <View style={styles.taskRow2}>
        <Badge label={task.status} bg={statusColors.bg} textColor={statusColors.text} />
        <Badge label={task.priority} bg={priorityColors.bg} textColor={priorityColors.text} />
      </View>
      <View style={styles.taskRow3}>
        <View style={styles.taskMeta}>
          <Users size={12} color={colors.gray[400]} />
          <Text style={styles.taskMetaText}>{task.assignedTo.name}</Text>
        </View>
        <View style={styles.taskMeta}>
          <MapPin size={12} color={colors.gray[400]} />
          <Text style={styles.taskMetaText}>{task.location}</Text>
        </View>
        <View style={styles.taskMeta}>
          <Calendar size={12} color={colors.gray[400]} />
          <Text style={styles.taskMetaText}>{formatShortDate(task.deadline)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TasksScreen() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('Todas');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { tasks, currentProjectId } = useAppStore();

  const counts = useMemo(() => {
    const all = tasks.filter((t) => t.projectId === currentProjectId);
    return {
      Todas: all.length,
      Urgente: all.filter((t) => t.status === 'Urgente').length,
      'En Progreso': all.filter((t) => t.status === 'En Progreso').length,
      Pendiente: all.filter((t) => t.status === 'Pendiente').length,
      Completada: all.filter((t) => t.status === 'Completada').length,
    };
  }, [tasks, currentProjectId]);

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => t.projectId === currentProjectId)
      .filter((t) => activeFilter === 'Todas' || t.status === activeFilter)
      .filter((t) =>
        search.trim() === '' ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.assignedTo.name.toLowerCase().includes(search.toLowerCase()) ||
        t.location.toLowerCase().includes(search.toLowerCase())
      );
  }, [tasks, currentProjectId, activeFilter, search]);

  const getFilterLabel = (f: { label: string; value: FilterType }) => {
    const count = f.value === 'Todas' ? counts.Todas : counts[f.value as TaskStatus] ?? 0;
    return `${f.label} (${count})`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Sticky Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Tareas</Text>
        <View style={styles.searchContainer}>
          <Search size={iconSize.sm} color={colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar tareas..."
            placeholderTextColor={colors.gray[400]}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={14} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent} style={styles.filtersScroll}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              onPress={() => setActiveFilter(f.value)}
              style={[styles.pill, activeFilter === f.value && styles.pillActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.pillText, activeFilter === f.value && styles.pillTextActive]}>
                {getFilterLabel(f)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Task List */}
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <AlertTriangle size={40} color={colors.gray[300]} />
          <Text style={styles.emptyTitle}>Sin resultados</Text>
          <Text style={styles.emptySubtitle}>
            {search ? `No se encontraron tareas para "${search}"` : 'No hay tareas en esta categoría'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TaskCard task={item} onPress={() => setSelectedTask(item)} />
          )}
        />
      )}

      <FAB onPress={() => {}} />
      <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background.secondary },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    ...shadows.sm,
  },
  screenTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.text.primary, marginBottom: spacing.md },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    height: 40,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: fontSize.body, color: colors.text.primary, paddingVertical: 0 },
  filtersScroll: { marginHorizontal: -spacing.base },
  filtersContent: { paddingHorizontal: spacing.base, gap: spacing.sm },
  pill: { paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.gray[100] },
  pillActive: { backgroundColor: colors.primary[600] },
  pillText: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: colors.gray[700] },
  pillTextActive: { color: colors.white },
  listContent: { padding: spacing.base, gap: spacing.md, paddingBottom: 100 },
  taskCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[100],
    padding: spacing.base,
    gap: spacing.sm,
    ...shadows.sm,
  },
  taskRow1: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  taskTitle: { flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text.primary },
  taskRow2: { flexDirection: 'row', gap: spacing.sm },
  taskRow3: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.base },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskMetaText: { fontSize: fontSize.small, color: colors.gray[500] },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text.secondary },
  emptySubtitle: { fontSize: fontSize.body, color: colors.text.tertiary, textAlign: 'center' },
});

const tModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '90%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.gray[200] },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text.primary },
  body: { padding: spacing.base },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  taskTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text.primary, flex: 1 },
  badgesRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.base, flexWrap: 'wrap' },
  descCard: { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, padding: spacing.base, marginBottom: spacing.base },
  descLabel: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: colors.text.secondary, marginBottom: spacing.xs },
  descText: { fontSize: fontSize.body, color: colors.text.tertiary, lineHeight: 20 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  infoCard: { width: '47%', backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, padding: spacing.base, gap: spacing.xs },
  infoLabel: { fontSize: fontSize.small, color: colors.text.tertiary },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  infoValue: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: colors.text.primary },
  actions: { padding: spacing.base, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.gray[100], paddingBottom: 32 },
  btnPrimary: { backgroundColor: colors.primary[600], paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  btnPrimaryText: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.white },
  btnSecondary: { backgroundColor: colors.gray[100], paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  btnSecondaryText: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.text.secondary },
  btnDanger: { backgroundColor: colors.error[50], paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  btnDangerText: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.error[500] },
});