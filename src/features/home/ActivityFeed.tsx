/**
 * home — ActivityFeed
 * Feed de actividad reciente del proyecto
 */
import { useTheme } from '@hooks/useTheme';
import { borderRadius, fontSize, fontWeight, spacing } from '@theme/tokens';
import { timeAgo } from '@utils/index';
import { Camera, CheckCircle } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ActivityItem {
    id: string;
    type: 'task_completed' | 'photo_uploaded' | string;
    title: string;
    description: string;
    timestamp: string;
}

interface Props {
    items: ActivityItem[];
}

export function ActivityFeed({ items }: Props) {
    const { colors } = useTheme();
    return (
        <View style={s.container}>
            <Text style={[s.title, { color: colors.text.primary }]}>Actividad Reciente</Text>
            <View style={[s.card, { backgroundColor: colors.background.primary }]}>
                {items.map((item, i) => (
                    <View key={item.id}>
                        <View style={s.item}>
                            <View style={[s.iconBg, {
                                backgroundColor: item.type === 'task_completed'
                                    ? colors.success[100]
                                    : colors.primary[100],
                            }]}>
                                {item.type === 'task_completed'
                                    ? <CheckCircle size={14} color={colors.success[500]} />
                                    : <Camera size={14} color={colors.primary[600]} />
                                }
                            </View>
                            <View style={s.body}>
                                <Text style={[s.itemTitle, { color: colors.text.primary }]}>{item.title}</Text>
                                <Text style={[s.itemDesc, { color: colors.text.tertiary }]} numberOfLines={1}>{item.description}</Text>
                                <Text style={[s.itemTime, { color: colors.text.disabled }]}>{timeAgo(item.timestamp)}</Text>
                            </View>
                        </View>
                        {i < items.length - 1 && (
                            <View style={[s.divider, { backgroundColor: colors.border.light }]} />
                        )}
                    </View>
                ))}
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: { paddingHorizontal: spacing.base, paddingTop: spacing.base },
    title: { fontSize: fontSize.base, fontWeight: fontWeight.bold, marginBottom: spacing.sm },
    card: { borderRadius: borderRadius.md },
    item: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.base },
    iconBg: { width: 32, height: 32, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
    body: { flex: 1, gap: 2 },
    itemTitle: { fontSize: fontSize.body, fontWeight: fontWeight.medium },
    itemDesc: { fontSize: fontSize.small },
    itemTime: { fontSize: fontSize.small, marginTop: 2 },
    divider: { height: 1, marginLeft: spacing.base + 32 + spacing.md },
});