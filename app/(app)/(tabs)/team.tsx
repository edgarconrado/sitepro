/**
 * SitePro — Team Screen
 */

import { Avatar } from '@components/ui/Avatar';
import { Badge } from '@components/ui/Badge';
import { colors } from '@theme/colors';
import { borderRadius, fontSize, fontWeight, iconSize, shadows, spacing } from '@theme/tokens';
import type { User } from '@types/index';
import {
  CheckSquare,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Star,
  X,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Mock team data ───────────────────────────────────────────
const TEAM_MEMBERS: (User & { specialty: string; completedTasks: number; email: string; zone: string })[] = [
  { id: '2', name: 'Juan Pérez', email: 'juan@sitepro.com', role: 'Electricista', initials: 'JP', isOnline: true, activeTasks: 3, completedTasks: 12, specialty: 'Instalaciones eléctricas', zone: 'Pisos 4-6' },
  { id: '3', name: 'María García', email: 'maria@sitepro.com', role: 'Plomero', initials: 'MG', isOnline: true, activeTasks: 2, completedTasks: 8, specialty: 'Plomería y sanitarios', zone: 'Pisos 1-3' },
  { id: '4', name: 'Carlos Ruiz', email: 'carlos@sitepro.com', role: 'Inspector', initials: 'CR', isOnline: false, activeTasks: 5, completedTasks: 20, specialty: 'Control de calidad', zone: 'Todo el edificio' },
  { id: '5', name: 'Ana López', email: 'ana@sitepro.com', role: 'Acabados', initials: 'AL', isOnline: true, activeTasks: 4, completedTasks: 15, specialty: 'Pintura y acabados', zone: 'Pisos 1-4' },
  { id: '6', name: 'Roberto Díaz', email: 'roberto@sitepro.com', role: 'Arquitecto', initials: 'RD', isOnline: false, activeTasks: 1, completedTasks: 6, specialty: 'Diseño estructural', zone: 'Coordinación general' },
  { id: '7', name: 'Laura Morales', email: 'laura@sitepro.com', role: 'Ingeniero', initials: 'LM', isOnline: true, activeTasks: 3, completedTasks: 9, specialty: 'Ingeniería civil', zone: 'Estructura' },
];

type TeamMember = typeof TEAM_MEMBERS[0];

// ─── Member Detail Modal ──────────────────────────────────────
function MemberDetailModal({ member, onClose }: { member: TeamMember | null; onClose: () => void }) {
  if (!member) return null;

  return (
    <Modal visible={!!member} transparent animationType="slide">
      <View style={mModal.overlay}>
        <View style={mModal.sheet}>
          {/* Header */}
          <View style={mModal.header}>
            <Text style={mModal.headerTitle}>Perfil del Miembro</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={iconSize.md} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={mModal.body}>
            {/* Profile header */}
            <View style={mModal.profileSection}>
              <Avatar initials={member.initials} size={72} showOnlineIndicator isOnline={member.isOnline} />
              <Text style={mModal.memberName}>{member.name}</Text>
              <Text style={mModal.memberRole}>{member.role}</Text>
              <Badge
                label={member.isOnline ? 'En línea' : 'Desconectado'}
                bg={member.isOnline ? colors.success[100] : colors.gray[100]}
                textColor={member.isOnline ? colors.success[700] : colors.gray[500]}
              />
            </View>

            {/* Stats row */}
            <View style={mModal.statsRow}>
              <View style={mModal.statCard}>
                <Text style={mModal.statValue}>{member.activeTasks}</Text>
                <Text style={mModal.statLabel}>Activas</Text>
              </View>
              <View style={mModal.statDivider} />
              <View style={mModal.statCard}>
                <Text style={mModal.statValue}>{member.completedTasks}</Text>
                <Text style={mModal.statLabel}>Completadas</Text>
              </View>
              <View style={mModal.statDivider} />
              <View style={mModal.statCard}>
                <Text style={mModal.statValue}>{member.activeTasks + member.completedTasks}</Text>
                <Text style={mModal.statLabel}>Total</Text>
              </View>
            </View>

            {/* Info cards */}
            <View style={mModal.infoGrid}>
              <View style={mModal.infoCard}>
                <View style={mModal.infoIconRow}>
                  <Star size={14} color={colors.primary[600]} />
                  <Text style={mModal.infoLabel}>Especialidad</Text>
                </View>
                <Text style={mModal.infoValue}>{member.specialty}</Text>
              </View>
              <View style={mModal.infoCard}>
                <View style={mModal.infoIconRow}>
                  <MapPin size={14} color={colors.primary[600]} />
                  <Text style={mModal.infoLabel}>Zona asignada</Text>
                </View>
                <Text style={mModal.infoValue}>{member.zone}</Text>
              </View>
              <View style={mModal.infoCard}>
                <View style={mModal.infoIconRow}>
                  <Mail size={14} color={colors.primary[600]} />
                  <Text style={mModal.infoLabel}>Email</Text>
                </View>
                <Text style={mModal.infoValue}>{member.email}</Text>
              </View>
              <View style={mModal.infoCard}>
                <View style={mModal.infoIconRow}>
                  <CheckSquare size={14} color={colors.primary[600]} />
                  <Text style={mModal.infoLabel}>Tareas activas</Text>
                </View>
                <Text style={mModal.infoValue}>{member.activeTasks} en progreso</Text>
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
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

// ─── Member Card ──────────────────────────────────────────────
function MemberCard({ member, onPress }: { member: TeamMember; onPress: () => void }) {
  return (
    <View style={styles.card}>
      {/* Avatar + info */}
      <View style={styles.cardTop}>
        <Avatar
          initials={member.initials}
          size={48}
          showOnlineIndicator
          isOnline={member.isOnline}
        />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.name}</Text>
          <Text style={styles.memberRole}>{member.role}</Text>
          <Text style={styles.memberZone}>{member.zone}</Text>
        </View>
        <View style={styles.tasksBadge}>
          <Text style={styles.tasksBadgeNum}>{member.activeTasks}</Text>
          <Text style={styles.tasksBadgeLabel}>tareas</Text>
        </View>
      </View>

      {/* Action buttons */}
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
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return TEAM_MEMBERS;
    const q = search.toLowerCase();
    return TEAM_MEMBERS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.zone.toLowerCase().includes(q)
    );
  }, [search]);

  const onlineCount = TEAM_MEMBERS.filter((m) => m.isOnline).length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>Equipo</Text>
          <View style={styles.onlinePill}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>{onlineCount} en línea</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Search size={iconSize.sm} color={colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar miembro del equipo..."
            placeholderTextColor={colors.gray[400]}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={14} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptySubtitle}>No se encontraron miembros para "{search}"</Text>
          </View>
        }
        renderItem={({ item }) => (
          <MemberCard member={item} onPress={() => setSelectedMember(item)} />
        )}
      />

      <MemberDetailModal member={selectedMember} onClose={() => setSelectedMember(null)} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background.secondary },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    ...shadows.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  screenTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.text.primary },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.success[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success[500] },
  onlineText: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: colors.success[700] },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    height: 40,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: fontSize.body, color: colors.text.primary, paddingVertical: 0 },
  listContent: { padding: spacing.base, gap: spacing.md, paddingBottom: 32 },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[100],
    padding: spacing.base,
    gap: spacing.md,
    ...shadows.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  memberInfo: { flex: 1 },
  memberName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text.primary },
  memberRole: { fontSize: fontSize.body, color: colors.text.tertiary, marginTop: 2 },
  memberZone: { fontSize: fontSize.small, color: colors.primary[600], marginTop: 2, fontWeight: fontWeight.medium },
  tasksBadge: { alignItems: 'center' },
  tasksBadgeNum: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text.primary },
  tasksBadgeLabel: { fontSize: fontSize.small, color: colors.text.tertiary },

  // Card buttons
  cardActions: { flexDirection: 'row', gap: spacing.sm },
  btnCall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary[50],
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  btnCallText: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: colors.primary[600] },
  btnMessage: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.gray[100],
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  btnMessageText: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: colors.gray[700] },
  btnProfile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  btnProfileText: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: colors.text.secondary },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 60, gap: spacing.sm },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text.secondary },
  emptySubtitle: { fontSize: fontSize.body, color: colors.text.tertiary, textAlign: 'center' },
});

// ─── Modal Styles ─────────────────────────────────────────────
const mModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '88%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.gray[200] },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text.primary },
  body: { padding: spacing.base },

  // Profile section
  profileSection: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  memberName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text.primary },
  memberRole: { fontSize: fontSize.base, color: colors.text.tertiary },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.md,
    marginBottom: spacing.base,
    overflow: 'hidden',
  },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  statValue: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.white },
  statLabel: { fontSize: fontSize.small, color: `${colors.white}CC` },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Info grid
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  infoCard: { width: '47%', backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, padding: spacing.base, gap: spacing.xs },
  infoIconRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  infoLabel: { fontSize: fontSize.small, color: colors.text.tertiary },
  infoValue: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: colors.text.primary },

  // Actions
  actions: {
    flexDirection: 'row',
    padding: spacing.base,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingBottom: 32,
  },
  btnCall: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary[50],
    paddingVertical: spacing.md, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.primary[200],
  },
  btnCallText: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.primary[600] },
  btnMessage: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary[600],
    paddingVertical: spacing.md, borderRadius: borderRadius.md,
  },
  btnMessageText: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.white },
});