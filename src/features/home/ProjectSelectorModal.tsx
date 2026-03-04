/**
 * home — ProjectSelectorModal
 * Lista y creación de proyectos
 */
import { Badge } from '@components/ui/Badge';
import { SelectorField, TextField } from '@components/ui/FormField';
import { OptionsSheet } from '@components/ui/OptionsSheet';
import { useTheme } from '@hooks/useTheme';
import { useAppStore } from '@store/appStore';
import { borderRadius, fontSize, fontWeight, iconSize, spacing } from '@theme/tokens';
import { formatShortDate, getProjectStatusColors } from '@utils/index';
import { Building2, ChevronRight, Plus, X } from 'lucide-react-native';
import React from 'react';
import {
    Alert, KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

type ProjectStatus = 'En Progreso' | 'En Revisión' | 'Pausado';

const STATUS_OPTIONS: ProjectStatus[] = ['En Progreso', 'En Revisión', 'Pausado'];

interface Props {
    visible: boolean;
    onClose: () => void;
}

export function ProjectSelectorModal({ visible, onClose }: Props) {
    const { colors } = useTheme();
    const { projects, currentProjectId, setCurrentProject, addProject } = useAppStore();

    const [view, setView] = React.useState<'list' | 'new'>('list');
    const [name, setName] = React.useState('');
    const [client, setClient] = React.useState('');
    const [startDate, setStartDate] = React.useState('');
    const [deadline, setDeadline] = React.useState('');
    const [status, setStatus] = React.useState<ProjectStatus>('En Progreso');
    const [teamCount, setTeamCount] = React.useState('');
    const [showStatus, setShowStatus] = React.useState(false);

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
                <View style={s.overlay}>
                    <View style={[s.sheet, { backgroundColor: colors.background.primary, maxHeight: view === 'new' ? '92%' : '80%' }]}>

                        {view === 'list' ? (
                            <>
                                {/* Header */}
                                <View style={[s.header, { borderBottomColor: colors.border.light }]}>
                                    <Text style={[s.title, { color: colors.text.primary }]}>Proyectos</Text>
                                    <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                        <X size={iconSize.md} color={colors.text.tertiary} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                                    {projects.map((project) => {
                                        const isSelected = project.id === currentProjectId;
                                        const sc = getProjectStatusColors(project.status, colors);
                                        return (
                                            <TouchableOpacity
                                                key={project.id}
                                                onPress={() => { setCurrentProject(project.id); onClose(); }}
                                                activeOpacity={0.85}
                                                style={[
                                                    s.projectCard,
                                                    { borderColor: colors.border.light, backgroundColor: colors.background.secondary },
                                                    isSelected && { borderColor: colors.primary[400], backgroundColor: colors.primary[50] },
                                                ]}
                                            >
                                                <View style={s.projectHeader}>
                                                    <Text style={[s.projectName, { color: colors.text.primary }]} numberOfLines={1}>
                                                        {project.name}
                                                    </Text>
                                                    <Badge label={project.status} bg={sc.bg} textColor={sc.text} />
                                                </View>
                                                <View style={s.projectMeta}>
                                                    <Text style={[s.metaText, { color: colors.text.tertiary }]}>{project.totalTasks} tareas</Text>
                                                    <Text style={[s.metaText, { color: colors.text.tertiary }]}>{project.progress}% completado</Text>
                                                    <Text style={[s.metaText, { color: colors.text.tertiary }]}>Vence: {formatShortDate(project.deadline)}</Text>
                                                </View>
                                                <View style={[s.progressTrack, { backgroundColor: colors.border.default }]}>
                                                    <View style={[s.progressFill, { width: `${project.progress}%` as any, backgroundColor: colors.primary[600] }]} />
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}

                                    {/* New project button */}
                                    <TouchableOpacity
                                        style={[s.addBtn, { backgroundColor: colors.dark[800] }]}
                                        onPress={() => setView('new')}
                                        activeOpacity={0.85}
                                    >
                                        <View style={[s.addIcon, { backgroundColor: colors.primary[600] }]}>
                                            <Plus size={22} color={colors.dark[900]} strokeWidth={2.5} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[s.addTitle, { color: colors.white }]}>Nuevo proyecto</Text>
                                            <Text style={[s.addSub, { color: 'rgba(255,255,255,0.6)' }]}>Crear y configurar un proyecto nuevo</Text>
                                        </View>
                                        <ChevronRight size={18} color="rgba(255,255,255,0.6)" />
                                    </TouchableOpacity>
                                </ScrollView>
                            </>
                        ) : (
                            <>
                                {/* Header */}
                                <View style={[s.header, { borderBottomColor: colors.border.light }]}>
                                    <TouchableOpacity onPress={() => setView('list')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                        <Text style={[s.backText, { color: colors.primary[700] }]}>← Volver</Text>
                                    </TouchableOpacity>
                                    <Text style={[s.title, { color: colors.text.primary }]}>Nuevo Proyecto</Text>
                                    <TouchableOpacity onPress={handleCreate} style={[s.createBtn, { backgroundColor: colors.primary[600] }]}>
                                        <Text style={[s.createText, { color: colors.dark[900] }]}>Crear</Text>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={{ padding: spacing.base }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
                                    {/* Hero */}
                                    <View style={[s.hero, { backgroundColor: colors.background.secondary }]}>
                                        <View style={[s.heroIcon, { backgroundColor: colors.primary[100] }]}>
                                            <Building2 size={30} color={colors.primary[600]} />
                                        </View>
                                        <Text style={[s.heroText, { color: colors.text.secondary }]}>Completa los datos del proyecto</Text>
                                    </View>

                                    <TextField
                                        label="Nombre del proyecto" required
                                        placeholder="Ej: Torre Empresarial Norte"
                                        value={name} onChangeText={setName} maxLength={60}
                                    />
                                    <TextField
                                        label="Cliente / Empresa"
                                        placeholder="Ej: Grupo Inmobiliario XYZ"
                                        value={client} onChangeText={setClient}
                                    />

                                    <View style={{ flexDirection: 'row', gap: spacing.md }}>
                                        <View style={{ flex: 1 }}>
                                            <TextField label="Inicio" required hint="aaaa-mm-dd"
                                                placeholder="2026-01-01" value={startDate}
                                                onChangeText={t => fmtDate(t, setStartDate)} keyboardType="numeric" maxLength={10}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <TextField label="Entrega" required hint="aaaa-mm-dd"
                                                placeholder="2026-12-31" value={deadline}
                                                onChangeText={t => fmtDate(t, setDeadline)} keyboardType="numeric" maxLength={10}
                                            />
                                        </View>
                                    </View>

                                    <SelectorField
                                        label="Estado inicial"
                                        value={status}
                                        placeholder="Seleccionar"
                                        onPress={() => setShowStatus(true)}
                                    />

                                    <TextField
                                        label="Personas en el equipo"
                                        placeholder="Ej: 8"
                                        value={teamCount} onChangeText={setTeamCount} keyboardType="numeric" maxLength={3}
                                    />
                                </ScrollView>
                            </>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>

            <OptionsSheet
                visible={showStatus}
                title="Estado del proyecto"
                options={STATUS_OPTIONS}
                selected={status}
                onSelect={v => setStatus(v as ProjectStatus)}
                onClose={() => setShowStatus(false)}
            />
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base, borderBottomWidth: 1 },
    title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
    backText: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
    createBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.sm },
    createText: { fontSize: fontSize.body, fontWeight: fontWeight.semibold },
    projectCard: { marginHorizontal: spacing.base, marginBottom: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, padding: spacing.base, gap: spacing.xs },
    projectHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    projectName: { flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
    projectMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    metaText: { fontSize: fontSize.small },
    progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden', marginTop: spacing.xs },
    progressFill: { height: 4, borderRadius: 2 },
    addBtn: { margin: spacing.base, borderRadius: borderRadius.lg, padding: spacing.base, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    addIcon: { width: 44, height: 44, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
    addTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
    addSub: { fontSize: fontSize.small, marginTop: 2 },
    hero: { borderRadius: borderRadius.md, padding: spacing.base, alignItems: 'center', gap: spacing.sm, marginBottom: spacing.base },
    heroIcon: { width: 60, height: 60, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
    heroText: { fontSize: fontSize.body, textAlign: 'center' },
});