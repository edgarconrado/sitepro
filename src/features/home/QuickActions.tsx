/**
 * home — QuickActions
 * Grid de accesos directos a las secciones principales
 */
import { useTheme } from '@hooks/useTheme';
import { borderRadius, fontSize, fontWeight, spacing } from '@theme/tokens';
import { router } from 'expo-router';
import { Camera, CheckSquare, Map, Users } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ACTIONS = [
    { icon: CheckSquare, label: 'Tareas', color: 'primary', href: '/(app)/(tabs)/tasks' },
    { icon: Camera, label: 'Fotos', color: 'purple', href: '/(app)/(tabs)/photos' },
    { icon: Users, label: 'Equipo', color: 'success', href: '/(app)/(tabs)/team' },
    { icon: Map, label: 'Planos', color: 'orange', href: '/(app)/plans' },
] as const;

export function QuickActions() {
    const { colors } = useTheme();

    return (
        <View style={s.container}>
            <Text style={[s.title, { color: colors.text.primary }]}>Acciones Rápidas</Text>
            <View style={s.grid}>
                {ACTIONS.map(({ icon: Icon, label, color, href }) => {
                    const bg = (colors as any)[color][100];
                    const tint = (colors as any)[color][color === 'primary' ? 600 : 500];
                    return (
                        <TouchableOpacity
                            key={label}
                            style={[s.btn, { backgroundColor: colors.background.primary }]}
                            onPress={() => router.push(href as any)}
                            activeOpacity={0.8}
                        >
                            <View style={[s.iconBg, { backgroundColor: bg }]}>
                                <Icon size={22} color={tint} />
                            </View>
                            <Text style={[s.label, { color: colors.text.secondary }]}>{label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: { paddingHorizontal: spacing.base, paddingTop: spacing.base },
    title: { fontSize: fontSize.base, fontWeight: fontWeight.bold, marginBottom: spacing.sm },
    grid: { flexDirection: 'row', gap: spacing.sm },
    btn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: borderRadius.md, gap: spacing.sm },
    iconBg: { width: 48, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: fontSize.small, fontWeight: fontWeight.medium },
});