/**
 * SitePro — Settings Screen
 * Accesible desde el menú lateral como modal
 */

import { Avatar } from '@components/ui/Avatar';
import { useAuthStore } from '@store/authStore';
import { colors } from '@theme/colors';
import { borderRadius, fontSize, fontWeight, iconSize, shadows, spacing } from '@theme/tokens';
import { router } from 'expo-router';
import {
    Bell,
    Briefcase,
    Camera,
    CheckCircle2,
    ChevronRight,
    Eye,
    EyeOff,
    Fingerprint,
    Lock,
    LogOut,
    Mail,
    Moon,
    Shield,
    Smartphone,
    Sun,
    X
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Section wrapper ──────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionCard}>{children}</View>
        </View>
    );
}

// ─── Row types ────────────────────────────────────────────────
function SettingRow({
    icon,
    iconBg,
    label,
    value,
    onPress,
    showChevron = true,
    last = false,
}: {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
    last?: boolean;
}) {
    return (
        <TouchableOpacity
            style={[styles.row, last && styles.rowLast]}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
            disabled={!onPress}
        >
            <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>{icon}</View>
            <Text style={styles.rowLabel}>{label}</Text>
            <View style={styles.rowRight}>
                {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
                {showChevron && onPress && <ChevronRight size={16} color={colors.gray[400]} />}
            </View>
        </TouchableOpacity>
    );
}

function ToggleRow({
    icon,
    iconBg,
    label,
    subtitle,
    value,
    onChange,
    last = false,
}: {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    subtitle?: string;
    value: boolean;
    onChange: (v: boolean) => void;
    last?: boolean;
}) {
    return (
        <View style={[styles.row, last && styles.rowLast]}>
            <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>{icon}</View>
            <View style={styles.rowLabelCol}>
                <Text style={styles.rowLabel}>{label}</Text>
                {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
            </View>
            <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: colors.gray[200], true: colors.primary[200] }}
                thumbColor={value ? colors.primary[600] : colors.gray[400]}
                ios_backgroundColor={colors.gray[200]}
            />
        </View>
    );
}

// ─── Edit Profile Modal ───────────────────────────────────────
function EditProfileModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const { user, setUser } = useAuthStore();
    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [role, setRole] = useState(user?.role ?? '');

    const handleSave = () => {
        if (!name.trim()) { Alert.alert('Error', 'El nombre es requerido'); return; }
        if (!email.trim()) { Alert.alert('Error', 'El email es requerido'); return; }
        setUser({
            ...user!,
            name: name.trim(),
            email: email.trim(),
            role: role.trim(),
            initials: name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
        });
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={eModal.overlay}>
                <View style={eModal.sheet}>
                    <View style={eModal.header}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={eModal.cancel}>Cancelar</Text>
                        </TouchableOpacity>
                        <Text style={eModal.title}>Editar Perfil</Text>
                        <TouchableOpacity onPress={handleSave}>
                            <Text style={eModal.save}>Guardar</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Avatar */}
                    <View style={eModal.avatarSection}>
                        <Avatar initials={user?.initials ?? 'U'} size={72} />
                        <TouchableOpacity style={eModal.changePhotoBtn}>
                            <Camera size={14} color={colors.primary[600]} />
                            <Text style={eModal.changePhotoText}>Cambiar foto</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={eModal.body} showsVerticalScrollIndicator={false}>
                        <View style={eModal.fieldWrapper}>
                            <Text style={eModal.label}>Nombre completo</Text>
                            <TextInput
                                style={eModal.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Tu nombre"
                                placeholderTextColor={colors.gray[400]}
                            />
                        </View>
                        <View style={eModal.fieldWrapper}>
                            <Text style={eModal.label}>Email</Text>
                            <TextInput
                                style={eModal.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="tu@email.com"
                                placeholderTextColor={colors.gray[400]}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                        <View style={eModal.fieldWrapper}>
                            <Text style={eModal.label}>Rol / Cargo</Text>
                            <TextInput
                                style={eModal.input}
                                value={role}
                                onChangeText={setRole}
                                placeholder="Ej: Gerente de Proyecto"
                                placeholderTextColor={colors.gray[400]}
                            />
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

// ─── Change Password Modal ────────────────────────────────────
function ChangePasswordModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const [current, setCurrent] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSave = () => {
        if (!current) { Alert.alert('Error', 'Ingresa tu contraseña actual'); return; }
        if (newPass.length < 6) { Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres'); return; }
        if (newPass !== confirm) { Alert.alert('Error', 'Las contraseñas no coinciden'); return; }
        Alert.alert('Éxito', 'Contraseña actualizada correctamente');
        setCurrent(''); setNewPass(''); setConfirm('');
        onClose();
    };

    const PassInput = ({
        label, value, onChange, show, onToggle,
    }: { label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void }) => (
        <View style={eModal.fieldWrapper}>
            <Text style={eModal.label}>{label}</Text>
            <View style={pModal.inputRow}>
                <TextInput
                    style={pModal.input}
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={!show}
                    placeholder="••••••••"
                    placeholderTextColor={colors.gray[400]}
                />
                <TouchableOpacity onPress={onToggle} style={pModal.eyeBtn}>
                    {show ? <EyeOff size={18} color={colors.gray[400]} /> : <Eye size={18} color={colors.gray[400]} />}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={eModal.overlay}>
                <View style={eModal.sheet}>
                    <View style={eModal.header}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={eModal.cancel}>Cancelar</Text>
                        </TouchableOpacity>
                        <Text style={eModal.title}>Cambiar Contraseña</Text>
                        <TouchableOpacity onPress={handleSave}>
                            <Text style={eModal.save}>Guardar</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={eModal.body} showsVerticalScrollIndicator={false}>
                        <PassInput label="Contraseña actual" value={current} onChange={setCurrent} show={showCurrent} onToggle={() => setShowCurrent(v => !v)} />
                        <PassInput label="Nueva contraseña" value={newPass} onChange={setNewPass} show={showNew} onToggle={() => setShowNew(v => !v)} />
                        <PassInput label="Confirmar contraseña" value={confirm} onChange={setConfirm} show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
                        <View style={pModal.hint}>
                            <Text style={pModal.hintText}>• Mínimo 6 caracteres</Text>
                            <Text style={pModal.hintText}>• Usa letras, números y símbolos</Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

// ─── Appearance Sheet ─────────────────────────────────────────
type Theme = 'light' | 'dark' | 'system';

const THEMES: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Claro', icon: <Sun size={18} color={colors.warning[500]} /> },
    { value: 'dark', label: 'Oscuro', icon: <Moon size={18} color={colors.gray[600]} /> },
    { value: 'system', label: 'Automático', icon: <Smartphone size={18} color={colors.primary[600]} /> },
];

function ThemeSheet({ visible, current, onSelect, onClose }: {
    visible: boolean; current: Theme; onSelect: (t: Theme) => void; onClose: () => void;
}) {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={themeModal.overlay}>
                <View style={themeModal.sheet}>
                    <View style={themeModal.header}>
                        <Text style={themeModal.title}>Apariencia</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <X size={iconSize.md} color={colors.gray[600]} />
                        </TouchableOpacity>
                    </View>
                    {THEMES.map((t) => (
                        <TouchableOpacity
                            key={t.value}
                            style={[themeModal.option, current === t.value && themeModal.optionActive]}
                            onPress={() => { onSelect(t.value); onClose(); }}
                            activeOpacity={0.8}
                        >
                            <View style={themeModal.optionIcon}>{t.icon}</View>
                            <Text style={[themeModal.optionText, current === t.value && themeModal.optionTextActive]}>
                                {t.label}
                            </Text>
                            {current === t.value && <CheckCircle2 size={18} color={colors.primary[600]} />}
                        </TouchableOpacity>
                    ))}
                    <View style={{ height: 32 }} />
                </View>
            </View>
        </Modal>
    );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function SettingsScreen() {
    const { user, logout } = useAuthStore();

    // Modals
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showChangePass, setShowChangePass] = useState(false);
    const [showThemeSheet, setShowThemeSheet] = useState(false);

    // Notifications toggles
    const [notifTasks, setNotifTasks] = useState(true);
    const [notifMessages, setNotifMessages] = useState(true);
    const [notifReports, setNotifReports] = useState(false);
    const [notifSound, setNotifSound] = useState(true);

    // Appearance
    const [theme, setTheme] = useState<Theme>('system');

    // Security toggles
    const [biometric, setBiometric] = useState(false);
    const [autoLogout, setAutoLogout] = useState(true);

    const themeLabel = THEMES.find(t => t.value === theme)?.label ?? 'Automático';

    const handleLogout = () => {
        Alert.alert(
            'Cerrar sesión',
            '¿Estás seguro que deseas cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar sesión',
                    style: 'destructive',
                    onPress: () => {
                        logout();
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.closeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <X size={iconSize.md} color={colors.gray[700]} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Configuración</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                {/* Profile card */}
                <TouchableOpacity style={styles.profileCard} onPress={() => setShowEditProfile(true)} activeOpacity={0.88}>
                    <Avatar initials={user?.initials ?? 'U'} size={56} />
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{user?.name ?? 'Usuario'}</Text>
                        <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
                        <Text style={styles.profileRole}>{user?.role ?? ''}</Text>
                    </View>
                    <View style={styles.editChip}>
                        <Text style={styles.editChipText}>Editar</Text>
                    </View>
                </TouchableOpacity>

                {/* Notificaciones */}
                <Section title="Notificaciones">
                    <ToggleRow
                        icon={<Bell size={16} color={colors.white} />}
                        iconBg={colors.primary[600]}
                        label="Tareas"
                        subtitle="Nuevas tareas y cambios de estado"
                        value={notifTasks}
                        onChange={setNotifTasks}
                    />
                    <ToggleRow
                        icon={<Bell size={16} color={colors.white} />}
                        iconBg={colors.purple[500]}
                        label="Mensajes"
                        subtitle="Mensajes nuevos del equipo"
                        value={notifMessages}
                        onChange={setNotifMessages}
                    />
                    <ToggleRow
                        icon={<Bell size={16} color={colors.white} />}
                        iconBg={colors.success[500]}
                        label="Reportes"
                        subtitle="Resúmenes semanales de proyecto"
                        value={notifReports}
                        onChange={setNotifReports}
                    />
                    <ToggleRow
                        icon={<Bell size={16} color={colors.white} />}
                        iconBg={colors.orange[500]}
                        label="Sonido"
                        subtitle="Sonido en notificaciones"
                        value={notifSound}
                        onChange={setNotifSound}
                        last
                    />
                </Section>

                {/* Apariencia */}
                <Section title="Apariencia">
                    <SettingRow
                        icon={<Moon size={16} color={colors.white} />}
                        iconBg={colors.gray[700]}
                        label="Tema"
                        value={themeLabel}
                        onPress={() => setShowThemeSheet(true)}
                        last
                    />
                </Section>

                {/* Seguridad */}
                <Section title="Seguridad">
                    <SettingRow
                        icon={<Lock size={16} color={colors.white} />}
                        iconBg={colors.error[500]}
                        label="Cambiar contraseña"
                        onPress={() => setShowChangePass(true)}
                    />
                    <ToggleRow
                        icon={<Fingerprint size={16} color={colors.white} />}
                        iconBg={colors.success[600]}
                        label="Biométrico"
                        subtitle="Huella o Face ID para ingresar"
                        value={biometric}
                        onChange={setBiometric}
                    />
                    <ToggleRow
                        icon={<Shield size={16} color={colors.white} />}
                        iconBg={colors.warning[500]}
                        label="Cierre automático"
                        subtitle="Cerrar sesión tras 30 min inactivo"
                        value={autoLogout}
                        onChange={setAutoLogout}
                        last
                    />
                </Section>

                {/* Acerca de */}
                <Section title="Acerca de">
                    <SettingRow
                        icon={<Briefcase size={16} color={colors.white} />}
                        iconBg={colors.primary[600]}
                        label="Versión"
                        value="1.0.0 (beta)"
                        showChevron={false}
                    />
                    <SettingRow
                        icon={<Mail size={16} color={colors.white} />}
                        iconBg={colors.primary[400]}
                        label="Soporte"
                        value="soporte@sitepro.com"
                        showChevron={false}
                        last
                    />
                </Section>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
                    <LogOut size={18} color={colors.error[500]} />
                    <Text style={styles.logoutText}>Cerrar sesión</Text>
                </TouchableOpacity>

                <Text style={styles.footerText}>SitePro © 2026 — Todos los derechos reservados</Text>
            </ScrollView>

            {/* Modals */}
            <EditProfileModal visible={showEditProfile} onClose={() => setShowEditProfile(false)} />
            <ChangePasswordModal visible={showChangePass} onClose={() => setShowChangePass(false)} />
            <ThemeSheet
                visible={showThemeSheet}
                current={theme}
                onSelect={setTheme}
                onClose={() => setShowThemeSheet(false)}
            />
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background.secondary },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.md,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
        ...shadows.sm,
    },
    closeBtn: {
        width: 36, height: 36,
        borderRadius: borderRadius.full,
        backgroundColor: colors.gray[100],
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text.primary },
    scroll: { flex: 1 },
    content: { padding: spacing.base, paddingBottom: 48, gap: spacing.base },

    // Profile card
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.base,
        gap: spacing.md,
        ...shadows.sm,
    },
    profileInfo: { flex: 1, minWidth: 0 },
    profileName: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.text.primary },
    profileEmail: { fontSize: fontSize.small, color: colors.text.tertiary, marginTop: 2 },
    profileRole: { fontSize: fontSize.small, color: colors.primary[600], marginTop: 2, fontWeight: fontWeight.medium },
    editChip: {
        backgroundColor: colors.primary[50],
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderWidth: 1,
        borderColor: colors.primary[200],
    },
    editChipText: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: colors.primary[600] },

    // Sections
    section: { gap: spacing.sm },
    sectionTitle: { fontSize: fontSize.small, fontWeight: fontWeight.bold, color: colors.gray[500], letterSpacing: 0.8, paddingLeft: spacing.xs },
    sectionCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, overflow: 'hidden', ...shadows.sm },

    // Rows
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.md,
        gap: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
    },
    rowLast: { borderBottomWidth: 0 },
    rowIcon: { width: 32, height: 32, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    rowLabel: { flex: 1, fontSize: fontSize.base, color: colors.text.primary, fontWeight: fontWeight.medium },
    rowLabelCol: { flex: 1 },
    rowSubtitle: { fontSize: fontSize.small, color: colors.text.tertiary, marginTop: 2 },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    rowValue: { fontSize: fontSize.small, color: colors.text.tertiary, maxWidth: 120 },

    // Logout
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        backgroundColor: colors.error[50],
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.base,
        borderWidth: 1,
        borderColor: colors.error[100],
    },
    logoutText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.error[500] },

    footerText: { textAlign: 'center', fontSize: fontSize.small, color: colors.gray[400] },
});

// ─── Edit Profile Modal Styles ────────────────────────────────
const eModal = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: colors.white,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: spacing.base,
        borderBottomWidth: 1, borderBottomColor: colors.gray[100],
    },
    title: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.text.primary },
    cancel: { fontSize: fontSize.base, color: colors.gray[500] },
    save: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.primary[600] },
    avatarSection: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
    changePhotoBtn: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
        backgroundColor: colors.primary[50], paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs, borderRadius: borderRadius.full,
    },
    changePhotoText: { fontSize: fontSize.small, color: colors.primary[600], fontWeight: fontWeight.medium },
    body: { paddingHorizontal: spacing.base },
    fieldWrapper: { marginBottom: spacing.base },
    label: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: colors.text.secondary, marginBottom: spacing.xs },
    input: {
        borderWidth: 1, borderColor: colors.gray[300], borderRadius: borderRadius.md,
        paddingHorizontal: spacing.base, paddingVertical: spacing.md,
        fontSize: fontSize.base, color: colors.text.primary, minHeight: 48,
    },
});

// ─── Password Modal Styles ────────────────────────────────────
const pModal = StyleSheet.create({
    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: colors.gray[300],
        borderRadius: borderRadius.md, minHeight: 48,
        paddingHorizontal: spacing.base,
    },
    input: { flex: 1, fontSize: fontSize.base, color: colors.text.primary, paddingVertical: spacing.md },
    eyeBtn: { padding: spacing.sm },
    hint: { backgroundColor: colors.gray[50], borderRadius: borderRadius.md, padding: spacing.base, gap: 4, marginBottom: spacing.lg },
    hintText: { fontSize: fontSize.small, color: colors.text.tertiary },
});

// ─── Theme Sheet Styles ───────────────────────────────────────
const themeModal = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: colors.white,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.gray[100],
    },
    title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text.primary },
    option: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
        paddingVertical: spacing.base, paddingHorizontal: spacing.lg,
        borderBottomWidth: 1, borderBottomColor: colors.gray[50],
    },
    optionActive: { backgroundColor: colors.primary[50] },
    optionIcon: {
        width: 36, height: 36, borderRadius: borderRadius.sm,
        backgroundColor: colors.gray[100], alignItems: 'center', justifyContent: 'center',
    },
    optionText: { flex: 1, fontSize: fontSize.base, color: colors.text.primary, fontWeight: fontWeight.medium },
    optionTextActive: { color: colors.primary[700], fontWeight: fontWeight.semibold },
});