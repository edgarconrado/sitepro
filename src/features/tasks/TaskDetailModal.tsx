/**
 * tasks — TaskDetailModal
 * Modal de detalle y acciones de una tarea
 */
import { Avatar } from '@components/ui/Avatar';
import { Badge } from '@components/ui/Badge';
import { ConfirmDialogContainer, useConfirm } from '@components/ui/ConfirmDialog';
import { useToast } from '@components/ui/Toast';
import { useTheme } from '@hooks/useTheme';
import { STATUS_DB_TO_UI, PRIORITY_DB_TO_UI, useTasksStore, type DbTask } from '@store/tasksStore';
import { borderRadius, fontSize, fontWeight, iconSize, spacing } from '@theme/tokens';

import { formatShortDate, getTaskPriorityColors, getTaskStatusColors } from '@utils/index';
import { Calendar, CheckCircle2, MapPin, X } from 'lucide-react-native';
import React from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { TaskStatusIcon } from './TaskStatusIcon';

interface Props {
    task: DbTask | null;
    onClose: () => void;
}

export function TaskDetailModal({ task, onClose }: Props) {
    const { colors } = useTheme();
    const { updateStatus, deleteTask } = useTasksStore();
    const confirm = useConfirm();
    const toast = useToast();

    if (!task) return null;

    const uiStatus = STATUS_DB_TO_UI[task.status] ?? task.status;
    const uiPriority = PRIORITY_DB_TO_UI[task.priority] ?? task.priority;
    const sc = getTaskStatusColors(uiStatus, colors);
    const pc = getTaskPriorityColors(uiPriority, colors);

    const handleComplete = () => {
        updateStatus(task.id, 'completed');
        onClose();
    };

    const handleDelete = () => {
        if (!task) return;
        confirm.confirm({
            title: 'Eliminar tarea',
            message: `¿Eliminar "${task.title}"? Esta acción no se puede deshacer.`,
            confirmLabel: 'Sí, eliminar',
            icon: 'trash',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await deleteTask(task.id);
                    toast.success('Tarea eliminada', task.title);
                    onClose();
                } catch {
                    toast.error('Error al eliminar', 'Inténtalo de nuevo');
                }
            },
        });
    };

    return (
        <Modal visible={!!task} transparent animationType="slide">
            <View style={s.overlay}>
                <View style={[s.sheet, { backgroundColor: colors.background.primary }]}>

                    {/* Header */}
                    <View style={[s.header, { borderBottomColor: colors.border.default }]}>
                        <Text style={[s.headerTitle, { color: colors.text.primary }]}>Detalle de Tarea</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <X size={iconSize.md} color={colors.text.tertiary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
                        {/* Title */}
                        <View style={s.titleRow}>
                            <TaskStatusIcon status={uiStatus} />
                            <Text style={[s.taskTitle, { color: colors.text.primary }]}>{task.title}</Text>
                        </View>

                        {/* Badges */}
                        <View style={s.badgesRow}>
                            <Badge label={uiStatus} bg={sc.bg} textColor={sc.text} />
                            <Badge label={`Prioridad: ${uiPriority}`} bg={pc.bg} textColor={pc.text} />
                        </View>

                        {/* Description */}
                        <View style={[s.descCard, { backgroundColor: colors.background.secondary }]}>
                            <Text style={[s.descLabel, { color: colors.text.secondary }]}>Descripción</Text>
                            <Text style={[s.descText, { color: colors.text.tertiary }]}>{task.description ?? '—'}</Text>
                        </View>

                        {/* Info grid */}
                        <View style={s.infoGrid}>
                            <InfoCard label="Asignado a" colors={colors}>
                                <View style={s.infoRow}>
                                    <Avatar initials={(task.assignee?.full_name ?? '?').split(' ').map((w:string) => w[0]).join('').slice(0,2).toUpperCase()} size={28} />
                                    <Text style={[s.infoValue, { color: colors.text.primary }]}>{task.assignee?.full_name ?? 'Sin asignar'}</Text>
                                </View>
                            </InfoCard>

                            <InfoCard label="Fecha límite" colors={colors}>
                                <View style={s.infoRow}>
                                    <Calendar size={14} color={colors.text.tertiary} />
                                    <Text style={[s.infoValue, { color: colors.text.primary }]}>{task.due_date ? formatShortDate(task.due_date) : 'Sin fecha'}</Text>
                                </View>
                            </InfoCard>

                            <InfoCard label="Ubicación" colors={colors}>
                                <View style={s.infoRow}>
                                    <MapPin size={14} color={colors.text.tertiary} />
                                    <Text style={[s.infoValue, { color: colors.text.primary }]}>{task.location ?? '—'}</Text>
                                </View>
                            </InfoCard>

                            <InfoCard label="Estado" colors={colors}>
                                <Text style={[s.infoValue, { color: sc.text }]}>{uiStatus}</Text>
                            </InfoCard>
                        </View>
                    </ScrollView>

                    {/* Actions */}
                    <View style={[s.actions, { borderTopColor: colors.border.light }]}>
                        {task.status !== 'completed' && (
                            <TouchableOpacity
                                style={[s.btnPrimary, { backgroundColor: colors.primary[600] }]}
                                onPress={handleComplete}
                                activeOpacity={0.85}
                            >
                                <CheckCircle2 size={18} color={colors.text.inverse} />
                                <Text style={[s.btnPrimaryText, { color: colors.dark[900] }]}>Marcar como Completada</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[s.btnSecondary, { backgroundColor: colors.background.tertiary }]}
                            onPress={onClose}
                            activeOpacity={0.85}
                        >
                            <Text style={[s.btnSecondaryText, { color: colors.text.secondary }]}>Cerrar</Text>
                        </TouchableOpacity>
                        {task.status !== 'completed' && (
                            <TouchableOpacity
                                style={[s.btnDanger, { backgroundColor: colors.error[50] }]}
                                onPress={handleDelete}
                                activeOpacity={0.85}
                            >
                                <Text style={[s.btnDangerText, { color: colors.error[500] }]}>Eliminar tarea</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
            <ConfirmDialogContainer />
        </Modal>
    );
}

function InfoCard({ label, children, colors }: { label: string; children: React.ReactNode; colors: any }) {
    return (
        <View style={[s.infoCard, { backgroundColor: colors.background.secondary }]}>
            <Text style={[s.infoLabel, { color: colors.text.tertiary }]}>{label}</Text>
            {children}
        </View>
    );
}

const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '90%' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base, borderBottomWidth: 1 },
    headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
    body: { padding: spacing.base },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
    taskTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, flex: 1 },
    badgesRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.base, flexWrap: 'wrap' },
    descCard: { borderRadius: borderRadius.md, padding: spacing.base, marginBottom: spacing.base },
    descLabel: { fontSize: fontSize.body, fontWeight: fontWeight.medium, marginBottom: spacing.xs },
    descText: { fontSize: fontSize.body, lineHeight: 20 },
    infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
    infoCard: { width: '47%', borderRadius: borderRadius.md, padding: spacing.base, gap: spacing.xs },
    infoLabel: { fontSize: fontSize.small },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    infoValue: { fontSize: fontSize.body, fontWeight: fontWeight.medium },
    actions: { padding: spacing.base, gap: spacing.sm, borderTopWidth: 1, paddingBottom: 32 },
    btnPrimary: { paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
    btnPrimaryText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
    btnSecondary: { paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
    btnSecondaryText: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
    btnDanger: { paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
    btnDangerText: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
});