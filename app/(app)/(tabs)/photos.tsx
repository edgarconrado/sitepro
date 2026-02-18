/**
 * SitePro — Photos Screen
 */

import { Avatar } from '@components/ui/Avatar';
import { FAB } from '@components/ui/FAB';
import { colors } from '@theme/colors';
import { borderRadius, fontSize, fontWeight, iconSize, shadows, spacing } from '@theme/tokens';
import { formatDate, timeAgo } from '@utils/index';
import {
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  MapPin,
  Share2,
  Trash2,
  User,
  X,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_GAP = spacing.sm;
const CARD_SIZE = (SCREEN_WIDTH - spacing.base * 2 - COLUMN_GAP) / 2;

// ─── Mock Data ────────────────────────────────────────────────
interface MockPhoto {
  id: string;
  uri: string;
  location: string;
  zone: string;
  uploadedBy: { name: string; initials: string };
  capturedAt: string;
  notes?: string;
  tags: string[];
  color: string; // placeholder color when no real image
}

const PHOTOS: MockPhoto[] = [
  { id: '1', uri: '', location: 'Piso 5 - Zona A', zone: 'Zona A', uploadedBy: { name: 'Juan Pérez', initials: 'JP' }, capturedAt: '2026-02-17T14:30:00Z', notes: 'Avance del cableado eléctrico en el piso 5, zona A. Instalación completada al 80%.', tags: ['eléctrico', 'piso-5'], color: '#1E3A5F' },
  { id: '2', uri: '', location: 'Piso 3 - Baños', zone: 'Baños', uploadedBy: { name: 'Ana López', initials: 'AL' }, capturedAt: '2026-02-16T11:00:00Z', notes: 'Estado de instalaciones de plomería en baños del piso 3.', tags: ['plomería', 'piso-3'], color: '#2D5016' },
  { id: '3', uri: '', location: 'Piso 7 - Estructura', zone: 'Estructura', uploadedBy: { name: 'Carlos Ruiz', initials: 'CR' }, capturedAt: '2026-02-15T09:15:00Z', notes: 'Revisión de columnas estructurales en nivel 7. Sin anomalías detectadas.', tags: ['estructura', 'piso-7'], color: '#4A1A1A' },
  { id: '4', uri: '', location: 'Fachada Norte', zone: 'Fachada', uploadedBy: { name: 'María García', initials: 'MG' }, capturedAt: '2026-02-14T16:45:00Z', notes: 'Vista general de la fachada norte. Encofrado listo para vaciado.', tags: ['fachada', 'exterior'], color: '#1A3A4A' },
  { id: '5', uri: '', location: 'Lobby - PB', zone: 'Planta Baja', uploadedBy: { name: 'Juan Pérez', initials: 'JP' }, capturedAt: '2026-02-13T10:00:00Z', notes: 'Avance en acabados del lobby principal.', tags: ['acabados', 'lobby'], color: '#3A2D1A' },
  { id: '6', uri: '', location: 'Cuarto de Máquinas', zone: 'Sótano', uploadedBy: { name: 'Carlos Ruiz', initials: 'CR' }, capturedAt: '2026-02-12T08:30:00Z', notes: 'Instalación de equipos mecánicos en cuarto de máquinas.', tags: ['mecánico', 'sótano'], color: '#2A1A3A' },
  { id: '7', uri: '', location: 'Piso 10 - Losa', zone: 'Techo', uploadedBy: { name: 'Ana López', initials: 'AL' }, capturedAt: '2026-02-11T13:20:00Z', notes: 'Losa del piso 10 terminada, lista para siguiente nivel.', tags: ['losa', 'piso-10'], color: '#1A2A1A' },
  { id: '8', uri: '', location: 'Escalera de Emergencia', zone: 'Circulación', uploadedBy: { name: 'María García', initials: 'MG' }, capturedAt: '2026-02-10T15:00:00Z', notes: 'Escalera de emergencia en proceso de instalación de pasamanos.', tags: ['escalera', 'seguridad'], color: '#3A1A1A' },
];

// ─── Photo Viewer Modal ───────────────────────────────────────
function PhotoViewer({
  photo,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  photo: MockPhoto;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <View style={viewer.container}>
        {/* Top bar */}
        <SafeAreaView style={viewer.topBar}>
          <TouchableOpacity onPress={onClose} style={viewer.iconBtn}>
            <X size={iconSize.md} color={colors.white} />
          </TouchableOpacity>
          <Text style={viewer.topTitle} numberOfLines={1}>{photo.location}</Text>
          <TouchableOpacity style={viewer.iconBtn}>
            <Share2 size={iconSize.md} color={colors.white} />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Image area */}
        <View style={viewer.imageArea}>
          {/* Placeholder with color + icon */}
          <View style={[viewer.imagePlaceholder, { backgroundColor: photo.color }]}>
            <Camera size={48} color={`${colors.white}40`} strokeWidth={1} />
            <Text style={viewer.imagePlaceholderText}>{photo.location}</Text>
          </View>

          {/* Prev / Next */}
          {hasPrev && (
            <TouchableOpacity style={[viewer.navBtn, viewer.navLeft]} onPress={onPrev}>
              <ChevronLeft size={iconSize.lg} color={colors.white} />
            </TouchableOpacity>
          )}
          {hasNext && (
            <TouchableOpacity style={[viewer.navBtn, viewer.navRight]} onPress={onNext}>
              <ChevronRight size={iconSize.lg} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom info */}
        <View style={viewer.infoSheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Meta row */}
            <View style={viewer.metaRow}>
              <Avatar initials={photo.uploadedBy.initials} size={36} />
              <View style={viewer.metaInfo}>
                <Text style={viewer.metaName}>{photo.uploadedBy.name}</Text>
                <Text style={viewer.metaTime}>{timeAgo(photo.capturedAt)}</Text>
              </View>
              <TouchableOpacity style={viewer.downloadBtn}>
                <Download size={18} color={colors.primary[600]} />
              </TouchableOpacity>
            </View>

            {/* Details */}
            <View style={viewer.detailsGrid}>
              <View style={viewer.detailItem}>
                <MapPin size={14} color={colors.primary[600]} />
                <Text style={viewer.detailText}>{photo.location}</Text>
              </View>
              <View style={viewer.detailItem}>
                <Calendar size={14} color={colors.primary[600]} />
                <Text style={viewer.detailText}>{formatDate(photo.capturedAt)}</Text>
              </View>
              <View style={viewer.detailItem}>
                <User size={14} color={colors.primary[600]} />
                <Text style={viewer.detailText}>{photo.uploadedBy.name}</Text>
              </View>
            </View>

            {/* Notes */}
            {photo.notes && (
              <View style={viewer.notesCard}>
                <Text style={viewer.notesLabel}>Notas</Text>
                <Text style={viewer.notesText}>{photo.notes}</Text>
              </View>
            )}

            {/* Tags */}
            <View style={viewer.tagsRow}>
              {photo.tags.map((tag) => (
                <View key={tag} style={viewer.tag}>
                  <Text style={viewer.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>

            {/* Delete */}
            <TouchableOpacity style={viewer.deleteBtn}>
              <Trash2 size={16} color={colors.error[500]} />
              <Text style={viewer.deleteBtnText}>Eliminar foto</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Photo Card ───────────────────────────────────────────────
function PhotoCard({ photo, onPress }: { photo: MockPhoto; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Image placeholder */}
      <View style={[styles.image, { backgroundColor: photo.color }]}>
        <Camera size={28} color={`${colors.white}30`} strokeWidth={1} />
      </View>

      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.overlayRow}>
          <MapPin size={10} color={colors.white} />
          <Text style={styles.overlayLocation} numberOfLines={1}>{photo.location}</Text>
        </View>
        <View style={styles.overlayMeta}>
          <Text style={styles.overlayUser}>{photo.uploadedBy.name.split(' ')[0]}</Text>
          <Text style={styles.overlayDate}>{timeAgo(photo.capturedAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────
const ZONES = ['Todas', 'Zona A', 'Baños', 'Estructura', 'Fachada', 'Planta Baja', 'Sótano', 'Techo', 'Circulación'];

// ─── Main Screen ──────────────────────────────────────────────
export default function PhotosScreen() {
  const [activeZone, setActiveZone] = useState('Todas');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (activeZone === 'Todas') return PHOTOS;
    return PHOTOS.filter((p) => p.zone === activeZone);
  }, [activeZone]);

  const handleOpen = (index: number) => setSelectedIndex(index);
  const handleClose = () => setSelectedIndex(null);
  const handlePrev = () => setSelectedIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  const handleNext = () => setSelectedIndex((i) => (i !== null && i < filtered.length - 1 ? i + 1 : i));

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>Fotos</Text>
          <Text style={styles.photoCount}>{PHOTOS.length} fotos</Text>
        </View>

        {/* Zone filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
          style={styles.filtersScroll}
        >
          {ZONES.map((zone) => (
            <TouchableOpacity
              key={zone}
              onPress={() => setActiveZone(zone)}
              style={[styles.pill, activeZone === zone && styles.pillActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.pillText, activeZone === zone && styles.pillTextActive]}>
                {zone}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Grid */}
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Camera size={40} color={colors.gray[300]} />
          <Text style={styles.emptyTitle}>Sin fotos</Text>
          <Text style={styles.emptySubtitle}>No hay fotos en esta zona todavía</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <PhotoCard photo={item} onPress={() => handleOpen(index)} />
          )}
        />
      )}

      {/* FAB — cámara púrpura */}
      <FAB
        onPress={() => { }}
        color={colors.purple[500]}
        icon={<Camera size={24} color={colors.white} />}
      />

      {/* Viewer */}
      {selectedIndex !== null && filtered[selectedIndex] && (
        <PhotoViewer
          photo={filtered[selectedIndex]}
          onClose={handleClose}
          onPrev={handlePrev}
          onNext={handleNext}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < filtered.length - 1}
        />
      )}
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
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  screenTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.text.primary },
  photoCount: { fontSize: fontSize.body, color: colors.text.tertiary, fontWeight: fontWeight.medium },
  filtersScroll: { marginHorizontal: -spacing.base },
  filtersContent: { paddingHorizontal: spacing.base, gap: spacing.sm },
  pill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.full, backgroundColor: colors.gray[100] },
  pillActive: { backgroundColor: colors.purple[500] },
  pillText: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: colors.gray[700] },
  pillTextActive: { color: colors.white },

  // Grid
  grid: { padding: spacing.base, paddingBottom: 100 },
  row: { gap: COLUMN_GAP, marginBottom: COLUMN_GAP },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.md,
  },
  image: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    paddingTop: spacing.lg,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  overlayRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  overlayLocation: { fontSize: 11, fontWeight: fontWeight.medium, color: colors.white, flex: 1 },
  overlayMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  overlayUser: { fontSize: 10, color: `${colors.white}CC` },
  overlayDate: { fontSize: 10, color: `${colors.white}99` },

  // Empty
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text.secondary },
  emptySubtitle: { fontSize: fontSize.body, color: colors.text.tertiary },
});

// ─── Viewer Styles ────────────────────────────────────────────
const viewer = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  iconBtn: { padding: spacing.sm, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.1)' },
  topTitle: { flex: 1, textAlign: 'center', fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.white, marginHorizontal: spacing.sm },

  // Image
  imageArea: { flex: 1, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  imagePlaceholder: { width: SCREEN_WIDTH, flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  imagePlaceholderText: { fontSize: fontSize.base, color: `${colors.white}60`, fontWeight: fontWeight.medium },
  navBtn: {
    position: 'absolute',
    top: '50%',
    width: 40, height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    transform: [{ translateY: -20 }],
  },
  navLeft: { left: spacing.base },
  navRight: { right: spacing.base },

  // Info sheet
  infoSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.base,
    paddingBottom: 32,
    maxHeight: 320,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  metaInfo: { flex: 1 },
  metaName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text.primary },
  metaTime: { fontSize: fontSize.small, color: colors.text.tertiary },
  downloadBtn: { padding: spacing.sm, backgroundColor: colors.primary[50], borderRadius: borderRadius.sm },

  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.gray[50], paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
  detailText: { fontSize: fontSize.small, color: colors.text.secondary },

  notesCard: { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  notesLabel: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: colors.text.tertiary, marginBottom: 4 },
  notesText: { fontSize: fontSize.body, color: colors.text.secondary, lineHeight: 20 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  tag: { backgroundColor: colors.purple[50], paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  tagText: { fontSize: fontSize.small, color: colors.purple[600], fontWeight: fontWeight.medium },

  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.error[50] },
  deleteBtnText: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: colors.error[500] },
});