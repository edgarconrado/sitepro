/**
 * tasks — TaskCard
 * Tarjeta compacta de tarea para la lista
 */
import { Badge } from '@components/ui/Badge';
import { useTheme } from '@hooks/useTheme';
import { borderRadius, fontSize, fontWeight, iconSize, shadows, spacing } from '@theme/tokens';
import { STATUS_DB_TO_UI, PRIORITY_DB_TO_UI, type DbTask } from '@store/tasksStore';
import { formatShortDate, getTaskPriorityColors, getTaskStatusColors } from '@utils/index';
import { Calendar, ChevronRight, MapPin, Users } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TaskStatusIcon } from './TaskStatusIcon';

interface Props {
    task: DbTask;
    onPress: () => void;
}

export function TaskCard({ task, onPress }: Props) {
    const { colors } = useTheme();
    const uiStatus = STATUS_DB_TO_UI[task.status] ?? task.status;
    const uiPriority = PRIORITY_DB_TO_UI[task.priority] ?? task.priority;
    const statusColors = getTaskStatusColors(uiStatus, colors);
    const priorityColors = getTaskPriorityColors(uiPriority, colors);

    return (
        <TouchableOpacity
            style={[s.card, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}
            onPress={onPress}
            activeOpacity={0.88}
        >
            {/* Title row */}
            <View style={s.row1}>
                <TaskStatusIcon status={uiStatus} />
                <Text style={[s.title, { color: colors.text.primary }]} numberOfLines={1}>
                    {task.title}
                </Text>
                <ChevronRight size={iconSize.sm} color={colors.text.disabled} />
            </View>

            {/* Badge row */}
            <View style={s.row2}>
                <Badge label={uiStatus} bg={statusColors.bg} textColor={statusColors.text} />
                <Badge label={uiPriority} bg={priorityColors.bg} textColor={priorityColors.text} />
            </View>

            {/* Meta row */}
            <View style={s.row3}>
                <MetaItem icon={<Users size={12} color={colors.text.disabled} />} label={task.assignee?.full_name ?? 'Sin asignar'} colors={colors} />
                <MetaItem icon={<MapPin size={12} color={colors.text.disabled} />} label={task.location ?? '—'} colors={colors} />
                <MetaItem icon={<Calendar size={12} color={colors.text.disabled} />} label={task.due_date ? formatShortDate(task.due_date) : 'Sin fecha'} colors={colors} />
            </View>
        </TouchableOpacity>
    );
}

function MetaItem({ icon, label, colors }: { icon: React.ReactNode; label: string; colors: any }) {
    return (
        <View style={s.meta}>
            {icon}
            <Text style={[s.metaText, { color: colors.text.tertiary }]}>{label}</Text>
        </View>
    );
}

const s = StyleSheet.create({
    card: {
        borderRadius: borderRadius.md,
        borderWidth: 1,
        padding: spacing.base,
        gap: spacing.sm,
        ...shadows.sm,
    },
    row1: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    title: { flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
    row2: { flexDirection: 'row', gap: spacing.sm },
    row3: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.base },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: fontSize.small },
});