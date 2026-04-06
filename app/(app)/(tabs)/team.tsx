/**
 * SitePro — Team Screen (conectado a Supabase)
 * Miembros reales del proyecto activo
 */

import { EmptySearch, EmptyTeam } from '@/components/ui/EmptyStates';
import { colors } from '@/theme';
import { Avatar } from '@components/ui/Avatar';
import { Badge } from '@components/ui/Badge';
import { TeamScreenSkeleton } from '@components/ui/Skeletons';
import { useToast } from '@components/ui/Toast';
import { useTheme } from '@hooks/useTheme';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@store/authStore';
import { useProjectsStore } from '@store/projectsStore';
import { borderRadius, fontSize, fontWeight, iconSize, shadows, spacing } from '@theme/tokens';
import {
  CheckSquare, Mail,
  MessageSquare,
  Phone, Search, Star, UserPlus, X
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, RefreshControl,
  ScrollView, StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Tipos ────────────────────────────────────────────────────
interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  job_title: string | null;
  avatar_url: string | null;
  role: string; // rol en el proyecto
  is_online: boolean;
  active_tasks: number;
  completed_tasks: number;
}

// ─── Roles en el proyecto (etiquetas) ────────────────────────
const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  project_manager: 'Gerente de Proyecto',
  supervisor: 'Supervisor',
  worker: 'Trabajador',
  inspector: 'Inspector',
  viewer: 'Observador',
};

// ─── Helper: cargar miembros con stats ───────────────────────
async function loadMembers(projectId: string): Promise<TeamMember[]> {
  // 1. Miembros del proyecto con perfil
  const { data: members, error } = await supabase
    .from('project_members')
    .select('user_id, role, profiles(id, full_name, email, job_title, avatar_url, is_online)')
    .eq('project_id', projectId);

  if (error || !members) return [];

  // 2. Tareas por miembro (dos queries separadas por el OR bug)
  const userIds = members.map((m: any) => m.user_id);

  const { data: activeTasks } = await supabase
    .from('tasks')
    .select('assigned_to')
    .eq('project_id', projectId)
    .in('status', ['pending', 'in_progress', 'urgent'])
    .in('assigned_to', userIds);

  const { data: completedTasks } = await supabase
    .from('tasks')
    .select('assigned_to')
    .eq('project_id', projectId)
    .eq('status', 'completed')
    .in('assigned_to', userIds);

  // Conteo por usuario
  const activeCount: Record<string, number> = {};
  const completedCount: Record<string, number> = {};
  (activeTasks ?? []).forEach((t: any) => {
    if (t.assigned_to) activeCount[t.assigned_to] = (activeCount[t.assigned_to] ?? 0) + 1;
  });
  (completedTasks ?? []).forEach((t: any) => {
    if (t.assigned_to) completedCount[t.assigned_to] = (completedCount[t.assigned_to] ?? 0) + 1;
  });

  return members.map((m: any) => ({
    id: m.profiles?.id ?? m.user_id,
    full_name: m.profiles?.full_name ?? 'Usuario',
    email: m.profiles?.email ?? '',
    job_title: m.profiles?.job_title ?? null,
    avatar_url: m.profiles?.avatar_url ?? null,
    role: m.role,
    is_online: m.profiles?.is_online ?? false,
    active_tasks: activeCount[m.user_id] ?? 0,
    completed_tasks: completedCount[m.user_id] ?? 0,
  }));
}

// ─── Modal de detalle ─────────────────────────────────────────
function MemberDetailModal({ member, onClose, canManage, projectId, onRemoved }: {
  member: TeamMember | null;
  onClose: () => void;
  canManage: boolean;
  projectId: string;
  onRemoved: () => void;
}) {
  const toast = useToast();
  const { user } = useAuthStore();
  if (!member) return null;

  const initials = member.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const roleLabel = ROLE_LABELS[member.role] ?? member.role;
  const isSelf = member.id === user?.id;

  const handleRemove = () => {
    if (isSelf) { Alert.alert('No permitido', 'No puedes eliminarte a ti mismo del proyecto'); return; }
    Alert.alert(
      'Eliminar miembro',
      `¿Eliminar a ${member.full_name} del proyecto?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('project_members')
              .delete()
              .eq('project_id', projectId)
              .eq('user_id', member.id);
            if (error) { Alert.alert('Error', error.message); return; }
            toast.success('Miembro eliminado', `${member.full_name} fue removido del proyecto`);
            onClose();
            onRemoved();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={!!member} transparent animationType="slide">
      <View style={mModal.overlay}>
        <View style={mModal.sheet}>
          <View style={mModal.header}>
            <Text style={mModal.headerTitle}>Perfil del Miembro</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={iconSize.md} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={mModal.body}>
            <View style={mModal.profileSection}>
              <Avatar initials={initials} size={72} showOnlineIndicator isOnline={member.is_online} />
              <Text style={mModal.memberName}>{member.full_name}</Text>
              <Text style={mModal.memberRole}>{member.job_title ?? roleLabel}</Text>
              <Badge
                label={member.is_online ? 'En línea' : 'Desconectado'}
                bg={member.is_online ? colors.success[100] : colors.gray[100]}
                textColor={member.is_online ? colors.success[700] : colors.gray[500]}
              />
            </View>

            {/* Stats */}
            <View style={mModal.statsRow}>
              <View style={mModal.statCard}>
                <Text style={mModal.statValue}>{member.active_tasks}</Text>
                <Text style={mModal.statLabel}>Activas</Text>
              </View>
              <View style={mModal.statDivider} />
              <View style={mModal.statCard}>
                <Text style={mModal.statValue}>{member.completed_tasks}</Text>
                <Text style={mModal.statLabel}>Completadas</Text>
              </View>
              <View style={mModal.statDivider} />
              <View style={mModal.statCard}>
                <Text style={mModal.statValue}>{member.active_tasks + member.completed_tasks}</Text>
                <Text style={mModal.statLabel}>Total</Text>
              </View>
            </View>

            {/* Info */}
            <View style={mModal.infoGrid}>
              <View style={mModal.infoCard}>
                <View style={mModal.infoIconRow}>
                  <Star size={14} color={colors.primary[600]} />
                  <Text style={mModal.infoLabel}>Rol en proyecto</Text>
                </View>
                <Text style={mModal.infoValue}>{roleLabel}</Text>
              </View>
              <View style={mModal.infoCard}>
                <View style={mModal.infoIconRow}>
                  <CheckSquare size={14} color={colors.primary[600]} />
                  <Text style={mModal.infoLabel}>Tareas activas</Text>
                </View>
                <Text style={mModal.infoValue}>{member.active_tasks} en progreso</Text>
              </View>
              <View style={[mModal.infoCard, { width: '100%' }]}>
                <View style={mModal.infoIconRow}>
                  <Mail size={14} color={colors.primary[600]} />
                  <Text style={mModal.infoLabel}>Email</Text>
                </View>
                <Text style={mModal.infoValue}>{member.email}</Text>
              </View>
            </View>

            {/* Botón eliminar (solo admin, no a sí mismo) */}
            {canManage && !isSelf && (
              <TouchableOpacity style={mModal.removeBtn} onPress={handleRemove} activeOpacity={0.85}>
                <Text style={mModal.removeBtnText}>Eliminar del proyecto</Text>
              </TouchableOpacity>
            )}
            <View style={{ height: 16 }} />
          </ScrollView>

          <View style={mModal.actions}>
            <TouchableOpacity style={mModal.btnCall} activeOpacity={0.85}>
              <Phone size={18} color={colors.primary[600]} />
              <Text style={mModal.btnCallText}>Llamar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={mModal.btnMessage} activeOpacity={0.85}>
              <MessageSquare size={18} color={colors.white} />
              <Text style={mModal.btnMessageText}>Mensaje</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Modal agregar miembro ────────────────────────────────────
function AddMemberModal({ visible, onClose, projectId, onAdded }: {
  visible: boolean; onClose: () => void; projectId: string; onAdded: () => void;
}) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('worker');
  const [saving, setSaving] = useState(false);

  const ROLES = ['worker', 'supervisor', 'project_manager', 'inspector', 'viewer'];

  const handleAdd = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Ingresa un email'); return; }
    setSaving(true);
    try {
      // Buscar usuario por email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (profileError || !profile) {
        Alert.alert('Usuario no encontrado', 'No existe un usuario con ese email en SitePro');
        return;
      }

      // Verificar que no sea ya miembro
      const { data: existing } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', profile.id)
        .single();

      if (existing) {
        Alert.alert('Ya es miembro', `${profile.full_name} ya pertenece a este proyecto`);
        return;
      }

      // Agregar
      const { error: insertError } = await supabase
        .from('project_members')
        .insert({ project_id: projectId, user_id: profile.id, role });

      if (insertError) throw insertError;

      toast.success('Miembro agregado', `${profile.full_name} fue agregado al proyecto`);
      setEmail(''); setRole('worker');
      onAdded();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'No se pudo agregar el miembro');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={mModal.overlay}>
        <View style={[mModal.sheet, { maxHeight: '60%' }]}>
          <View style={mModal.header}>
            <TouchableOpacity onPress={onClose}><Text style={{ color: colors.gray[500], fontSize: fontSize.base }}>Cancelar</Text></TouchableOpacity>
            <Text style={mModal.headerTitle}>Agregar Miembro</Text>
            <TouchableOpacity onPress={handleAdd} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color={colors.primary[600]} />
                : <Text style={{ color: colors.primary[600], fontSize: fontSize.base, fontWeight: fontWeight.semibold }}>Agregar</Text>
              }
            </TouchableOpacity>
          </View>
          <View style={{ padding: spacing.base, gap: spacing.base }}>
            <View>
              <Text style={addModal.label}>Email del usuario</Text>
              <TextInput
                style={addModal.input}
                value={email} onChangeText={setEmail}
                placeholder="usuario@email.com"
                placeholderTextColor={colors.gray[400]}
                keyboardType="email-address" autoCapitalize="none"
              />
            </View>
            <View>
              <Text style={addModal.label}>Rol en el proyecto</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                {ROLES.map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[addModal.rolePill, role === r && addModal.rolePillActive]}
                    onPress={() => setRole(r)}
                  >
                    <Text style={[addModal.rolePillText, role === r && addModal.rolePillTextActive]}>
                      {ROLE_LABELS[r] ?? r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Member Card ──────────────────────────────────────────────
function MemberCard({ member, onPress }: { member: TeamMember; onPress: () => void }) {
  const initials = member.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const roleLabel = ROLE_LABELS[member.role] ?? member.role;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Avatar initials={initials} size={48} showOnlineIndicator isOnline={member.is_online} />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.full_name}</Text>
          <Text style={styles.memberRole}>{member.job_title ?? roleLabel}</Text>
          <Text style={styles.memberZone}>{roleLabel}</Text>
        </View>
        <View style={styles.tasksBadge}>
          <Text style={styles.tasksBadgeNum}>{member.active_tasks}</Text>
          <Text style={styles.tasksBadgeLabel}>tareas</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.btnCall} activeOpacity={0.8}>
          <Phone size={14} color={colors.primary[600]} />
          <Text style={styles.btnCallText}>Llamar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnMessage} activeOpacity={0.8}>
          <MessageSquare size={14} color={colors.gray[700]} />
          <Text style={styles.btnMessageText}>Mensaje</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnProfile} onPress={onPress} activeOpacity={0.8}>
          <Text style={styles.btnProfileText}>Ver perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function TeamScreen() {
  const { colors: themeColors, isDark } = useTheme();
  const { currentProjectId, loadProjects } = useProjectsStore();
  const { user } = useAuthStore();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);

  // Verificar si el usuario actual es admin del proyecto
  const isAdmin = members.find(m => m.id === user?.id && ['admin', 'project_manager'].includes(m.role)) != null;

  const fetchMembers = useCallback(async () => {
    if (!currentProjectId) return;
    setIsLoading(true);
    const data = await loadMembers(currentProjectId);
    setMembers(data);
    setIsLoading(false);
  }, [currentProjectId]);

  useEffect(() => {
    loadProjects().then(fetchMembers);
  }, []);

  useEffect(() => {
    if (currentProjectId) fetchMembers();
  }, [currentProjectId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMembers();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(m =>
      m.full_name.toLowerCase().includes(q) ||
      (m.job_title ?? '').toLowerCase().includes(q) ||
      ROLE_LABELS[m.role]?.toLowerCase().includes(q)
    );
  }, [members, search]);

  const onlineCount = members.filter(m => m.is_online).length;

  if (isLoading) return <TeamScreenSkeleton />;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={themeColors.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.screenTitle}>Equipo</Text>
            <Text style={styles.memberCount}>{members.length} miembro{members.length !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.onlinePill}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>{onlineCount} en línea</Text>
            </View>
            {isAdmin && (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setShowAddMember(true)}
              >
                <UserPlus size={18} color={colors.dark[900]} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.searchContainer}>
          <Search size={iconSize.sm} color={colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar miembro..."
            placeholderTextColor={colors.gray[400]}
            value={search} onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={14} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />}
        ListEmptyComponent={
          search
            ? <EmptySearch title="Sin resultados" subtitle={`No se encontraron miembros para "${search}"`} />
            : <EmptyTeam
              title="Sin miembros"
              subtitle="Agrega miembros al proyecto para colaborar"
              cta={isAdmin ? { label: '+ Agregar miembro', onPress: () => setShowAddMember(true) } : undefined}
            />
        }
        renderItem={({ item }) => (
          <MemberCard member={item} onPress={() => setSelectedMember(item)} />
        )}
      />

      <MemberDetailModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        canManage={isAdmin}
        projectId={currentProjectId ?? ''}
        onRemoved={fetchMembers}
      />

      <AddMemberModal
        visible={showAddMember}
        onClose={() => setShowAddMember(false)}
        projectId={currentProjectId ?? ''}
        onAdded={fetchMembers}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { backgroundColor: '#FFFFFF', paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', ...shadows.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  screenTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: '#0F0F0F' },
  memberCount: { fontSize: fontSize.small, color: '#737373', marginTop: 2 },
  onlinePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  onlineText: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: '#047857' },
  addBtn: { backgroundColor: colors.primary[600], width: 36, height: 36, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D4D4D4', borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, height: 40, gap: spacing.sm },
  searchInput: { flex: 1, fontSize: fontSize.body, color: '#0F0F0F', paddingVertical: 0 },
  listContent: { padding: spacing.base, gap: spacing.md, paddingBottom: 32 },
  card: { backgroundColor: '#FFFFFF', borderRadius: borderRadius.md, borderWidth: 1, borderColor: '#F5F5F5', padding: spacing.base, gap: spacing.md, ...shadows.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  memberInfo: { flex: 1 },
  memberName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: '#0F0F0F' },
  memberRole: { fontSize: fontSize.body, color: '#737373', marginTop: 2 },
  memberZone: { fontSize: fontSize.small, color: '#EAAB00', marginTop: 2, fontWeight: fontWeight.medium },
  tasksBadge: { alignItems: 'center' },
  tasksBadgeNum: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#0F0F0F' },
  tasksBadgeLabel: { fontSize: fontSize.small, color: '#737373' },
  cardActions: { flexDirection: 'row', gap: spacing.sm },
  btnCall: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FFFBEB', paddingVertical: spacing.sm, borderRadius: borderRadius.sm },
  btnCallText: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: '#EAAB00' },
  btnMessage: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F5F5F5', paddingVertical: spacing.sm, borderRadius: borderRadius.sm },
  btnMessageText: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: '#333333' },
  btnProfile: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E8E8E8', paddingVertical: spacing.sm, borderRadius: borderRadius.sm },
  btnProfileText: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: '#333333' },
});

const mModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '88%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base, borderBottomWidth: 1, borderBottomColor: '#E8E8E8' },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#0F0F0F' },
  body: { padding: spacing.base },
  profileSection: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  memberName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: '#0F0F0F' },
  memberRole: { fontSize: fontSize.base, color: '#737373' },
  statsRow: { flexDirection: 'row', backgroundColor: '#EAAB00', borderRadius: borderRadius.md, marginBottom: spacing.base, overflow: 'hidden' },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  statValue: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: '#FFFFFF' },
  statLabel: { fontSize: fontSize.small, color: 'rgba(255,255,255,0.8)' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.base },
  infoCard: { width: '47%', backgroundColor: '#FAFAFA', borderRadius: borderRadius.md, padding: spacing.base, gap: spacing.xs },
  infoIconRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  infoLabel: { fontSize: fontSize.small, color: '#737373' },
  infoValue: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: '#0F0F0F' },
  removeBtn: { backgroundColor: '#FEF2F2', borderRadius: borderRadius.md, paddingVertical: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: '#FEE2E2', marginBottom: spacing.sm },
  removeBtnText: { color: '#EF4444', fontSize: fontSize.base, fontWeight: fontWeight.medium },
  actions: { flexDirection: 'row', padding: spacing.base, gap: spacing.md, borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingBottom: 32 },
  btnCall: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: '#FFFBEB', paddingVertical: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: '#FDE68A' },
  btnCallText: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: '#EAAB00' },
  btnMessage: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: '#EAAB00', paddingVertical: spacing.md, borderRadius: borderRadius.md },
  btnMessageText: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: '#FFFFFF' },
});

const addModal = StyleSheet.create({
  label: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: '#333333', marginBottom: spacing.xs },
  input: { borderWidth: 1, borderColor: '#D4D4D4', borderRadius: borderRadius.md, paddingHorizontal: spacing.base, paddingVertical: spacing.md, fontSize: fontSize.base, color: '#0F0F0F' },
  rolePill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E8E8E8' },
  rolePillActive: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  rolePillText: { fontSize: fontSize.small, color: '#737373', fontWeight: fontWeight.medium },
  rolePillTextActive: { color: '#EAAB00' },
});