/**
 * home — ProjectCard
 * Tarjeta principal de métricas del proyecto actual
 */
import { AnimatedNumber } from '@components/ui/Animated';
import { useTheme } from '@hooks/useTheme';
import { borderRadius, fontSize, fontWeight, iconSize, spacing } from '@theme/tokens';
import type { Project } from '@types/index';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
    project: Project | undefined;
    onPress: () => void;
}

export function ProjectCard({ project, onPress }: Props) {
    const { colors } = useTheme();
    return (
        <TouchableOpacity
            style={[s.card, { backgroundColor: colors.dark[800] }]}
            onPress={onPress}
            activeOpacity={0.92}
        >
            <Text style={[s.label, { color: 'rgba(255,255,255,0.7)' }]}>Proyecto Actual</Text>
            <View style={s.nameRow}>
                <Text style={s.name} numberOfLines={1}>{project?.name ?? 'Sin proyecto'}</Text>
                <ChevronRight size={iconSize.md} color={colors.white} />
            </View>
            <View style={[s.metricsRow, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                <Metric label="Tareas" value={project?.totalTasks ?? 0} />
                <View style={s.divider} />
                <Metric label="Progreso" value={project?.progress ?? 0} suffix="%" />
                <View style={s.divider} />
                <Metric label="Urgentes" value={project?.urgentTasks ?? 0} />
            </View>
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
    metricsRow: { flexDirection: 'row', borderRadius: borderRadius.sm, overflow: 'hidden' },
    metric: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
    metricValue: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: '#FFFFFF' },
    metricLabel: { fontSize: fontSize.caption, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
});