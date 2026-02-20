/**
 * SitePro — Home Dashboard
 */

import { AnimatedNumber, ScreenEntrance, StaggerItem } from '@components/ui/Animated';
import { Avatar } from '@components/ui/Avatar';
import { Badge } from '@components/ui/Badge';
import { useAppStore } from '@store/appStore';
import { useAuthStore } from '@store/authStore';
import { colors } from '@theme/colors';
import {
  borderRadius,
  fontSize,
  fontWeight,
  iconSize,
  shadows,
  spacing,
} from '@theme/tokens';
import type { Task } from '@types/index';
import {
  formatShortDate,
  getProjectStatusColors,
  getTaskStatusColors,
  timeAgo,
} from '@utils/index';
import {
  AlertCircle,
  Building2,
  Calendar,
  Camera,
  CheckCircle,
  CheckSquare,
  ChevronRight,
  FileText,
  House,
  Map,
  MapPin,
  Plus,
  Settings,
  Users,
  X
} from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
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


// ─── Project + New Project Modal (unified, single Modal) ─────
const STATUS_OPTIONS: ('En Progreso' | 'En Revisión' | 'Pausado')[] = [
  'En Progreso', 'En Revisión', 'Pausado',
];

const STATUS_COLORS_MAP: Record<string, { bg: string; text: string; border: string }> = {
  'En Progreso': { bg: colors.primary[50], text: colors.primary[700], border: colors.primary[400] },
  'En Revisión': { bg: colors.warning[50], text: colors.warning[700], border: colors.warning[400] },
  'Pausado': { bg: colors.gray[100], text: colors.gray[600], border: colors.gray[400] },
};

function ProjectSelectorModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { projects, currentProjectId, setCurrentProject, addProject } = useAppStore();
  const [view, setView] = React.useState<'list' | 'new'>('list');

  // Form state
  const [name, setName] = React.useState('');
  const [client, setClient] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [deadline, setDeadline] = React.useState('');
  const [status, setStatus] = React.useState<'En Progreso' | 'En Revisión' | 'Pausado'>('En Progreso');
  const [teamCount, setTeamCount] = React.useState('');

  React.useEffect(() => {
    if (!visible) {
      setView('list');
      setName(''); setClient(''); setStartDate('');
      setDeadline(''); setStatus('En Progreso'); setTeamCount('');
    }
  }, [visible]);

  const fmtDate = (text: string, setter: (v: string) => void) => {
    const d = text.replace(/[^0-9]/g, '').slice(0, 8);
    let f = d;
    if (d.length > 4) f = d.slice(0, 4) + '-' + d.slice(4);
    if (d.length > 6) f = f.slice(0, 7) + '-' + d.slice(6);
    setter(f);
  };

  const handleSelect = (id: string) => {
    setCurrentProject(id);
    onClose();
  };

  const handleCreate = () => {
    if (!name.trim()) { Alert.alert('Error', 'El nombre es requerido'); return; }
    if (startDate.length < 10) { Alert.alert('Error', 'Fecha de inicio inválida (aaaa-mm-dd)'); return; }
    if (deadline.length < 10) { Alert.alert('Error', 'Fecha de entrega inválida (aaaa-mm-dd)'); return; }

    addProject({
      id: `proj-${Date.now()}`,
      name: name.trim(),
      status,
      progress: 0,
      startDate,
      deadline,
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      urgentTasks: 0,
      teamCount: parseInt(teamCount) || 0,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={modal.overlay}>
          <View style={[modal.sheet, { maxHeight: view === 'new' ? '92%' : '80%' }]}>

            {view === 'list' ? (
              /* ── PROJECT LIST ── */
              <>
                <View style={modal.header}>
                  <Text style={modal.title}>Proyectos</Text>
                  <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <X size={iconSize.md} color={colors.gray[600]} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                  {projects.map((project) => {
                    const isSelected = project.id === currentProjectId;
                    const sc = getProjectStatusColors(project.status);
                    return (
                      <TouchableOpacity
                        key={project.id}
                        onPress={() => handleSelect(project.id)}
                        activeOpacity={0.85}
                        style={[modal.projectCard, isSelected && modal.projectCardSelected]}
                      >
                        <View style={modal.projectHeader}>
                          <Text style={modal.projectName} numberOfLines={1}>{project.name}</Text>
                          <Badge label={project.status} bg={sc.bg} textColor={sc.text} />
                        </View>
                        <View style={modal.projectMeta}>
                          <Text style={modal.projectMetaText}>{project.totalTasks} tareas</Text>
                          <Text style={modal.projectMetaText}>{project.progress}% completado</Text>
                          <Text style={modal.projectMetaText}>Vence: {formatShortDate(project.deadline)}</Text>
                        </View>
                        <View style={modal.progressTrack}>
                          <View style={[modal.progressFill, { width: `${project.progress}%` as any }]} />
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  {/* Botón nuevo proyecto */}
                  <TouchableOpacity
                    style={modal.addProjectBtn}
                    onPress={() => setView('new')}
                    activeOpacity={0.85}
                  >
                    <View style={modal.addProjectIconBg}>
                      <Plus size={22} color={colors.white} strokeWidth={2.5} />
                    </View>
                    <View style={modal.addProjectInfo}>
                      <Text style={modal.addProjectTitle}>Nuevo proyecto</Text>
                      <Text style={modal.addProjectSub}>Crear y configurar un proyecto nuevo</Text>
                    </View>
                    <ChevronRight size={18} color="rgba(255,255,255,0.6)" />
                  </TouchableOpacity>
                </ScrollView>
              </>
            ) : (
              /* ── NEW PROJECT FORM ── */
              <>
                <View style={modal.header}>
                  <TouchableOpacity onPress={() => setView('list')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={modal.cancelText}>← Volver</Text>
                  </TouchableOpacity>
                  <Text style={modal.title}>Nuevo Proyecto</Text>
                  <TouchableOpacity onPress={handleCreate} style={modal.createBtn}>
                    <Text style={modal.createText}>Crear</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={{ padding: spacing.base }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ paddingBottom: 40 }}
                >
                  {/* Hero */}
                  <View style={modal.formHero}>
                    <View style={modal.formHeroIcon}>
                      <Building2 size={30} color={colors.primary[600]} />
                    </View>
                    <Text style={modal.formHeroText}>Completa los datos del proyecto</Text>
                  </View>

                  <Text style={modal.formLabel}>Nombre del proyecto *</Text>
                  <TextInput
                    style={modal.formInput}
                    placeholder="Ej: Torre Empresarial Norte"
                    placeholderTextColor={colors.gray[400]}
                    value={name}
                    onChangeText={setName}
                    maxLength={60}
                  />

                  <Text style={modal.formLabel}>Cliente / Empresa</Text>
                  <TextInput
                    style={modal.formInput}
                    placeholder="Ej: Grupo Inmobiliario XYZ"
                    placeholderTextColor={colors.gray[400]}
                    value={client}
                    onChangeText={setClient}
                  />

                  <View style={{ flexDirection: 'row', gap: spacing.md }}>
                    <View style={{ flex: 1 }}>
                      <Text style={modal.formLabel}>Inicio *</Text>
                      <TextInput
                        style={modal.formInput}
                        placeholder="aaaa-mm-dd"
                        placeholderTextColor={colors.gray[400]}
                        value={startDate}
                        onChangeText={t => fmtDate(t, setStartDate)}
                        keyboardType="numeric"
                        maxLength={10}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={modal.formLabel}>Entrega *</Text>
                      <TextInput
                        style={modal.formInput}
                        placeholder="aaaa-mm-dd"
                        placeholderTextColor={colors.gray[400]}
                        value={deadline}
                        onChangeText={t => fmtDate(t, setDeadline)}
                        keyboardType="numeric"
                        maxLength={10}
                      />
                    </View>
                  </View>

                  <Text style={modal.formLabel}>Estado inicial</Text>
                  <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                    {STATUS_OPTIONS.map(s => {
                      const sc = STATUS_COLORS_MAP[s];
                      const active = status === s;
                      return (
                        <TouchableOpacity
                          key={s}
                          style={[modal.statusChip, active && { backgroundColor: sc.bg, borderColor: sc.border }]}
                          onPress={() => setStatus(s)}
                          activeOpacity={0.8}
                        >
                          <View style={[modal.statusDot, { backgroundColor: active ? sc.text : colors.gray[300] }]} />
                          <Text style={[modal.statusChipText, active && { color: sc.text, fontWeight: fontWeight.bold }]}>{s}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={modal.formLabel}>Personas en el equipo</Text>
                  <TextInput
                    style={modal.formInput}
                    placeholder="Ej: 8"
                    placeholderTextColor={colors.gray[400]}
                    value={teamCount}
                    onChangeText={setTeamCount}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </ScrollView>
              </>
            )}

          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Side Menu ────────────────────────────────────────────────
function SideMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { user, logout } = useAuthStore();
  const slideAnim = useRef(new Animated.Value(-320)).current;

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -320,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const menuItems = [
    { renderIcon: () => <House size={iconSize.md} color={colors.gray[700]} />, label: 'Inicio', active: true },
    { renderIcon: () => <CheckSquare size={iconSize.md} color={colors.gray[700]} />, label: 'Tareas', active: false },
    { renderIcon: () => <Map size={iconSize.md} color={colors.gray[700]} />, label: 'Planos', active: false },
    { renderIcon: () => <FileText size={iconSize.md} color={colors.gray[700]} />, label: 'Documentos', active: false },
    { renderIcon: () => <Camera size={iconSize.md} color={colors.gray[700]} />, label: 'Fotos', active: false },
    { renderIcon: () => <Calendar size={iconSize.md} color={colors.gray[700]} />, label: 'Calendario', active: false },
  ];

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <TouchableOpacity style={menu.overlay} onPress={onClose} activeOpacity={1} />
      <Animated.View style={[menu.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <TouchableOpacity style={menu.closeBtn} onPress={onClose}>
          <X size={iconSize.md} color={colors.gray[600]} />
        </TouchableOpacity>
        <View style={menu.profile}>
          <Avatar initials={user?.initials ?? 'U'} size={48} />
          <Text style={menu.profileName}>{user?.name ?? 'Usuario'}</Text>
          <Text style={menu.profileRole}>{user?.role}</Text>
        </View>
        <View style={menu.items}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[menu.item, item.active && menu.itemActive]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              {item.renderIcon()}
              <Text style={[menu.itemLabel, item.active && menu.itemLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={menu.footer} onPress={logout}>
          <Settings size={iconSize.md} color={colors.gray[600]} />
          <Text style={menu.footerLabel}>Configuración</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── Task Detail Modal ─────────────────────────────────────────
function TaskDetailModal({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const { updateTaskStatus } = useAppStore();
  if (!task) return null;
  const statusColors = getTaskStatusColors(task.status);

  return (
    <Modal visible={!!task} transparent animationType="slide">
      <View style={taskModal.overlay}>
        <View style={taskModal.sheet}>
          <View style={taskModal.header}>
            <Text style={taskModal.headerTitle}>Detalle de Tarea</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={iconSize.md} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={taskModal.body}>
            <View style={taskModal.titleRow}>
              <AlertCircle size={iconSize.md} color={statusColors.icon} />
              <Text style={taskModal.taskTitle}>{task.title}</Text>
            </View>
            <View style={taskModal.badgesRow}>
              <Badge label={task.status} bg={statusColors.bg} textColor={statusColors.text} />
              <Badge
                label={`Prioridad: ${task.priority}`}
                bg={task.priority === 'Alta' ? colors.error[100] : colors.warning[100]}
                textColor={task.priority === 'Alta' ? colors.error[700] : colors.warning[700]}
              />
            </View>
            <View style={taskModal.descCard}>
              <Text style={taskModal.descLabel}>Descripción</Text>
              <Text style={taskModal.descText}>{task.description}</Text>
            </View>
            <View style={taskModal.infoGrid}>
              <View style={taskModal.infoCard}>
                <Text style={taskModal.infoLabel}>Asignado a</Text>
                <View style={taskModal.infoRow}>
                  <Avatar initials={task.assignedTo.initials} size={28} />
                  <Text style={taskModal.infoValue}>{task.assignedTo.name}</Text>
                </View>
              </View>
              <View style={taskModal.infoCard}>
                <Text style={taskModal.infoLabel}>Fecha límite</Text>
                <View style={taskModal.infoRow}>
                  <Calendar size={14} color={colors.gray[600]} />
                  <Text style={taskModal.infoValue}>{formatShortDate(task.deadline)}</Text>
                </View>
              </View>
              <View style={taskModal.infoCard}>
                <Text style={taskModal.infoLabel}>Ubicación</Text>
                <View style={taskModal.infoRow}>
                  <MapPin size={14} color={colors.gray[600]} />
                  <Text style={taskModal.infoValue}>{task.location}</Text>
                </View>
              </View>
              <View style={taskModal.infoCard}>
                <Text style={taskModal.infoLabel}>Estado</Text>
                <Text style={taskModal.infoValue}>{task.status}</Text>
              </View>
            </View>
          </ScrollView>
          <View style={taskModal.actions}>
            {task.status !== 'Completada' && (
              <TouchableOpacity
                style={taskModal.btnPrimary}
                onPress={() => { updateTaskStatus(task.id, 'Completada'); onClose(); }}
                activeOpacity={0.85}
              >
                <Text style={taskModal.btnPrimaryText}>Marcar como Completada</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={taskModal.btnSecondary} onPress={onClose} activeOpacity={0.85}>
              <Text style={taskModal.btnSecondaryText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function HomeScreen() {
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { currentProject, urgentTasks, activity } = useAppStore();

  const project = currentProject();
  const urgent = urgentTasks();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <ScreenEntrance>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {/* Project Header Card */}
          <TouchableOpacity style={styles.projectCard} onPress={() => setShowProjectSelector(true)} activeOpacity={0.92}>
            <Text style={styles.projectLabel}>Proyecto Actual</Text>
            <View style={styles.projectNameRow}>
              <Text style={styles.projectName} numberOfLines={1}>{project?.name ?? 'Sin proyecto'}</Text>
              <ChevronRight size={iconSize.md} color={colors.white} />
            </View>
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <AnimatedNumber value={project?.totalTasks ?? 0} style={styles.metricValue} />
                <Text style={styles.metricLabel}>Tareas</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCard}>
                <AnimatedNumber value={project?.progress ?? 0} suffix='%' style={styles.metricValue} />
                <Text style={styles.metricLabel}>Progreso</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCard}>
                <AnimatedNumber value={project?.urgentTasks ?? 0} style={styles.metricValue} />
                <Text style={styles.metricLabel}>Urgentes</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
            <View style={styles.actionsGrid}>
              {[
                { renderIcon: () => <CheckSquare size={22} color={colors.primary[600]} />, label: 'Tareas', bg: colors.primary[100] },
                { renderIcon: () => <Camera size={22} color={colors.purple[500]} />, label: 'Fotos', bg: colors.purple[100] },
                { renderIcon: () => <Users size={22} color={colors.success[500]} />, label: 'Equipo', bg: colors.success[100] },
                { renderIcon: () => <Map size={22} color={colors.orange[500]} />, label: 'Planos', bg: colors.orange[100] },
              ].map((action, i) => (
                <TouchableOpacity key={i} style={styles.actionBtn} activeOpacity={0.8}>
                  <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>{action.renderIcon()}</View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Urgent Tasks */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tareas Urgentes</Text>
              <TouchableOpacity>
                <Text style={styles.sectionLink}>Ver todas →</Text>
              </TouchableOpacity>
            </View>
            {urgent.length === 0 ? (
              <View style={styles.emptyCard}>
                <CheckCircle size={32} color={colors.success[500]} />
                <Text style={styles.emptyText}>¡Sin tareas urgentes!</Text>
              </View>
            ) : (
              urgent.map((task, index) => {
                const sc = getTaskStatusColors(task.status);
                return (
                  <StaggerItem key={task.id} index={index}>
                    <TouchableOpacity
                      style={styles.taskCard}
                      onPress={() => setSelectedTask(task)}
                      activeOpacity={0.88}
                    >
                      <AlertCircle size={iconSize.md} color={sc.icon} style={styles.taskIcon} />
                      <View style={styles.taskContent}>
                        <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                        <View style={styles.taskMeta}>
                          <Text style={styles.taskMetaText}>{task.assignedTo.name}</Text>
                          <Text style={styles.taskMetaDot}>•</Text>
                          <Text style={styles.taskMetaText}>{task.location}</Text>
                          <Text style={styles.taskMetaDot}>•</Text>
                          <Text style={styles.taskMetaText}>{formatShortDate(task.deadline)}</Text>
                        </View>
                      </View>
                      <ChevronRight size={iconSize.md} color={colors.gray[400]} />
                    </TouchableOpacity>
                  </StaggerItem>
                );
              })
            )}
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actividad Reciente</Text>
            <View style={styles.activityCard}>
              {activity.map((item, index) => (
                <View key={item.id}>
                  <View style={styles.activityItem}>
                    <View style={[
                      styles.activityIconBg,
                      { backgroundColor: item.type === 'task_completed' ? colors.success[100] : colors.primary[100] }
                    ]}>
                      {item.type === 'task_completed'
                        ? <CheckCircle size={14} color={colors.success[500]} />
                        : <Camera size={14} color={colors.primary[600]} />
                      }
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{item.title}</Text>
                      <Text style={styles.activityDesc} numberOfLines={1}>{item.description}</Text>
                      <Text style={styles.activityTime}>{timeAgo(item.timestamp)}</Text>
                    </View>
                  </View>
                  {index < activity.length - 1 && <View style={styles.activityDivider} />}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

      </ScreenEntrance>

      {/* Modals */}
      <ProjectSelectorModal visible={showProjectSelector} onClose={() => setShowProjectSelector(false)} />
      <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  iconBtn: { padding: spacing.sm, borderRadius: borderRadius.sm, position: 'relative' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoIcon: {
    width: 32, height: 32,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text.primary },
  notifDot: {
    position: 'absolute', top: 6, right: 6,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.error[500],
    borderWidth: 1.5, borderColor: colors.white,
  },
  scroll: { flex: 1 },
  content: { paddingBottom: 24 },
  projectCard: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.base,
  },
  projectLabel: { fontSize: fontSize.small, color: `${colors.white}CC`, fontWeight: fontWeight.medium, marginBottom: spacing.xs },
  projectNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.base },
  projectName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.white, flex: 1 },
  metricsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: borderRadius.sm, overflow: 'hidden' },
  metricCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  metricValue: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.white },
  metricLabel: { fontSize: fontSize.caption, color: `${colors.white}CC`, marginTop: 2 },
  metricDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  section: { paddingHorizontal: spacing.base, marginBottom: spacing.base },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text.primary, marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionLink: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: colors.primary[600] },
  actionsGrid: { flexDirection: 'row', gap: spacing.md },
  actionBtn: {
    flex: 1, alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.gray[100],
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md, gap: spacing.sm,
    ...shadows.sm,
  },
  actionIcon: { width: 48, height: 48, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: colors.text.secondary },
  taskCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: spacing.base, marginBottom: spacing.sm,
    ...shadows.sm,
  },
  taskIcon: { marginRight: spacing.md },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text.primary, marginBottom: 4 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  taskMetaText: { fontSize: fontSize.small, color: colors.text.tertiary },
  taskMetaDot: { fontSize: fontSize.small, color: colors.gray[300] },
  emptyCard: { alignItems: 'center', paddingVertical: spacing.xl, backgroundColor: colors.success[50], borderRadius: borderRadius.md, gap: spacing.sm },
  emptyText: { fontSize: fontSize.base, color: colors.success[700], fontWeight: fontWeight.medium },
  activityCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[100], borderRadius: borderRadius.md, overflow: 'hidden', ...shadows.sm },
  activityItem: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.base, gap: spacing.md },
  activityIconBg: { width: 32, height: 32, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: colors.text.primary, marginBottom: 2 },
  activityDesc: { fontSize: fontSize.small, color: colors.text.tertiary, marginBottom: 4 },
  activityTime: { fontSize: fontSize.small, color: colors.gray[400] },
  activityDivider: { height: 1, backgroundColor: colors.gray[100], marginHorizontal: spacing.base },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '80%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.gray[200] },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text.primary },
  projectCard: { margin: spacing.base, marginBottom: 0, padding: spacing.base, borderWidth: 2, borderColor: colors.gray[200], borderRadius: borderRadius.md, gap: spacing.sm },
  projectCardSelected: { borderColor: colors.primary[600] },
  projectHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
  projectName: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.text.primary, flex: 1 },
  projectMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  projectMetaText: { fontSize: fontSize.body, color: colors.text.tertiary },
  progressTrack: { height: 8, backgroundColor: colors.gray[200], borderRadius: borderRadius.full, overflow: 'hidden' },
  progressFill: { height: '100%' as any, backgroundColor: colors.primary[600], borderRadius: borderRadius.full },
  cancelText: { fontSize: fontSize.base, color: colors.gray[500] },
  createBtn: { backgroundColor: colors.primary[600], paddingHorizontal: spacing.base, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.sm },
  createText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.white },
  formHero: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  formHeroIcon: { width: 68, height: 68, borderRadius: borderRadius.xl, backgroundColor: colors.primary[50], borderWidth: 2, borderColor: colors.primary[200], alignItems: 'center', justifyContent: 'center' },
  formHeroText: { fontSize: fontSize.body, color: colors.text.tertiary },
  formLabel: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: colors.text.secondary, marginBottom: spacing.xs, marginTop: spacing.base },
  formInput: { borderWidth: 1, borderColor: colors.gray[300], borderRadius: borderRadius.md, paddingHorizontal: spacing.base, paddingVertical: spacing.md, fontSize: fontSize.base, color: colors.text.primary, backgroundColor: colors.white, minHeight: 48 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1.5, borderColor: colors.gray[200], backgroundColor: colors.white },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusChipText: { fontSize: fontSize.body, color: colors.gray[500] },
  addProjectBtn: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.base, marginTop: spacing.md,
    padding: spacing.base,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  addProjectIconBg: {
    width: 44, height: 44, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  addProjectInfo: { flex: 1 },
  addProjectTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.white },
  addProjectSub: { fontSize: fontSize.small, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
});

const menu = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  drawer: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 300, backgroundColor: colors.white, ...shadows.xl },
  closeBtn: { position: 'absolute', top: 48, right: spacing.base, padding: spacing.sm, zIndex: 1 },
  profile: { padding: spacing.lg, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: colors.gray[200], gap: 4 },
  profileName: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.text.primary, marginTop: spacing.md },
  profileRole: { fontSize: fontSize.body, color: colors.text.tertiary },
  items: { padding: spacing.sm, flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.base, borderRadius: borderRadius.sm },
  itemActive: { backgroundColor: colors.primary[50] },
  itemLabel: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.text.secondary },
  itemLabelActive: { color: colors.primary[600] },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.gray[200] },
  footerLabel: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.text.secondary },
});

const taskModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '90%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.gray[200] },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text.primary },
  body: { padding: spacing.base },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  taskTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text.primary, flex: 1 },
  badgesRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.base },
  descCard: { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, padding: spacing.base, marginBottom: spacing.base },
  descLabel: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: colors.text.secondary, marginBottom: spacing.xs },
  descText: { fontSize: fontSize.body, color: colors.text.tertiary, lineHeight: 20 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  infoCard: { width: '47%', backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, padding: spacing.base, gap: spacing.xs },
  infoLabel: { fontSize: fontSize.small, color: colors.text.tertiary },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  infoValue: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: colors.text.primary },
  actions: { padding: spacing.base, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.gray[100], paddingBottom: 32 },
  btnPrimary: { backgroundColor: colors.primary[600], paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  btnPrimaryText: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.white },
  btnSecondary: { backgroundColor: colors.gray[100], paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  btnSecondaryText: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.text.secondary },
});

// ─── New Project Form Styles ──────────────────────────────────
const newProj = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  backBtn: {
    width: 32, height: 32, borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100], alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.text.primary },
  saveBtn: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.base, paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
  },
  saveText: { fontSize: fontSize.body, fontWeight: fontWeight.semibold, color: colors.white },
  body: { padding: spacing.base },
  iconRow: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  projectIcon: {
    width: 64, height: 64, borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50], alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.primary[200],
  },
  iconHint: { fontSize: fontSize.small, color: colors.text.tertiary },
  label: {
    fontSize: fontSize.body, fontWeight: fontWeight.medium,
    color: colors.text.secondary, marginBottom: spacing.xs, marginTop: spacing.md,
  },
  input: {
    borderWidth: 1, borderColor: colors.gray[300], borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    fontSize: fontSize.base, color: colors.text.primary,
    backgroundColor: colors.white, minHeight: 48,
  },
  dateRow: { flexDirection: 'row', gap: spacing.md },
  statusRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  statusChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, borderWidth: 1.5, borderColor: colors.gray[200],
    backgroundColor: colors.gray[50],
  },
  statusChipText: { fontSize: fontSize.body, color: colors.gray[500], fontWeight: fontWeight.medium },
});

// ─── New Project Modal Styles ─────────────────────────────────
const npModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '92%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.gray[300],
    alignSelf: 'center', marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  title: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.text.primary },
  cancel: { fontSize: fontSize.base, color: colors.gray[500] },
  createBtn: { backgroundColor: colors.primary[600], paddingHorizontal: spacing.base, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.sm },
  createText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.white },
  body: { padding: spacing.base },
  hero: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  heroIcon: {
    width: 72, height: 72, borderRadius: borderRadius.xl,
    backgroundColor: colors.primary[50],
    borderWidth: 2, borderColor: colors.primary[200],
    alignItems: 'center', justifyContent: 'center',
  },
  heroText: { fontSize: fontSize.body, color: colors.text.tertiary },
  label: {
    fontSize: fontSize.body, fontWeight: fontWeight.medium,
    color: colors.text.secondary, marginBottom: spacing.xs, marginTop: spacing.base,
  },
  input: {
    borderWidth: 1, borderColor: colors.gray[300], borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    fontSize: fontSize.base, color: colors.text.primary,
    backgroundColor: colors.white, minHeight: 48,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  statusRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, borderWidth: 1.5, borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: fontSize.body, color: colors.gray[500] },
});