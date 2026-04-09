/**
 * home — ProjectCard (conectada a datos reales)
 */
import { AnimatedNumber } from '@components/ui/Animated';
import { useTheme } from '@hooks/useTheme';
import type { DbProject } from '@store/projectsStore';
import { borderRadius, fontSize, fontWeight, iconSize, spacing } from '@theme/tokens';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
    project: DbProject | undefined;
    onPress: () => void;
}

export function ProjectCard({ project, onPress }: Props) {
    const { colors } = useTheme();

    const totalTasks = project?.total_tasks ?? 0;
    const progress = project?.progress ?? 0;
    const urgentTasks = project?.urgent_tasks ?? 0;
    const completedTasks = project?.completed_tasks ?? 0;

    return (
        <TouchableOpacity
            style={[s.card, { backgroundColor: colors.dark[800] }]}
            onPress={onPress}
            activeOpacity={0.92}
        >
            <Text style={[s.label, { color: 'rgba(255,255,255,0.7)' }]}>Proyecto Actual</Text>
            <View style={s.nameRow}>
                <Text style={s.name} numberOfLines={1}>
                    {project?.name ?? 'Sin proyecto activo'}
                </Text>
                <ChevronRight size={iconSize.md} color={colors.white} />
            </View>

            {project?.description && (
                <Text style={s.desc} numberOfLines={1}>{project.description}</Text>
            )}

            <View style={[s.metricsRow, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                <Metric label="Tareas" value={totalTasks} />
                <View style={s.divider} />
                <Metric label="Progreso" value={progress} suffix="%" />
                <View style={s.divider} />
                <Metric label="Completadas" value={completedTasks} />
                <View style={s.divider} />
                <Metric label="Urgentes" value={urgentTasks} />
            </View>

            {project?.deadline && (
                <Text style={s.deadline}>
                    🗓 Vence: {new Date(project.deadline).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'short', year: 'numeric',
                    })}
                </Text>
            )}
        </TouchableOpacity>
    );
}

function Metric({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
    return (
        <View style={s.metric}>
            <AnimatedNumber value={value} suffix={suffix} style={s.metricValue} />
            <Text style={s.metricLabel}>{label}</Text>
        </View>
    );
}

const s = StyleSheet.create({
    card: { marginHorizontal: spacing.base, borderRadius: borderRadius.lg, padding: spacing.lg, gap: spacing.md },
    label: { fontSize: fontSize.small, fontWeight: fontWeight.medium },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    name: { flex: 1, fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: '#FFFFFF' },
    desc: { fontSize: fontSize.small, color: 'rgba(255,255,255,0.55)', marginTop: -spacing.sm },
    metricsRow: { flexDirection: 'row', borderRadius: borderRadius.sm, overflow: 'hidden' },
    metric: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
    metricValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: '#FFFFFF' },
    metricLabel: { fontSize: fontSize.caption, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
    deadline: { fontSize: fontSize.small, color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
});