/**
 * SitePro — Settings Screen (conectado a Supabase)
 */

import { colors } from '@/theme';
import { Avatar } from '@components/ui/Avatar';
import { useToast } from '@components/ui/Toast';
import { useTheme } from '@hooks/useTheme';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@store/authStore';
import { useThemeStore } from '@store/themeStore';
import { borderRadius, fontSize, fontWeight, iconSize, shadows, spacing } from '@theme/tokens';
import { router } from 'expo-router';
import {
    Bell, Briefcase,
    CheckCircle2, ChevronRight,
    Eye, EyeOff, Fingerprint, Lock, LogOut,
    Mail, Moon, Shield, Smartphone, Sun, X
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator, Alert, Modal, ScrollView, StatusBar,
    StyleSheet, Switch, Text, TextInput, TouchableOpacity, View,
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

function SettingRow({ icon, iconBg, label, value, onPress, showChevron = true, last = false }: {
    icon: React.ReactNode; iconBg: string; label: string;
    value?: string; onPress?: () => void; showChevron?: boolean; last?: boolean;
}) {
    return (
        <TouchableOpacity style={[styles.row, last && styles.rowLast]} onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={!onPress}>
            <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>{icon}</View>
            <Text style={styles.rowLabel}>{label}</Text>
            <View style={styles.rowRight}>
                {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
                {showChevron && onPress && <ChevronRight size={16} color={colors.gray[400]} />}
            </View>
        </TouchableOpacity>
    );
}

function ToggleRow({ icon, iconBg, label, subtitle, value, onChange, last = false }: {
    icon: React.ReactNode; iconBg: string; label: string;
    subtitle?: string; value: boolean; onChange: (v: boolean) => void; last?: boolean;
}) {
    return (
        <View style={[styles.row, last && styles.rowLast]}>
            <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>{icon}</View>
            <View style={styles.rowLabelCol}>
                <Text style={styles.rowLabel}>{label}</Text>
                {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
            </View>
            <Switch
                value={value} onValueChange={onChange}
                trackColor={{ false: colors.gray[200], true: colors.primary[200] }}
                thumbColor={value ? colors.primary[600] : colors.gray[400]}
                ios_backgroundColor={colors.gray[200]}
            />
        </View>
    );
}

// ─── Edit Profile Modal ───────────────────────────────────────
function EditProfileModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const { user, loadSession } = useAuthStore();
    const toast = useToast();
    const [fullName, setFullName] = useState(user?.full_name ?? '');
    const [jobTitle, setJobTitle] = useState(user?.job_title ?? '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!fullName.trim()) { Alert.alert('Error', 'El nombre es requerido'); return; }
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName.trim(), job_title: jobTitle.trim() || null, updated_at: new Date().toISOString() })
                .eq('id', user!.id);
            if (error) throw error;
            await loadSession(); // Recargar perfil actualizado
            toast.success('Perfil actualizado', 'Los cambios se guardaron correctamente');
            onClose();
        } catch (err: any) {
            Alert.alert('Error', err.message ?? 'No se pudo actualizar el perfil');
        } finally {
            setSaving(false);
        }
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
                        <TouchableOpacity onPress={handleSave} disabled={saving}>
                            {saving
                                ? <ActivityIndicator size="small" color={colors.primary[600]} />
                                : <Text style={eModal.save}>Guardar</Text>
                            }
                        </TouchableOpacity>
                    </View>
                    <View style={eModal.avatarSection}>
                        <Avatar
                            initials={(user?.full_name ?? 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                            size={72}
                        />
                    </View>
                    <ScrollView style={eModal.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        <View style={eModal.fieldWrapper}>
                            <Text style={eModal.label}>Nombre completo</Text>
                            <TextInput
                                style={eModal.input} value={fullName} onChangeText={setFullName}
                                placeholder="Tu nombre" placeholderTextColor={colors.gray[400]}
                            />
                        </View>
                        <View style={eModal.fieldWrapper}>
                            <Text style={eModal.label}>Email</Text>
                            <TextInput
                                style={[eModal.input, { color: colors.gray[400] }]}
                                value={user?.email ?? ''} editable={false}
                            />
                        </View>
                        <View style={eModal.fieldWrapper}>
                            <Text style={eModal.label}>Cargo / Rol</Text>
                            <TextInput
                                style={eModal.input} value={jobTitle} onChangeText={setJobTitle}
                                placeholder="Ej: Gerente de Proyecto" placeholderTextColor={colors.gray[400]}
                            />
                        </View>
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

// ─── Change Password Modal ────────────────────────────────────
function ChangePasswordModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const toast = useToast();
    const [newPass, setNewPass] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (newPass.length < 8) { Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres'); return; }
        if (newPass !== confirm) { Alert.alert('Error', 'Las contraseñas no coinciden'); return; }
        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPass });
            if (error) throw error;
            toast.success('Contraseña actualizada', 'Tu contraseña fue cambiada correctamente');
            setNewPass(''); setConfirm('');
            onClose();
        } catch (err: any) {
            Alert.alert('Error', err.message ?? 'No se pudo cambiar la contraseña');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={eModal.overlay}>
                <View style={eModal.sheet}>
                    <View style={eModal.header}>
                        <TouchableOpacity onPress={onClose}><Text style={eModal.cancel}>Cancelar</Text></TouchableOpacity>
                        <Text style={eModal.title}>Cambiar Contraseña</Text>
                        <TouchableOpacity onPress={handleSave} disabled={saving}>
                            {saving
                                ? <ActivityIndicator size="small" color={colors.primary[600]} />
                                : <Text style={eModal.save}>Guardar</Text>
                            }
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={eModal.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        <View style={eModal.fieldWrapper}>
                            <Text style={eModal.label}>Nueva contraseña</Text>
                            <View style={pModal.inputRow}>
                                <TextInput style={pModal.input} value={newPass} onChangeText={setNewPass}
                                    secureTextEntry={!showNew} placeholder="Mínimo 8 caracteres" placeholderTextColor={colors.gray[400]} />
                                <TouchableOpacity onPress={() => setShowNew(v => !v)} style={pModal.eyeBtn}>
                                    {showNew ? <EyeOff size={18} color={colors.gray[400]} /> : <Eye size={18} color={colors.gray[400]} />}
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={eModal.fieldWrapper}>
                            <Text style={eModal.label}>Confirmar contraseña</Text>
                            <View style={pModal.inputRow}>
                                <TextInput style={pModal.input} value={confirm} onChangeText={setConfirm}
                                    secureTextEntry={!showConfirm} placeholder="Repite la contraseña" placeholderTextColor={colors.gray[400]} />
                                <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={pModal.eyeBtn}>
                                    {showConfirm ? <EyeOff size={18} color={colors.gray[400]} /> : <Eye size={18} color={colors.gray[400]} />}
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={pModal.hint}>
                            <Text style={pModal.hintText}>• Mínimo 8 caracteres</Text>
                            <Text style={pModal.hintText}>• Usa letras, números y símbolos</Text>
                        </View>
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

// ─── Theme Sheet ──────────────────────────────────────────────
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
                        <TouchableOpacity key={t.value}
                            style={[themeModal.option, current === t.value && themeModal.optionActive]}
                            onPress={() => { onSelect(t.value); onClose(); }} activeOpacity={0.8}
                        >
                            <View style={themeModal.optionIcon}>{t.icon}</View>
                            <Text style={[themeModal.optionText, current === t.value && themeModal.optionTextActive]}>{t.label}</Text>
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
    const { colors: themeColors, isDark } = useTheme();
    const { user, logout } = useAuthStore();
    const toast = useToast();

    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showChangePass, setShowChangePass] = useState(false);
    const [showThemeSheet, setShowThemeSheet] = useState(false);

    const [notifTasks, setNotifTasks] = useState(true);
    const [notifMessages, setNotifMessages] = useState(true);
    const [notifReports, setNotifReports] = useState(false);
    const [notifSound, setNotifSound] = useState(true);
    const [biometric, setBiometric] = useState(false);
    const [autoLogout, setAutoLogout] = useState(true);

    const { mode: theme, setMode: setTheme } = useThemeStore();
    const themeLabel = THEMES.find(t => t.value === theme)?.label ?? 'Automático';

    // Datos del perfil desde Supabase
    const initials = (user?.full_name ?? 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

    const handleLogout = () => {
        Alert.alert(
            'Cerrar sesión',
            '¿Estás seguro que deseas cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar sesión', style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.background.primary} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <X size={iconSize.md} color={colors.gray[700]} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Configuración</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                {/* Perfil */}
                <TouchableOpacity style={styles.profileCard} onPress={() => setShowEditProfile(true)} activeOpacity={0.88}>
                    <Avatar initials={initials} size={56} />
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{user?.full_name ?? 'Usuario'}</Text>
                        <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
                        <Text style={styles.profileRole}>{user?.job_title ?? user?.role ?? ''}</Text>
                    </View>
                    <View style={styles.editChip}>
                        <Text style={styles.editChipText}>Editar</Text>
                    </View>
                </TouchableOpacity>

                {/* Notificaciones */}
                <Section title="Notificaciones">
                    <ToggleRow icon={<Bell size={16} color={colors.white} />} iconBg={colors.primary[600]} label="Tareas" subtitle="Nuevas tareas y cambios de estado" value={notifTasks} onChange={setNotifTasks} />
                    <ToggleRow icon={<Bell size={16} color={colors.white} />} iconBg={colors.purple[500]} label="Mensajes" subtitle="Mensajes nuevos del equipo" value={notifMessages} onChange={setNotifMessages} />
                    <ToggleRow icon={<Bell size={16} color={colors.white} />} iconBg={colors.success[500]} label="Reportes" subtitle="Resúmenes semanales" value={notifReports} onChange={setNotifReports} />
                    <ToggleRow icon={<Bell size={16} color={colors.white} />} iconBg={colors.orange[500]} label="Sonido" subtitle="Sonido en notificaciones" value={notifSound} onChange={setNotifSound} last />
                </Section>

                {/* Apariencia */}
                <Section title="Apariencia">
                    <SettingRow icon={<Moon size={16} color={colors.white} />} iconBg={colors.gray[700]} label="Tema" value={themeLabel} onPress={() => setShowThemeSheet(true)} last />
                </Section>

                {/* Seguridad */}
                <Section title="Seguridad">
                    <SettingRow icon={<Lock size={16} color={colors.white} />} iconBg={colors.error[500]} label="Cambiar contraseña" onPress={() => setShowChangePass(true)} />
                    <ToggleRow icon={<Fingerprint size={16} color={colors.white} />} iconBg={colors.success[600]} label="Biométrico" subtitle="Huella o Face ID para ingresar" value={biometric} onChange={setBiometric} />
                    <ToggleRow icon={<Shield size={16} color={colors.white} />} iconBg={colors.warning[500]} label="Cierre automático" subtitle="Cerrar sesión tras 30 min inactivo" value={autoLogout} onChange={setAutoLogout} last />
                </Section>

                {/* Acerca de */}
                <Section title="Acerca de">
                    <SettingRow icon={<Briefcase size={16} color={colors.white} />} iconBg={colors.primary[600]} label="Versión" value="1.0.0 (beta)" showChevron={false} />
                    <SettingRow icon={<Mail size={16} color={colors.white} />} iconBg={colors.primary[400]} label="Soporte" value="soporte@sitepro.com" showChevron={false} last />
                </Section>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
                    <LogOut size={18} color={colors.error[500]} />
                    <Text style={styles.logoutText}>Cerrar sesión</Text>
                </TouchableOpacity>

                <Text style={styles.footerText}>SitePro © 2026 — Todos los derechos reservados</Text>
            </ScrollView>

            <EditProfileModal visible={showEditProfile} onClose={() => setShowEditProfile(false)} />
            <ChangePasswordModal visible={showChangePass} onClose={() => setShowChangePass(false)} />
            <ThemeSheet visible={showThemeSheet} current={theme} onSelect={setTheme} onClose={() => setShowThemeSheet(false)} />
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAFAFA' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F5F5F5', ...shadows.sm },
    closeBtn: { width: 36, height: 36, borderRadius: borderRadius.full, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#0F0F0F' },
    scroll: { flex: 1 },
    content: { padding: spacing.base, paddingBottom: 48, gap: spacing.base },
    profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: borderRadius.lg, padding: spacing.base, gap: spacing.md, ...shadows.sm },
    profileInfo: { flex: 1, minWidth: 0 },
    profileName: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: '#0F0F0F' },
    profileEmail: { fontSize: fontSize.small, color: '#737373', marginTop: 2 },
    profileRole: { fontSize: fontSize.small, color: '#EAAB00', marginTop: 2, fontWeight: fontWeight.medium },
    editChip: { backgroundColor: '#FFFBEB', borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: '#FDE68A' },
    editChipText: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: '#EAAB00' },
    section: { gap: spacing.sm },
    sectionTitle: { fontSize: fontSize.small, fontWeight: fontWeight.bold, color: '#737373', letterSpacing: 0.8, paddingLeft: spacing.xs },
    sectionCard: { backgroundColor: '#FFFFFF', borderRadius: borderRadius.lg, overflow: 'hidden', ...shadows.sm },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md, gap: spacing.md, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    rowLast: { borderBottomWidth: 0 },
    rowIcon: { width: 32, height: 32, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    rowLabel: { flex: 1, fontSize: fontSize.base, color: '#0F0F0F', fontWeight: fontWeight.medium },
    rowLabelCol: { flex: 1 },
    rowSubtitle: { fontSize: fontSize.small, color: '#737373', marginTop: 2 },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    rowValue: { fontSize: fontSize.small, color: '#737373', maxWidth: 120 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: '#FEF2F2', borderRadius: borderRadius.lg, paddingVertical: spacing.base, borderWidth: 1, borderColor: '#FEE2E2' },
    logoutText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: '#EF4444' },
    footerText: { textAlign: 'center', fontSize: fontSize.small, color: '#A3A3A3' },
});

const eModal = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '85%' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    title: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: '#0F0F0F' },
    cancel: { fontSize: fontSize.base, color: '#737373' },
    save: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: '#EAAB00' },
    avatarSection: { alignItems: 'center', paddingVertical: spacing.lg },
    body: { paddingHorizontal: spacing.base },
    fieldWrapper: { marginBottom: spacing.base },
    label: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: '#333333', marginBottom: spacing.xs },
    input: { borderWidth: 1, borderColor: '#D4D4D4', borderRadius: borderRadius.md, paddingHorizontal: spacing.base, paddingVertical: spacing.md, fontSize: fontSize.base, color: '#0F0F0F', minHeight: 48 },
});

const pModal = StyleSheet.create({
    inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D4D4D4', borderRadius: borderRadius.md, minHeight: 48, paddingHorizontal: spacing.base },
    input: { flex: 1, fontSize: fontSize.base, color: '#0F0F0F', paddingVertical: spacing.md },
    eyeBtn: { padding: spacing.sm },
    hint: { backgroundColor: '#FAFAFA', borderRadius: borderRadius.md, padding: spacing.base, gap: 4, marginBottom: spacing.lg },
    hintText: { fontSize: fontSize.small, color: '#737373' },
});

const themeModal = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#0F0F0F' },
    option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.base, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#FAFAFA' },
    optionActive: { backgroundColor: '#FFFBEB' },
    optionIcon: { width: 36, height: 36, borderRadius: borderRadius.sm, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
    optionText: { flex: 1, fontSize: fontSize.base, color: '#0F0F0F', fontWeight: fontWeight.medium },
    optionTextActive: { color: '#CA8A04', fontWeight: fontWeight.semibold },
});