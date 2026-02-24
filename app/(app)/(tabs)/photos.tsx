/**
 * SitePro — Photos Screen
 */

import { colors } from '@/theme';
import { StaggerItem } from '@components/ui/Animated';
import { Avatar } from '@components/ui/Avatar';
import { ConfirmDialogContainer, useConfirm } from '@components/ui/ConfirmDialog';
import { EmptyPhotos } from '@components/ui/EmptyStates';
import { FAB } from '@components/ui/FAB';
import { PhotosScreenSkeleton, useSimulatedLoading } from '@components/ui/Skeletons';
import { useToast } from '@components/ui/Toast';
import { useTheme } from '@hooks/useTheme';
import { borderRadius, fontSize, fontWeight, iconSize, shadows, spacing } from '@theme/tokens';
import { formatDate, timeAgo } from '@utils/index';
import { CameraType, CameraView, FlashMode, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import {
  AlignLeft,
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  ImagePlus,
  MapPin,
  Plus,
  Share2,
  SwitchCamera,
  Tag,
  Trash2,
  User,
  X,
  Zap,
  ZapOff,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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
  color: string;
  isReal?: boolean; // true if captured from real camera/gallery
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
  onDelete,
}: {
  photo: MockPhoto;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onDelete: () => void;
}) {
  const confirm = useConfirm();
  const toast = useToast();

  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <View style={viewer.container}>
        {/* Top bar */}
        <View style={viewer.topBar}>
          <TouchableOpacity onPress={onClose} style={viewer.iconBtn} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
            <X size={iconSize.md} color={colors.white} />
          </TouchableOpacity>
          <Text style={viewer.topTitle} numberOfLines={1}>{photo.location}</Text>
          <TouchableOpacity style={viewer.iconBtn}>
            <Share2 size={iconSize.md} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Image area */}
        <View style={viewer.imageArea}>
          {/* Placeholder with color + icon */}
          <View style={[viewer.imagePlaceholder, { backgroundColor: photo.color }]}>
            {photo.uri ? (
              <Image
                source={{ uri: photo.uri }}
                style={StyleSheet.absoluteFill}
                resizeMode="contain"
              />
            ) : (
              <>
                <Camera size={48} color={`${colors.white}40`} strokeWidth={1} />
                <Text style={viewer.imagePlaceholderText}>{photo.location}</Text>
              </>
            )}
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
            <TouchableOpacity
              style={viewer.deleteBtn}
              onPress={() => confirm.confirm({
                title: 'Eliminar foto',
                message: `¿Eliminar esta foto de ${photo.zone}? No podrá recuperarse.`,
                confirmLabel: 'Sí, eliminar',
                icon: 'trash',
                variant: 'danger',
                onConfirm: () => { try { onDelete(); toast.success('Foto eliminada', `Foto de ${photo.zone}`); onClose(); } catch { toast.error('Error al eliminar', 'Inténtalo de nuevo'); } },
              })}
            >
              <Trash2 size={16} color={colors.error[500]} />
              <Text style={viewer.deleteBtnText}>Eliminar foto</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
      <ConfirmDialogContainer />
    </Modal>
  );
}

// ─── Photo Card ───────────────────────────────────────────────
function PhotoCard({ photo, onPress }: { photo: MockPhoto; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Image or placeholder */}
      <View style={[styles.image, { backgroundColor: photo.color }]}>
        {photo.uri ? (
          <Image
            source={{ uri: photo.uri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <Camera size={28} color={`${colors.white}30`} strokeWidth={1} />
        )}
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


// ─── Photo Form Modal ─────────────────────────────────────────
const ZONE_OPTIONS = ['Zona A', 'Baños', 'Estructura', 'Fachada', 'Planta Baja', 'Sótano', 'Techo', 'Circulación', 'General'];
const TAG_SUGGESTIONS = ['eléctrico', 'plomería', 'estructura', 'fachada', 'acabados', 'seguridad', 'losa', 'escalera', 'mecánico', 'urgente'];

function PhotoFormModal({
  uri,
  onSave,
  onDiscard,
}: {
  uri: string;
  onSave: (data: { location: string; zone: string; notes: string; tags: string[] }) => void;
  onDiscard: () => void;
}) {
  const [location, setLocation] = useState('');
  const [zone, setZone] = useState('General');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showZonePicker, setShowZonePicker] = useState(false);

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const addCustomTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const handleSave = () => {
    onSave({ location: location.trim(), zone, notes: notes.trim(), tags });
  };

  return (
    <View style={photoForm.fullscreen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={photoForm.header}>
          <TouchableOpacity onPress={onDiscard} style={photoForm.discardBtn}>
            <X size={18} color={colors.gray[600]} />
            <Text style={photoForm.discardText}>Descartar</Text>
          </TouchableOpacity>
          <Text style={photoForm.headerTitle}>Detalles de la foto</Text>
          <TouchableOpacity onPress={handleSave} style={photoForm.saveBtn}>
            <Text style={photoForm.saveBtnText}>Guardar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={photoForm.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Photo preview */}
          <View style={photoForm.previewContainer}>
            <Image source={{ uri }} style={photoForm.preview} resizeMode="cover" />
            <View style={photoForm.previewBadge}>
              <Camera size={12} color={colors.white} />
              <Text style={photoForm.previewBadgeText}>Nueva foto</Text>
            </View>
          </View>

          {/* Location */}
          <View style={photoForm.field}>
            <View style={photoForm.fieldLabelRow}>
              <MapPin size={14} color={colors.primary[500]} />
              <Text style={photoForm.fieldLabel}>Ubicación</Text>
              <Text style={photoForm.optional}>opcional</Text>
            </View>
            <TextInput
              style={photoForm.input}
              placeholder="Ej: Piso 5, Eje 3, Columna B-4..."
              placeholderTextColor={colors.gray[400]}
              value={location}
              onChangeText={setLocation}
              maxLength={60}
            />
          </View>

          {/* Zone picker */}
          <View style={photoForm.field}>
            <View style={photoForm.fieldLabelRow}>
              <User size={14} color={colors.primary[500]} />
              <Text style={photoForm.fieldLabel}>Zona del proyecto</Text>
            </View>
            <TouchableOpacity
              style={photoForm.zonePicker}
              onPress={() => setShowZonePicker(v => !v)}
              activeOpacity={0.8}
            >
              <Text style={photoForm.zonePickerText}>{zone}</Text>
              <ChevronRight
                size={16}
                color={colors.gray[400]}
                style={{ transform: [{ rotate: showZonePicker ? '90deg' : '0deg' }] }}
              />
            </TouchableOpacity>
            {showZonePicker && (
              <View style={photoForm.zoneList}>
                {ZONE_OPTIONS.map(z => (
                  <TouchableOpacity
                    key={z}
                    style={[photoForm.zoneOption, zone === z && photoForm.zoneOptionActive]}
                    onPress={() => { setZone(z); setShowZonePicker(false); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[photoForm.zoneOptionText, zone === z && photoForm.zoneOptionTextActive]}>
                      {z}
                    </Text>
                    {zone === z && <Text style={{ color: colors.primary[600] }}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Notes */}
          <View style={photoForm.field}>
            <View style={photoForm.fieldLabelRow}>
              <AlignLeft size={14} color={colors.primary[500]} />
              <Text style={photoForm.fieldLabel}>Notas</Text>
              <Text style={photoForm.optional}>opcional</Text>
            </View>
            <TextInput
              style={[photoForm.input, photoForm.textarea]}
              placeholder="Describe el avance, observaciones o puntos de atención..."
              placeholderTextColor={colors.gray[400]}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={300}
            />
            <Text style={photoForm.charCount}>{notes.length}/300</Text>
          </View>

          {/* Tags */}
          <View style={photoForm.field}>
            <View style={photoForm.fieldLabelRow}>
              <Tag size={14} color={colors.primary[500]} />
              <Text style={photoForm.fieldLabel}>Etiquetas</Text>
              <Text style={photoForm.optional}>opcional</Text>
            </View>

            {/* Suggestions */}
            <View style={photoForm.tagGrid}>
              {TAG_SUGGESTIONS.map(tag => {
                const active = tags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[photoForm.tagChip, active && photoForm.tagChipActive]}
                    onPress={() => toggleTag(tag)}
                    activeOpacity={0.75}
                  >
                    <Text style={[photoForm.tagChipText, active && photoForm.tagChipTextActive]}>
                      #{tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom tag input */}
            <View style={photoForm.tagInputRow}>
              <TextInput
                style={photoForm.tagInput}
                placeholder="Agregar etiqueta personalizada..."
                placeholderTextColor={colors.gray[400]}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addCustomTag}
                returnKeyType="done"
                maxLength={20}
              />
              {tagInput.length > 0 && (
                <TouchableOpacity style={photoForm.tagAddBtn} onPress={addCustomTag}>
                  <Plus size={16} color={colors.white} />
                </TouchableOpacity>
              )}
            </View>

            {/* Selected tags */}
            {tags.length > 0 && (
              <View style={photoForm.selectedTags}>
                {tags.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={photoForm.selectedTag}
                    onPress={() => toggleTag(tag)}
                    activeOpacity={0.75}
                  >
                    <Text style={photoForm.selectedTagText}>#{tag}</Text>
                    <X size={10} color={colors.primary[600]} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────

// ─── Camera Modal ─────────────────────────────────────────────
function CameraModal({ onClose, onCapture }: {
  onClose: () => void;
  onCapture: (uri: string) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [capturing, setCapturing] = useState(false);
  const [ready, setReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Small delay so the camera initializes after navigation settles
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleCapture = async () => {
    if (!cameraRef.current || capturing || !ready) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        base64: false,
        skipProcessing: true, // faster on Android
      });
      if (photo?.uri) onCapture(photo.uri);
    } catch (e) {
      Alert.alert('Error', 'No se pudo capturar la foto. Intenta de nuevo.');
      setCapturing(false);
    }
  };

  if (!permission) {
    return (
      <View style={cam.fullscreen}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <ActivityIndicator size="large" color={colors.white} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={cam.fullscreen}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <Camera size={48} color="rgba(255,255,255,0.5)" />
        <Text style={cam.permTitle}>Permiso de cámara requerido</Text>
        <Text style={cam.permSub}>SitePro necesita acceso a la cámara para capturar fotos del proyecto.</Text>
        <TouchableOpacity style={cam.permBtn} onPress={requestPermission}>
          <Text style={cam.permBtnText}>Permitir acceso</Text>
        </TouchableOpacity>
        <TouchableOpacity style={cam.permCancel} onPress={onClose}>
          <Text style={cam.permCancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={cam.fullscreen}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <CameraView
        ref={cameraRef}
        style={cam.camera}
        facing={facing}
        flash={flash}
        onCameraReady={() => setReady(true)}
      >
        {/* Top controls */}
        <View style={cam.topBar}>
          <TouchableOpacity style={cam.iconBtn} onPress={onClose}>
            <X size={22} color={colors.white} />
          </TouchableOpacity>
          <Text style={cam.topTitle}>Capturar foto</Text>
          <TouchableOpacity
            style={cam.iconBtn}
            onPress={() => setFlash(f => f === 'off' ? 'on' : 'off')}
          >
            {flash === 'off'
              ? <ZapOff size={22} color={colors.white} />
              : <Zap size={22} color={colors.warning[400]} />
            }
          </TouchableOpacity>
        </View>

        {/* Grid overlay */}
        <View style={cam.gridOverlay} pointerEvents="none">
          <View style={[cam.gridLine, { top: '33%', width: '100%', height: 1 }]} />
          <View style={[cam.gridLine, { top: '66%', width: '100%', height: 1 }]} />
          <View style={[cam.gridCol, { left: '33%' }]} />
          <View style={[cam.gridCol, { left: '66%' }]} />
        </View>

        {/* Bottom controls */}
        <View style={cam.bottomBar}>
          <TouchableOpacity
            style={cam.sideBtn}
            onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
          >
            <SwitchCamera size={26} color={colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[cam.shutter, capturing && cam.shutterCapturing]}
            onPress={handleCapture}
            activeOpacity={0.85}
            disabled={capturing || !ready}
          >
            {capturing
              ? <ActivityIndicator color={colors.primary[400]} />
              : <View style={cam.shutterInner} />
            }
          </TouchableOpacity>

          <View style={cam.sideBtn} />
        </View>
      </CameraView>
    </View>
  );
}

export default function PhotosScreen() {
  const { colors, isDark } = useTheme();

  const [activeZone, setActiveZone] = useState('Todas');
  const [photos, setPhotos] = useState<MockPhoto[]>(PHOTOS);
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showPermDialog, setShowPermDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'camera' | 'gallery' | null>(null);
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const pendingGallery = useRef(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (activeZone === 'Todas') return photos;
    return photos.filter((p) => p.zone === activeZone);
  }, [activeZone, photos]);

  const handleAddPhoto = (uri: string, meta?: { location: string; zone: string; notes: string; tags: string[] }) => {
    const newPhoto: MockPhoto = {
      id: `photo-${Date.now()}`,
      uri,
      location: meta?.location || 'Sin ubicación',
      zone: meta?.zone || 'General',
      uploadedBy: { name: 'Tú', initials: 'TU' },
      capturedAt: new Date().toISOString(),
      notes: meta?.notes || '',
      tags: meta?.tags?.length ? meta.tags : [],
      color: '#1E3A5F',
      isReal: true,
    };
    setPhotos(prev => [newPhoto, ...prev]);
  };

  const openGalleryAfterPermission = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.5,
        exif: false,
      });
      if (!result.canceled && result.assets[0]) {
        setPendingUri(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo abrir la galería. Intenta de nuevo.');
    }
  };

  const handleOpenGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Activa el acceso a la galería en los ajustes del dispositivo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.5,
        exif: false,
      });
      if (!result.canceled && result.assets[0]) {
        setPendingUri(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo abrir la galería.');
    }
  };

  const handleOpenCameraBtn = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Activa el acceso a la cámara en los ajustes del dispositivo.');
        return;
      }
      setShowCamera(true);
    } catch (e) {
      Alert.alert('Error', 'No se pudo abrir la cámara.');
    }
  };

  const handleGrantPermission = async () => {
    setShowPermDialog(false);
    const action = pendingAction;
    setPendingAction(null);
    // Wait for dialog close animation
    setTimeout(async () => {
      if (action === 'gallery') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status === 'granted') {
          await openGalleryAfterPermission();
        } else {
          Alert.alert('Permiso denegado', 'Para agregar fotos de tu galería, activa el permiso en Ajustes del dispositivo.', [{ text: 'Entendido' }]);
        }
      } else if (action === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status === 'granted') {
          setShowCamera(true);
        } else {
          Alert.alert('Permiso denegado', 'Para usar la cámara, activa el permiso en Ajustes del dispositivo.', [{ text: 'Entendido' }]);
        }
      }
    }, 400);
  };

  const handleOpen = (index: number) => setSelectedIndex(index);
  const handleClose = () => setSelectedIndex(null);
  const handlePrev = () => setSelectedIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  const handleNext = () => setSelectedIndex((i) => (i !== null && i < filtered.length - 1 ? i + 1 : i));

  const isLoading = useSimulatedLoading();
  if (isLoading) return <PhotosScreenSkeleton />;

  return (
    <>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

        {/* Filters Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.screenTitle}>Fotos</Text>
            <Text style={styles.photoCount}>{photos.length} fotos</Text>
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
          <EmptyPhotos
            title="Sin fotos en esta zona"
            subtitle="Registra el avance de obra con fotos. Abre la cámara o selecciona de tu galería."
            cta={{ label: '📷 Abrir cámara', onPress: () => setShowCameraOptions(true) }}
          />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <StaggerItem index={index}>
                <PhotoCard photo={item} onPress={() => handleOpen(index)} />
              </StaggerItem>
            )}
          />
        )}

        {/* FAB — cámara */}
        <FAB
          onPress={() => {
            Alert.alert(
              'Agregar foto',
              '¿Cómo quieres agregar la foto?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: '📷 Cámara', onPress: handleOpenCameraBtn },
                { text: '🖼️ Galería', onPress: handleOpenGallery },
              ]
            );
          }}
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
            onDelete={() => {
              if (selectedIndex !== null) {
                setPhotos(prev => prev.filter((_, i) => i !== selectedIndex));
                setSelectedIndex(null);
              }
            }}
          />
        )}

        {/* Permission Dialog */}
        <Modal visible={showPermDialog} transparent animationType="fade">
          <View style={permDlg.overlay}>
            <View style={permDlg.card}>
              {/* Icon */}
              <View style={permDlg.iconRow}>
                <View style={[permDlg.iconBg, { backgroundColor: pendingAction === 'camera' ? colors.primary[50] : colors.success[50] }]}>
                  {pendingAction === 'camera'
                    ? <Camera size={28} color={colors.primary[600]} />
                    : <ImagePlus size={28} color={colors.success[600]} />
                  }
                </View>
              </View>

              {/* Title */}
              <Text style={permDlg.title}>
                {pendingAction === 'camera' ? 'Permiso de cámara' : 'Permiso de galería'}
              </Text>

              {/* Description */}
              <Text style={permDlg.desc}>
                {pendingAction === 'camera'
                  ? 'SitePro necesita acceso a la cámara para que puedas capturar fotos del avance de obra directamente desde la app.'
                  : 'SitePro necesita acceso a tu galería para que puedas seleccionar fotos existentes y agregarlas al proyecto.'
                }
              </Text>

              {/* What we use it for */}
              <View style={permDlg.reasonBox}>
                <Text style={permDlg.reasonTitle}>¿Para qué se usa?</Text>
                {(pendingAction === 'camera' ? [
                  '📸 Capturar el avance de obra en tiempo real',
                  '🔒 Las fotos solo se guardan en tu proyecto',
                  '🚫 No accedemos a otras apps ni datos',
                ] : [
                  '🖼️ Seleccionar fotos del proyecto desde tu galería',
                  '🔒 Solo accedemos a las fotos que tú elijas',
                  '🚫 No modificamos ni eliminamos tus fotos',
                ]).map((item, i) => (
                  <Text key={i} style={permDlg.reasonItem}>{item}</Text>
                ))}
              </View>

              {/* Buttons */}
              <TouchableOpacity style={permDlg.btnPrimary} onPress={handleGrantPermission} activeOpacity={0.88}>
                <Text style={permDlg.btnPrimaryText}>
                  {pendingAction === 'camera' ? 'Permitir cámara' : 'Permitir galería'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={permDlg.btnSecondary} onPress={() => { setShowPermDialog(false); setPendingAction(null); }} activeOpacity={0.8}>
                <Text style={permDlg.btnSecondaryText}>Ahora no</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Camera Options Sheet */}
        {showCameraOptions && (
          <View style={camOpts.absoluteOverlay}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowCameraOptions(false)} activeOpacity={1} />
            <View style={camOpts.sheet}>
              <View style={camOpts.handle} />
              <Text style={camOpts.title}>Agregar foto</Text>

              <TouchableOpacity
                style={camOpts.option}
                onPress={handleOpenCameraBtn}
                activeOpacity={0.85}
              >
                <View style={[camOpts.optIcon, { backgroundColor: colors.primary[50] }]}>
                  <Camera size={22} color={colors.primary[600]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={camOpts.optTitle}>Tomar foto</Text>
                  <Text style={camOpts.optSub}>Usa la cámara del dispositivo</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[camOpts.option, { borderBottomWidth: 0 }]}
                onPress={handleOpenGallery}
                activeOpacity={0.85}
              >
                <View style={[camOpts.optIcon, { backgroundColor: colors.success[50] }]}>
                  <ImagePlus size={22} color={colors.success[600]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={camOpts.optTitle}>Elegir de galería</Text>
                  <Text style={camOpts.optSub}>Selecciona una foto existente</Text>
                </View>
              </TouchableOpacity>

              <View style={{ height: 32 }} />
            </View>
          </View>
        )}


      </SafeAreaView>

      {/* Photo Form — appears after capture/pick */}
      {pendingUri && (
        <PhotoFormModal
          uri={pendingUri}
          onSave={(data) => { handleAddPhoto(pendingUri, data); setPendingUri(null); }}
          onDiscard={() => setPendingUri(null)}
        />
      )}

      {/* Camera — rendered outside SafeAreaView to cover full screen */}
      {showCamera && (
        <CameraModal
          onClose={() => setShowCamera(false)}
          onCapture={(uri) => { setShowCamera(false); setTimeout(() => setPendingUri(uri), 300); }}
        />
      )}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    ...shadows.sm,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  screenTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: '#0F0F0F' },
  photoCount: { fontSize: fontSize.body, color: '#737373', fontWeight: fontWeight.medium },
  filtersScroll: { marginHorizontal: -spacing.base },
  filtersContent: { paddingHorizontal: spacing.base, gap: spacing.sm },
  pill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.full, backgroundColor: '#F5F5F5' },
  pillActive: { backgroundColor: '#8B5CF6' },
  pillText: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: '#333333' },
  pillTextActive: { color: '#FFFFFF' },

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
  overlayLocation: { fontSize: 11, fontWeight: fontWeight.medium, color: '#FFFFFF', flex: 1 },
  overlayMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  overlayUser: { fontSize: 10, color: `${'#FFFFFF'}CC` },
  overlayDate: { fontSize: 10, color: `${'#FFFFFF'}99` },

  // Empty
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#333333' },
  emptySubtitle: { fontSize: fontSize.body, color: '#737373' },
});

// ─── Viewer Styles ────────────────────────────────────────────
const viewer = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    paddingTop: (StatusBar.currentHeight ?? 44) + spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  iconBtn: { padding: spacing.sm, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.1)' },
  topTitle: { flex: 1, textAlign: 'center', fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: '#FFFFFF', marginHorizontal: spacing.sm },

  // Image
  imageArea: { flex: 1, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  imagePlaceholder: { width: SCREEN_WIDTH, flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  imagePlaceholderText: { fontSize: fontSize.base, color: `${'#FFFFFF'}60`, fontWeight: fontWeight.medium },
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.base,
    paddingBottom: 32,
    maxHeight: 320,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  metaInfo: { flex: 1 },
  metaName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: '#0F0F0F' },
  metaTime: { fontSize: fontSize.small, color: '#737373' },
  downloadBtn: { padding: spacing.sm, backgroundColor: '#FFFBEB', borderRadius: borderRadius.sm },

  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FAFAFA', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
  detailText: { fontSize: fontSize.small, color: '#333333' },

  notesCard: { backgroundColor: '#FAFAFA', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  notesLabel: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: '#737373', marginBottom: 4 },
  notesText: { fontSize: fontSize.body, color: '#333333', lineHeight: 20 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  tag: { backgroundColor: '#F5F3FF', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  tagText: { fontSize: fontSize.small, color: '#7C3AED', fontWeight: fontWeight.medium },

  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderRadius: borderRadius.md, backgroundColor: '#FEF2F2' },
  deleteBtnText: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: '#EF4444' },
});

// ─── Camera Styles ────────────────────────────────────────────
const cam = StyleSheet.create({
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 999,
    alignItems: 'center', justifyContent: 'center',
  },
  camera: { ...StyleSheet.absoluteFillObject },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#000', padding: spacing.xl, gap: spacing.base,
  },
  permTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: '#FFFFFF', textAlign: 'center' },
  permSub: { fontSize: fontSize.body, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 22 },
  permBtn: { backgroundColor: '#EAAB00', borderRadius: borderRadius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.base, marginTop: spacing.sm },
  permBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: '#FFFFFF' },
  permCancel: { paddingVertical: spacing.md },
  permCancelText: { fontSize: fontSize.base, color: 'rgba(255,255,255,0.5)' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingHorizontal: spacing.base, paddingBottom: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  topTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: '#FFFFFF' },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  gridOverlay: { ...StyleSheet.absoluteFillObject },
  gridLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.2)' },
  gridCol: { position: 'absolute', width: 1, top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.2)' },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingBottom: 52, paddingTop: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sideBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  shutter: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 4, borderColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  shutterCapturing: { borderColor: '#FBBF24' },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF' },
});

// ─── Camera Options Sheet Styles ──────────────────────────────
const camOpts = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  absoluteOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, flexDirection: 'column' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.base,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E8E8E8', alignSelf: 'center', marginTop: spacing.sm, marginBottom: spacing.md },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#0F0F0F', marginBottom: spacing.md },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.base,
    paddingVertical: spacing.base,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  optIcon: { width: 48, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  optTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: '#0F0F0F' },
  optSub: { fontSize: fontSize.small, color: '#737373', marginTop: 2 },
});

// ─── Permission Dialog Styles ─────────────────────────────────
const permDlg = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.xl,
  },
  iconRow: { marginTop: spacing.sm },
  iconBg: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#F5F5F5',
  },
  title: {
    fontSize: fontSize.xl, fontWeight: fontWeight.bold,
    color: '#0F0F0F', textAlign: 'center',
  },
  desc: {
    fontSize: fontSize.body, color: '#333333',
    textAlign: 'center', lineHeight: 22,
  },
  reasonBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: borderRadius.md,
    padding: spacing.base,
    width: '100%',
    gap: spacing.sm,
  },
  reasonTitle: {
    fontSize: fontSize.body, fontWeight: fontWeight.bold,
    color: '#0F0F0F', marginBottom: spacing.xs,
  },
  reasonItem: {
    fontSize: fontSize.body, color: '#333333', lineHeight: 20,
  },
  btnPrimary: {
    backgroundColor: '#EAAB00',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.base,
    width: '100%', alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnPrimaryText: {
    fontSize: fontSize.base, fontWeight: fontWeight.bold, color: '#FFFFFF',
  },
  btnSecondary: {
    paddingVertical: spacing.sm,
    width: '100%', alignItems: 'center',
  },
  btnSecondaryText: {
    fontSize: fontSize.base, color: '#737373',
  },
});

// ─── Photo Form Styles ────────────────────────────────────────
const photoForm = StyleSheet.create({
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FAFAFA',
    zIndex: 998,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    paddingTop: 52,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
    ...shadows.sm,
  },
  headerTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: '#0F0F0F' },
  discardBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  discardText: { fontSize: fontSize.body, color: '#737373' },
  saveBtn: { backgroundColor: '#EAAB00', paddingHorizontal: spacing.base, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.sm },
  saveBtnText: { fontSize: fontSize.body, fontWeight: fontWeight.bold, color: '#FFFFFF' },
  body: { flex: 1 },

  previewContainer: { position: 'relative', height: 220, backgroundColor: '#0F0F0F' },
  preview: { width: '100%', height: '100%' },
  previewBadge: {
    position: 'absolute', bottom: spacing.sm, left: spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
  },
  previewBadgeText: { fontSize: 10, color: '#FFFFFF', fontWeight: fontWeight.medium },

  field: { backgroundColor: '#FFFFFF', padding: spacing.base, marginTop: spacing.sm },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  fieldLabel: { fontSize: fontSize.body, fontWeight: fontWeight.semibold, color: '#0F0F0F', flex: 1 },
  optional: { fontSize: fontSize.small, color: '#737373' },

  input: {
    borderWidth: 1, borderColor: '#E8E8E8', borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    fontSize: fontSize.base, color: '#0F0F0F', backgroundColor: '#FAFAFA',
  },
  textarea: { minHeight: 80, textAlignVertical: 'top', paddingTop: spacing.md },
  charCount: { fontSize: 10, color: '#A3A3A3', textAlign: 'right', marginTop: 4 },

  zonePicker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#E8E8E8', borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    backgroundColor: '#FAFAFA',
  },
  zonePickerText: { fontSize: fontSize.base, color: '#0F0F0F', fontWeight: fontWeight.medium },
  zoneList: { marginTop: spacing.xs, borderWidth: 1, borderColor: '#E8E8E8', borderRadius: borderRadius.md, overflow: 'hidden' },
  zoneOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  zoneOptionActive: { backgroundColor: '#FFFBEB' },
  zoneOptionText: { fontSize: fontSize.base, color: '#333333' },
  zoneOptionTextActive: { color: '#CA8A04', fontWeight: fontWeight.semibold },

  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  tagChip: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs + 1,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: '#E8E8E8',
    backgroundColor: '#FAFAFA',
  },
  tagChipActive: { backgroundColor: '#FFFBEB', borderColor: '#FCD34D' },
  tagChipText: { fontSize: fontSize.small, color: '#737373' },
  tagChipTextActive: { color: '#CA8A04', fontWeight: fontWeight.semibold },

  tagInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tagInput: {
    flex: 1, borderWidth: 1, borderColor: '#E8E8E8', borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    fontSize: fontSize.base, color: '#0F0F0F', backgroundColor: '#FAFAFA',
  },
  tagAddBtn: {
    width: 40, height: 40, borderRadius: borderRadius.md,
    backgroundColor: '#EAAB00', alignItems: 'center', justifyContent: 'center',
  },
  selectedTags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  selectedTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFFBEB', borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs + 1,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  selectedTagText: { fontSize: fontSize.small, color: '#CA8A04', fontWeight: fontWeight.medium },
});