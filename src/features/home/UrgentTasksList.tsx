/**
 * home — UrgentTasksList (usa DbTask de Supabase)
 */
import { StaggerItem } from '@components/ui/Animated';
import { useTheme } from '@hooks/useTheme';
import { STATUS_DB_TO_UI, type DbTask } from '@store/tasksStore';
import { borderRadius, fontSize, fontWeight, iconSize, spacing } from '@theme/tokens';
import { getTaskStatusColors } from '@utils/index';
import { AlertCircle, CheckCircle, ChevronRight } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
    tasks: DbTask[];
    onTaskPress: (task: DbTask) => void;
}

export function UrgentTasksList({ tasks, onTaskPress }: Props) {
    const { colors } = useTheme();

    return (
        <View style={s.container}>
            <View style={s.header}>
                <Text style={[s.title, { color: colors.text.primary }]}>
                    Tareas Activas
                </Text>
                {tasks.length > 0 && (
                    <View style={[s.countPill, { backgroundColor: colors.primary[100] }]}>
                        <Text style={[s.countText, { color: colors.primary[700] }]}>{tasks.length}</Text>
                    </View>
                )}
            </View>

            {tasks.length === 0 ? (
                <View style={[s.emptyCard, { backgroundColor: colors.background.primary }]}>
                    <CheckCircle size={32} color={colors.success[500]} />
                    <Text style={[s.emptyText, { color: colors.text.tertiary }]}>¡Sin tareas activas!</Text>
                </View>
            ) : (
                tasks.map((task, i) => {
                    const uiStatus = STATUS_DB_TO_UI[task.status] ?? task.status;
                    const sc = getTaskStatusColors(uiStatus, colors);
                    return (
                        <StaggerItem key={task.id} index={i}>
                            <TouchableOpacity
                                style={[s.taskCard, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}
                                onPress={() => onTaskPress(task)}
                                activeOpacity={0.88}
                            >
                                <AlertCircle size={iconSize.md} color={sc.icon} />
                                <View style={s.taskBody}>
                                    <Text style={[s.taskTitle, { color: colors.text.primary }]} numberOfLines={1}>
                                        {task.title}
                                    </Text>
                                    <View style={s.taskMeta}>
                                        <Text style={[s.metaText, { color: colors.text.tertiary }]}>
                                            {task.assignee?.full_name ?? 'Sin asignar'}
                                        </Text>
                                        {task.location && (
                                            <>
                                                <Text style={{ color: colors.text.disabled }}> • </Text>
                                                <Text style={[s.metaText, { color: colors.text.tertiary }]}>{task.location}</Text>
                                            </>
                                        )}
                                        {task.due_date && (
                                            <>
                                                <Text style={{ color: colors.text.disabled }}> • </Text>
                                                <Text style={[s.metaText, { color: colors.text.tertiary }]}>
                                                    {new Date(task.due_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                                </Text>
                                            </>
                                        )}
                                    </View>
                                </View>
                                <ChevronRight size={iconSize.md} color={colors.text.disabled} />
                            </TouchableOpacity>
                        </StaggerItem>
                    );
                })
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: { paddingHorizontal: spacing.base, paddingTop: spacing.base },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    title: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
    countPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
    countText: { fontSize: fontSize.small, fontWeight: fontWeight.bold },
    emptyCard: { borderRadius: borderRadius.md, padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
    emptyText: { fontSize: fontSize.base },
    taskCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, padding: spacing.md, marginBottom: spacing.sm },
    taskBody: { flex: 1, gap: 4 },
    taskTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
    taskMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    metaText: { fontSize: fontSize.small },
});