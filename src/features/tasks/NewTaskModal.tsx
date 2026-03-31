/**
 * tasks — NewTaskModal
 * Formulario de creación de tarea en bottom sheet
 */
import { Avatar } from '@components/ui/Avatar';
import { SelectorField, TextAreaField, TextField } from '@components/ui/FormField';
import { OptionsSheet } from '@components/ui/OptionsSheet';
import { useToast } from '@components/ui/Toast';
import { useTheme } from '@hooks/useTheme';
import { fetchProjectMembers, useProjectsStore } from '@store/projectsStore';
import { borderRadius, fontSize, fontWeight, spacing } from '@theme/tokens';
import type { TaskPriority, TaskStatus } from '@types/index';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    LOCATION_OPTIONS,
    PRIORITY_OPTIONS, STATUS_OPTIONS,
} from './constants';
import { useTaskForm } from './useTaskForm';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export function NewTaskModal({ visible, onClose }: Props) {
    const { colors } = useTheme();
    const toast = useToast();
    const { values, errors, setField, formatDeadline, submit, reset, saving } = useTaskForm(onClose);
    const { currentProjectId } = useProjectsStore();

    // Miembros reales del proyecto
    const [members, setMembers] = useState<{ id: string; full_name: string; job_title: string; avatar_url: string | null }[]>([]);
    useEffect(() => {
        if (visible && currentProjectId) {
            fetchProjectMembers(currentProjectId).then(setMembers);
        }
    }, [visible, currentProjectId]);

    const handleSubmit = async () => {
        try {
            await submit();
            toast.success('Tarea creada', values.title.trim() || 'Nueva tarea');
        } catch (err: any) {
            Alert.alert('Error', err.message ?? 'No se pudo crear la tarea');
        }
    };

    const [showTeam, setShowTeam] = useState(false);
    const [showLocation, setShowLocation] = useState(false);
    const [showPriority, setShowPriority] = useState(false);
    const [showStatus, setShowStatus] = useState(false);

    const handleClose = () => { reset(); onClose(); };

    const priorityColor = {
        Alta: '#EF4444',
        Media: '#F59E0B',
        Baja: '#A3A3A3',
    }[values.priority];

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={s.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1, justifyContent: 'flex-end' }}
                >
                    <View style={[s.sheet, { backgroundColor: colors.background.secondary }]}>

                        {/* Header */}
                        <View style={[s.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.light }]}>
                            <TouchableOpacity onPress={handleClose} style={s.cancelBtn}>
                                <Text style={[s.cancelText, { color: colors.text.tertiary }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <Text style={[s.title, { color: colors.text.primary }]}>Nueva Tarea</Text>
                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={saving}
                                style={[s.saveBtn, { backgroundColor: colors.primary[600], opacity: saving ? 0.6 : 1 }]}
                            >
                                {saving
                                    ? <ActivityIndicator size="small" color="#000" />
                                    : <Text style={[s.saveText, { color: colors.dark[900] }]}>Guardar</Text>
                                }
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={s.body}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <TextField
                                label="Título"
                                required
                                placeholder="Ej: Revisar instalación eléctrica piso 5"
                                value={values.title}
                                onChangeText={(v) => setField('title', v)}
                                error={errors.title}
                                maxLength={100}
                                maxChars={100}
                                charCount={values.title.length}
                            />

                            <TextAreaField
                                label="Descripción"
                                required
                                placeholder="Describe el trabajo a realizar..."
                                value={values.description}
                                onChangeText={(v) => setField('description', v)}
                                error={errors.description}
                                maxLength={500}
                                maxChars={500}
                                charCount={values.description.length}
                            />

                            {/* Prioridad + Estado en fila */}
                            <View style={s.row}>
                                <View style={{ flex: 1 }}>
                                    <SelectorField
                                        label="Prioridad"
                                        value={values.priority}
                                        placeholder="Seleccionar"
                                        onPress={() => setShowPriority(true)}
                                        prefix={<View style={[s.dot, { backgroundColor: priorityColor }]} />}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <SelectorField
                                        label="Estado"
                                        value={values.status}
                                        placeholder="Seleccionar"
                                        onPress={() => setShowStatus(true)}
                                    />
                                </View>
                            </View>

                            <SelectorField
                                label="Asignado a"
                                required
                                value={values.assignedTo ? `${values.assignedTo.name} — ${values.assignedTo.role}` : ''}
                                placeholder="Selecciona un responsable"
                                onPress={() => setShowTeam(true)}
                                error={errors.assignedTo}
                            />

                            <SelectorField
                                label="Ubicación"
                                required
                                value={values.location}
                                placeholder="Selecciona una ubicación"
                                onPress={() => setShowLocation(true)}
                                error={errors.location}
                            />

                            <TextField
                                label="Fecha límite"
                                required
                                hint="Formato: dd/mm/aaaa"
                                placeholder="28/02/2026"
                                value={values.deadline}
                                onChangeText={formatDeadline}
                                error={errors.deadline}
                                keyboardType="numeric"
                                maxLength={10}
                            />

                            <View style={{ height: 32 }} />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>

            {/* Sub-sheets */}
            <OptionsSheet
                visible={showTeam}
                title="Asignar a"
                options={members.map(m => m.id)}
                selected={values.assignedTo?.id ?? null}
                onSelect={(id) => {
                    const m = members.find(x => x.id === id);
                    if (m) setField('assignedTo', { id: m.id, name: m.full_name, initials: m.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(), role: m.job_title ?? '' });
                }}
                onClose={() => setShowTeam(false)}
                renderItem={(id) => {
                    const m = members.find(x => x.id === id);
                    if (!m) return null;
                    return (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
                            <Avatar initials={m.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()} size={36} />
                            <View>
                                <Text style={{ fontSize: fontSize.base, color: colors.text.primary, fontWeight: fontWeight.medium }}>{m.full_name}</Text>
                                <Text style={{ fontSize: fontSize.small, color: colors.text.tertiary }}>{m.job_title ?? ''}</Text>
                            </View>
                        </View>
                    );
                }}
            />

            <OptionsSheet
                visible={showLocation}
                title="Seleccionar ubicación"
                options={LOCATION_OPTIONS as any}
                selected={values.location as any}
                onSelect={(v) => setField('location', v)}
                onClose={() => setShowLocation(false)}
            />

            <OptionsSheet
                visible={showPriority}
                title="Prioridad"
                options={PRIORITY_OPTIONS.map(p => p.value)}
                selected={values.priority}
                onSelect={(v) => setField('priority', v as TaskPriority)}
                onClose={() => setShowPriority(false)}
                renderItem={(v) => {
                    const color = { Alta: '#EF4444', Media: '#F59E0B', Baja: '#A3A3A3' }[v];
                    return (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
                            <View style={[s.dot, { backgroundColor: color, width: 12, height: 12 }]} />
                            <Text style={{ fontSize: fontSize.base, color: colors.text.primary }}>{v}</Text>
                        </View>
                    );
                }}
            />

            <OptionsSheet
                visible={showStatus}
                title="Estado inicial"
                options={STATUS_OPTIONS.map(s => s.value)}
                selected={values.status}
                onSelect={(v) => setField('status', v as TaskStatus)}
                onClose={() => setShowStatus(false)}
            />
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    sheet: { borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '95%' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, borderBottomWidth: 1 },
    title: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
    cancelBtn: { padding: spacing.xs },
    cancelText: { fontSize: fontSize.base },
    saveBtn: { paddingHorizontal: spacing.base, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.sm },
    saveText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
    body: { padding: spacing.base },
    row: { flexDirection: 'row', gap: spacing.md },
    dot: { width: 10, height: 10, borderRadius: 5 },
});