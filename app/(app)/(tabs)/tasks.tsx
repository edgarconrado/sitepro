/**
 * SitePro — Tasks Screen
 */

import { EmptySearch, EmptyTasks } from '@/components/ui/EmptyStates';
import { colors } from '@/theme';
import { Avatar } from '@components/ui/Avatar';
import { Badge } from '@components/ui/Badge';
import { ConfirmDialogContainer, useConfirm } from '@components/ui/ConfirmDialog';
import { FAB } from '@components/ui/FAB';
import { TasksScreenSkeleton, useSimulatedLoading } from '@components/ui/Skeletons';
import { useToast } from '@components/ui/Toast';
import { useTheme } from '@hooks/useTheme';
import { useAppStore } from '@store/appStore';
import {
  borderRadius,
  fontSize,
  fontWeight,
  iconSize,
  shadows,
  spacing,
} from '@theme/tokens';
import type { Task, TaskPriority, TaskStatus } from '@types/index';
import {
  formatShortDate,
  getTaskPriorityColors,
  getTaskStatusColors,
} from '@utils/index';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  CheckCircle2 as CheckIcon,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  MapPin,
  Search,
  Users,
  X
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  const { colors, isDark } = useTheme();
  const sc = getTaskStatusColors(status, colors);
  switch (status) {
    case 'Urgente': return <AlertCircle size={size} color={sc.icon} />;
    case 'En Progreso': return <Clock size={size} color={sc.icon} />;
    case 'Pendiente': return <Circle size={size} color={sc.icon} />;
    case 'Completada': return <CheckCircle2 size={size} color={sc.icon} />;
  }
}


// ─── Mock team para asignar ───────────────────────────────────
const TEAM_OPTIONS = [
  { id: '2', name: 'Juan Pérez', initials: 'JP', role: 'Electricista' },
  { id: '3', name: 'María García', initials: 'MG', role: 'Plomero' },
  { id: '4', name: 'Carlos Ruiz', initials: 'CR', role: 'Inspector' },
  { id: '5', name: 'Ana López', initials: 'AL', role: 'Acabados' },
  { id: '6', name: 'Roberto Díaz', initials: 'RD', role: 'Arquitecto' },
  { id: '7', name: 'Laura Morales', initials: 'LM', role: 'Ingeniero' },
];

const PRIORITY_OPTIONS: { label: string; value: TaskPriority; color: string }[] = [
  { label: 'Alta', value: 'Alta', color: colors.error[500] },
  { label: 'Media', value: 'Media', color: colors.warning[500] },
  { label: 'Baja', value: 'Baja', color: colors.gray[400] },
];

const STATUS_OPTIONS: { label: string; value: TaskStatus; color: string }[] = [
  { label: 'Urgente', value: 'Urgente', color: colors.error[500] },
  { label: 'En Progreso', value: 'En Progreso', color: colors.primary[600] },
  { label: 'Pendiente', value: 'Pendiente', color: colors.warning[500] },
];

const LOCATION_OPTIONS = [
  'Piso 1', 'Piso 2', 'Piso 3', 'Piso 4', 'Piso 5',
  'Piso 6', 'Piso 7', 'Piso 8', 'Piso 9', 'Piso 10',
  'Sótano', 'Planta Baja', 'Azotea', 'Fachada Norte',
  'Fachada Sur', 'Cuarto de Máquinas', 'Lobby',
];

interface FormErrors {
  title?: string;
  description?: string;
  assignedTo?: string;
  location?: string;
  deadline?: string;
}

// ─── Selector Row ─────────────────────────────────────────────
function SelectorRow({
  label, value, placeholder, onPress, error,
}: { label: string; value: string; placeholder: string; onPress: () => void; error?: string }) {
  return (
    <View style={form.fieldWrapper}>
      <Text style={form.label}>{label}</Text>
      <TouchableOpacity
        style={[form.selectorBtn, !!error && form.inputError]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={value ? form.selectorValue : form.selectorPlaceholder} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <ChevronDown size={16} color={colors.gray[400]} />
      </TouchableOpacity>
      {error && <Text style={form.errorText}>{error}</Text>}
    </View>
  );
}

// ─── Options Sheet ────────────────────────────────────────────
function OptionsSheet<T extends string>({
  visible, title, options, selected, onSelect, onClose, renderItem,
}: {
  visible: boolean;
  title: string;
  options: T[];
  selected: T | null;
  onSelect: (v: T) => void;
  onClose: () => void;
  renderItem?: (opt: T) => React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={sheet.overlay}>
        <View style={sheet.container}>
          <View style={sheet.header}>
            <Text style={sheet.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={iconSize.md} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[sheet.option, selected === opt && sheet.optionSelected]}
                onPress={() => { onSelect(opt); onClose(); }}
                activeOpacity={0.8}
              >
                {renderItem ? renderItem(opt) : (
                  <Text style={[sheet.optionText, selected === opt && sheet.optionTextSelected]}>
                    {opt}
                  </Text>
                )}
                {selected === opt && <CheckIcon size={16} color={colors.primary[600]} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── New Task Modal ───────────────────────────────────────────
function NewTaskModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { addTask, currentProjectId } = useAppStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Media');
  const [status, setStatus] = useState<TaskStatus>('Pendiente');
  const [assignedTo, setAssignedTo] = useState<typeof TEAM_OPTIONS[0] | null>(null);
  const [location, setLocation] = useState('');
  const [deadline, setDeadline] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  // Sheet visibility
  const [showTeam, setShowTeam] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const resetForm = useCallback(() => {
    setTitle(''); setDescription(''); setPriority('Media');
    setStatus('Pendiente'); setAssignedTo(null);
    setLocation(''); setDeadline(''); setErrors({});
  }, []);

  const handleClose = () => { resetForm(); onClose(); };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!title.trim()) e.title = 'El título es requerido';
    if (!description.trim()) e.description = 'La descripción es requerida';
    if (!assignedTo) e.assignedTo = 'Selecciona un responsable';
    if (!location) e.location = 'Selecciona una ubicación';
    if (!deadline.trim()) e.deadline = 'Ingresa una fecha límite (dd/mm/aaaa)';
    else {
      const parts = deadline.split('/');
      if (parts.length !== 3 || parts.some(p => isNaN(Number(p)))) {
        e.deadline = 'Formato inválido. Usa dd/mm/aaaa';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || !assignedTo) return;

    const [day, month, year] = deadline.split('/');
    const isoDeadline = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    const newTask: Task = {
      id: Date.now().toString(),
      projectId: currentProjectId,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      location,
      createdAt: new Date().toISOString(),
      deadline: isoDeadline,
      assignedTo: {
        id: assignedTo.id,
        name: assignedTo.name,
        email: `${assignedTo.name.split(' ')[0].toLowerCase()}@sitepro.com`,
        role: assignedTo.role as any,
        initials: assignedTo.initials,
        isOnline: true,
        activeTasks: 1,
      },
    };

    addTask(newTask);
    handleClose();
  };

  const formatDeadlineInput = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 2) formatted = digits.slice(0, 2) + '/' + digits.slice(2);
    if (digits.length > 4) formatted = formatted.slice(0, 5) + '/' + digits.slice(4);
    setDeadline(formatted);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={nModal.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <View style={nModal.sheet}>
            {/* Header */}
            <View style={nModal.header}>
              <TouchableOpacity onPress={handleClose} style={nModal.cancelBtn}>
                <Text style={nModal.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={nModal.headerTitle}>Nueva Tarea</Text>
              <TouchableOpacity onPress={handleSubmit} style={nModal.saveBtn}>
                <Text style={nModal.saveText}>Guardar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={nModal.body}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Título */}
              <View style={form.fieldWrapper}>
                <Text style={form.label}>Título *</Text>
                <TextInput
                  style={[form.input, !!errors.title && form.inputError]}
                  placeholder="Ej: Revisar instalación eléctrica piso 5"
                  placeholderTextColor={colors.gray[400]}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />
                {errors.title && <Text style={form.errorText}>{errors.title}</Text>}
                <Text style={form.charCount}>{title.length}/100</Text>
              </View>

              {/* Descripción */}
              <View style={form.fieldWrapper}>
                <Text style={form.label}>Descripción *</Text>
                <TextInput
                  style={[form.input, form.textArea, !!errors.description && form.inputError]}
                  placeholder="Describe el trabajo a realizar..."
                  placeholderTextColor={colors.gray[400]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  textAlignVertical="top"
                />
                {errors.description && <Text style={form.errorText}>{errors.description}</Text>}
                <Text style={form.charCount}>{description.length}/500</Text>
              </View>

              {/* Prioridad + Estado */}
              <View style={form.row}>
                <View style={{ flex: 1 }}>
                  <Text style={form.label}>Prioridad</Text>
                  <TouchableOpacity
                    style={form.selectorBtn}
                    onPress={() => setShowPriority(true)}
                    activeOpacity={0.8}
                  >
                    <View style={[form.priorityDot, {
                      backgroundColor: PRIORITY_OPTIONS.find(p => p.value === priority)?.color
                    }]} />
                    <Text style={form.selectorValue}>{priority}</Text>
                    <ChevronDown size={14} color={colors.gray[400]} />
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={form.label}>Estado</Text>
                  <TouchableOpacity
                    style={form.selectorBtn}
                    onPress={() => setShowStatus(true)}
                    activeOpacity={0.8}
                  >
                    <View style={[form.priorityDot, {
                      backgroundColor: STATUS_OPTIONS.find(s => s.value === status)?.color
                    }]} />
                    <Text style={form.selectorValue} numberOfLines={1}>{status}</Text>
                    <ChevronDown size={14} color={colors.gray[400]} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Asignado a */}
              <SelectorRow
                label="Asignado a *"
                value={assignedTo ? `${assignedTo.name} — ${assignedTo.role}` : ''}
                placeholder="Selecciona un responsable"
                onPress={() => setShowTeam(true)}
                error={errors.assignedTo}
              />

              {/* Ubicación */}
              <SelectorRow
                label="Ubicación *"
                value={location}
                placeholder="Selecciona una ubicación"
                onPress={() => setShowLocation(true)}
                error={errors.location}
              />

              {/* Fecha límite */}
              <View style={form.fieldWrapper}>
                <Text style={form.label}>Fecha límite * (dd/mm/aaaa)</Text>
                <TextInput
                  style={[form.input, !!errors.deadline && form.inputError]}
                  placeholder="ej: 28/02/2026"
                  placeholderTextColor={colors.gray[400]}
                  value={deadline}
                  onChangeText={formatDeadlineInput}
                  keyboardType="numeric"
                  maxLength={10}
                />
                {errors.deadline && <Text style={form.errorText}>{errors.deadline}</Text>}
              </View>

              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* Sub-sheets */}
      <OptionsSheet
        visible={showTeam}
        title="Asignar a"
        options={TEAM_OPTIONS.map(m => m.id)}
        selected={assignedTo?.id ?? null}
        onSelect={(id) => setAssignedTo(TEAM_OPTIONS.find(m => m.id === id)!)}
        onClose={() => setShowTeam(false)}
        renderItem={(id) => {
          const m = TEAM_OPTIONS.find(t => t.id === id)!;
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
              <View style={sheet.avatarCircle}>
                <Text style={sheet.avatarText}>{m.initials}</Text>
              </View>
              <View>
                <Text style={sheet.optionText}>{m.name}</Text>
                <Text style={sheet.optionSubtext}>{m.role}</Text>
              </View>
            </View>
          );
        }}
      />

      <OptionsSheet
        visible={showLocation}
        title="Seleccionar ubicación"
        options={LOCATION_OPTIONS as any}
        selected={location as any}
        onSelect={(v) => setLocation(v)}
        onClose={() => setShowLocation(false)}
      />

      <Modal visible={showPriority} transparent animationType="slide">
        <View style={sheet.overlay}>
          <View style={sheet.container}>
            <View style={sheet.header}>
              <Text style={sheet.title}>Prioridad</Text>
              <TouchableOpacity onPress={() => setShowPriority(false)}><X size={iconSize.md} color={colors.gray[600]} /></TouchableOpacity>
            </View>
            {PRIORITY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[sheet.option, priority === opt.value && sheet.optionSelected]}
                onPress={() => { setPriority(opt.value); setShowPriority(false); }}
                activeOpacity={0.8}
              >
                <View style={[form.priorityDot, { backgroundColor: opt.color, width: 12, height: 12 }]} />
                <Text style={[sheet.optionText, priority === opt.value && sheet.optionTextSelected]}>{opt.label}</Text>
                {priority === opt.value && <CheckIcon size={16} color={colors.primary[600]} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={showStatus} transparent animationType="slide">
        <View style={sheet.overlay}>
          <View style={sheet.container}>
            <View style={sheet.header}>
              <Text style={sheet.title}>Estado inicial</Text>
              <TouchableOpacity onPress={() => setShowStatus(false)}><X size={iconSize.md} color={colors.gray[600]} /></TouchableOpacity>
            </View>
            {STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[sheet.option, status === opt.value && sheet.optionSelected]}
                onPress={() => { setStatus(opt.value); setShowStatus(false); }}
                activeOpacity={0.8}
              >
                <View style={[form.priorityDot, { backgroundColor: opt.color, width: 12, height: 12 }]} />
                <Text style={[sheet.optionText, status === opt.value && sheet.optionTextSelected]}>{opt.label}</Text>
                {status === opt.value && <CheckIcon size={16} color={colors.primary[600]} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

function TaskDetailModal({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const { updateTaskStatus, deleteTask } = useAppStore();
  const confirm = useConfirm();
  const toast = useToast();
  if (!task) return null;
  const statusColors = getTaskStatusColors(task.status, colors);
  const priorityColors = getTaskPriorityColors(task.priority, colors);

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
              <TouchableOpacity
                style={tModal.btnDanger}
                activeOpacity={0.85}
                onPress={() => confirm.confirm({
                  title: 'Eliminar tarea',
                  message: `¿Eliminar "${task.title}"? Esta acción no se puede deshacer.`,
                  confirmLabel: 'Sí, eliminar',
                  icon: 'trash',
                  variant: 'danger',
                  onConfirm: () => { try { deleteTask(task.id); toast.success('Tarea eliminada', task.title); onClose(); } catch { toast.error('Error al eliminar', 'Inténtalo de nuevo'); } },
                })}
              >
                <Text style={tModal.btnDangerText}>Eliminar tarea</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      <ConfirmDialogContainer />
    </Modal>
  );
}

function TaskCard({ task, onPress }: { task: Task; onPress: () => void }) {
  const statusColors = task ? getTaskStatusColors(task.status, colors) : {};
  const priorityColors = task ? getTaskPriorityColors(task.priority, colors) : {};

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
  const { colors, isDark } = useTheme();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('Todas');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
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

  const isLoading = useSimulatedLoading();
  if (isLoading) return <TasksScreenSkeleton />;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Filters Header */}
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
      {filtered.length === 0 ? (search
        ? <EmptySearch title="Sin resultados" subtitle={`No se encontraron tareas para "${search}"`} />
        : <EmptyTasks
          title="Sin tareas aquí"
          subtitle="Esta categoría no tiene tareas todavía. Crea la primera para empezar."
          cta={{ label: '+ Nueva tarea', onPress: () => setShowNewTask(true) }}
        />
      )
        : (
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

      <FAB onPress={() => setShowNewTask(true)} />
      <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      <NewTaskModal visible={showNewTask} onClose={() => setShowNewTask(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    ...shadows.sm,
  },
  screenTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: '#0F0F0F', marginBottom: spacing.md },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    height: 40,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: fontSize.body, color: '#0F0F0F', paddingVertical: 0 },
  filtersScroll: { marginHorizontal: -spacing.base },
  filtersContent: { paddingHorizontal: spacing.base, gap: spacing.sm },
  pill: { paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: '#F5F5F5' },
  pillActive: { backgroundColor: '#EAAB00' },
  pillText: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: '#333333' },
  pillTextActive: { color: '#FFFFFF' },
  listContent: { padding: spacing.base, gap: spacing.md, paddingBottom: 100 },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    padding: spacing.base,
    gap: spacing.sm,
    ...shadows.sm,
  },
  taskRow1: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  taskTitle: { flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: '#0F0F0F' },
  taskRow2: { flexDirection: 'row', gap: spacing.sm },
  taskRow3: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.base },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskMetaText: { fontSize: fontSize.small, color: '#737373' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#333333' },
  emptySubtitle: { fontSize: fontSize.body, color: '#737373', textAlign: 'center' },
});

const tModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '90%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base, borderBottomWidth: 1, borderBottomColor: '#E8E8E8' },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#0F0F0F' },
  body: { padding: spacing.base },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  taskTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: '#0F0F0F', flex: 1 },
  badgesRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.base, flexWrap: 'wrap' },
  descCard: { backgroundColor: '#FAFAFA', borderRadius: borderRadius.md, padding: spacing.base, marginBottom: spacing.base },
  descLabel: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: '#333333', marginBottom: spacing.xs },
  descText: { fontSize: fontSize.body, color: '#737373', lineHeight: 20 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  infoCard: { width: '47%', backgroundColor: '#FAFAFA', borderRadius: borderRadius.md, padding: spacing.base, gap: spacing.xs },
  infoLabel: { fontSize: fontSize.small, color: '#737373' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  infoValue: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: '#0F0F0F' },
  actions: { padding: spacing.base, gap: spacing.sm, borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingBottom: 32 },
  btnPrimary: { backgroundColor: '#EAAB00', paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  btnPrimaryText: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: '#FFFFFF' },
  btnSecondary: { backgroundColor: '#F5F5F5', paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  btnSecondaryText: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: '#333333' },
  btnDanger: { backgroundColor: '#FEF2F2', paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  btnDangerText: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: '#EF4444' },
});

// ─── Form Styles ──────────────────────────────────────────────
const form = StyleSheet.create({
  fieldWrapper: { marginBottom: spacing.base },
  label: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    color: '#333333',
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: '#0F0F0F',
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  textArea: { minHeight: 100, paddingTop: spacing.md },
  inputError: { borderColor: '#EF4444', borderWidth: 1.5 },
  errorText: { fontSize: fontSize.small, color: '#EF4444', marginTop: spacing.xs },
  charCount: { fontSize: fontSize.small, color: '#A3A3A3', textAlign: 'right', marginTop: 4 },
  selectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    gap: spacing.sm,
  },
  selectorValue: { flex: 1, fontSize: fontSize.base, color: '#0F0F0F' },
  selectorPlaceholder: { flex: 1, fontSize: fontSize.base, color: '#A3A3A3' },
  priorityDot: { width: 10, height: 10, borderRadius: 5 },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.base },
});

// ─── Sheet Styles ─────────────────────────────────────────────
const sheet = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '60%',
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#0F0F0F' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  optionSelected: { backgroundColor: '#FFFBEB' },
  optionText: { flex: 1, fontSize: fontSize.base, color: '#0F0F0F' },
  optionTextSelected: { color: '#CA8A04', fontWeight: fontWeight.semibold },
  optionSubtext: { fontSize: fontSize.small, color: '#737373' },
  avatarCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EAAB00',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: fontSize.small, fontWeight: fontWeight.bold, color: '#FFFFFF' },
});

// ─── New Task Modal Styles ────────────────────────────────────
const nModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '95%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  headerTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: '#0F0F0F' },
  cancelBtn: { padding: spacing.xs },
  cancelText: { fontSize: fontSize.base, color: '#737373' },
  saveBtn: {
    backgroundColor: '#EAAB00',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
  },
  saveText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: '#FFFFFF' },
  body: { padding: spacing.base },
});