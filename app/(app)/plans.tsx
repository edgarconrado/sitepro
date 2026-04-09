/**
 * SitePro — Plans Screen (conectado a Supabase)
 * Solo acepta PNG y PDF
 */

import { colors } from '@/theme';
import { ScreenEntrance, StaggerItem } from '@components/ui/Animated';
import { Badge } from '@components/ui/Badge';
import { ConfirmDialogContainer, useConfirm } from '@components/ui/ConfirmDialog';
import { EmptyPlans } from '@components/ui/EmptyStates';
import { FAB } from '@components/ui/FAB';
import { useToast } from '@components/ui/Toast';
import PlanViewerScreen from '@features/plans/PlanViewerScreen';
import { useTheme } from '@hooks/useTheme';
import { deletePlan, fetchProjectPlans, uploadPlan, type DbPlan } from '@services/plansService';
import { useProjectsStore } from '@store/projectsStore';
import { borderRadius, fontSize, fontWeight, iconSize, shadows, spacing } from '@theme/tokens';
import { formatDate } from '@utils/index';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { router } from 'expo-router';
import {
  ArrowLeft, Calendar, ChevronRight, Download,
  FileText, ImagePlus, Layers, Maximize2, Plus,
  RefreshCw, Ruler,
  Trash2, User, X,
  ZoomIn, ZoomOut
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, FlatList,
  Image, KeyboardAvoidingView, Modal, Platform,
  RefreshControl, ScrollView, StatusBar, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {
  Gesture, GestureDetector, GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  clamp, useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────
type Discipline = 'Arquitectónico' | 'Estructural' | 'Eléctrico' | 'Hidráulico' | 'Mecánico';
type PlanStatus = 'Vigente' | 'Revisión' | 'Obsoleto';

const DISCIPLINES: ('Todas' | Discipline)[] = [
  'Todas', 'Arquitectónico', 'Estructural', 'Eléctrico', 'Hidráulico', 'Mecánico',
];

const DISCIPLINE_COLORS: Record<Discipline, { bg: string; text: string; pill: string }> = {
  'Arquitectónico': { bg: colors.primary[100], text: colors.primary[700], pill: colors.primary[600] },
  'Estructural': { bg: colors.purple[100], text: colors.purple[700], pill: colors.purple[500] },
  'Eléctrico': { bg: colors.success[100], text: colors.success[700], pill: colors.success[600] },
  'Hidráulico': { bg: '#E0F2FE', text: '#0369A1', pill: '#2563EB' },
  'Mecánico': { bg: colors.warning[100], text: colors.warning[700], pill: colors.orange[500] },
};

const STATUS_COLORS: Record<PlanStatus, { bg: string; text: string }> = {
  'Vigente': { bg: colors.success[100], text: colors.success[700] },
  'Revisión': { bg: colors.warning[100], text: colors.warning[700] },
  'Obsoleto': { bg: colors.error[100], text: colors.error[700] },
};

const DISCIPLINE_BG: Record<string, string> = {
  'Arquitectónico': '#0F2940', 'Estructural': '#1A0A2E',
  'Eléctrico': '#0A1E0A', 'Hidráulico': '#0A1A2E', 'Mecánico': '#2E1A0A',
};
const DISCIPLINE_GRID: Record<string, string> = {
  'Arquitectónico': '#1E4A7A', 'Estructural': '#3D1F6B',
  'Eléctrico': '#1A4A1A', 'Hidráulico': '#0A3A5A', 'Mecánico': '#5A3A0A',
};

// ─── Blueprint placeholder (cuando no hay imagen real) ────────
function BlueprintCanvas({ plan, width, height }: { plan: DbPlan; width: number; height: number }) {
  const bg = DISCIPLINE_BG[plan.discipline] ?? '#0F2940';
  const grid = DISCIPLINE_GRID[plan.discipline] ?? '#1E4A7A';
  const gridSpacing = 24;
  const cols = Math.floor(width / gridSpacing);
  const rows = Math.floor(height / gridSpacing);

  return (
    <View style={{ width, height, backgroundColor: bg, overflow: 'hidden' }}>
      {Array.from({ length: rows + 1 }).map((_, i) => (
        <View key={`h${i}`} style={{ position: 'absolute', top: i * gridSpacing, left: 0, right: 0, height: 0.5, backgroundColor: grid, opacity: 0.6 }} />
      ))}
      {Array.from({ length: cols + 1 }).map((_, i) => (
        <View key={`v${i}`} style={{ position: 'absolute', left: i * gridSpacing, top: 0, bottom: 0, width: 0.5, backgroundColor: grid, opacity: 0.6 }} />
      ))}
      <View style={{ position: 'absolute', top: 40, left: 40, right: 40, bottom: 40, borderWidth: 1.5, borderColor: `${grid}FF`, opacity: 0.9 }} />
      <View style={{ position: 'absolute', bottom: 0, right: 0, borderTopWidth: 1, borderLeftWidth: 1, borderColor: `${grid}FF`, padding: 8, width: width * 0.5 }}>
        <Text style={{ color: colors.white, fontSize: 8, fontWeight: '700' }}>{plan.code}</Text>
        <Text style={{ color: colors.white, fontSize: 7, opacity: 0.6, marginTop: 2 }} numberOfLines={1}>{plan.title}</Text>
        <Text style={{ color: colors.white, fontSize: 7, opacity: 0.5, marginTop: 1 }}>
          {plan.scale ? `Esc. ${plan.scale}  •  ` : ''}{plan.revision}
        </Text>
      </View>
    </View>
  );
}

// ─── Thumbnail ────────────────────────────────────────────────
function PlanThumbnail({ plan, width = 88, height = 72 }: { plan: DbPlan; width?: number; height?: number }) {
  if (plan.file_type === 'png') {
    return (
      <Image
        source={{ uri: plan.file_url }}
        style={{ width, height }}
        resizeMode="cover"
      />
    );
  }
  // PDF → mostrar placeholder con ícono
  return (
    <View style={{ width, height, backgroundColor: DISCIPLINE_BG[plan.discipline] ?? '#0F2940', alignItems: 'center', justifyContent: 'center' }}>
      <FileText size={28} color="rgba(255,255,255,0.5)" />
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, marginTop: 4 }}>PDF</Text>
    </View>
  );
}

// ─── Plan Viewer ──────────────────────────────────────────────
function PlanViewer({ plan, onClose, onDelete }: {
  plan: DbPlan;
  onClose: () => void;
  onDelete: () => void;
}) {
  const confirm = useConfirm();
  const toast = useToast();
  const CANVAS_W = SW * 2;
  const CANVAS_H = SH * 1.6;

  const [downloading, setDownloading] = useState(false);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate(e => { scale.value = clamp(savedScale.value * e.scale, 0.3, 6); })
    .onEnd(() => { savedScale.value = scale.value; });

  const pan = Gesture.Pan()
    .onUpdate(e => { offsetX.value = savedX.value + e.translationX; offsetY.value = savedY.value + e.translationY; })
    .onEnd(() => { savedX.value = offsetX.value; savedY.value = offsetY.value; });

  const doubleTap = Gesture.Tap().numberOfTaps(2).onEnd(() => {
    scale.value = withSpring(1); savedScale.value = 1;
    offsetX.value = withSpring(0); offsetY.value = withSpring(0);
    savedX.value = 0; savedY.value = 0;
  });

  const all = Gesture.Exclusive(doubleTap, Gesture.Simultaneous(pinch, pan));
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value }, { translateY: offsetY.value }, { scale: scale.value }],
  }));

  const zoomIn = () => { scale.value = withSpring(Math.min(scale.value + 0.5, 6)); savedScale.value = scale.value; };
  const zoomOut = () => { scale.value = withSpring(Math.max(scale.value - 0.5, 0.3)); savedScale.value = scale.value; };
  const reset = () => {
    scale.value = withSpring(1); savedScale.value = 1;
    offsetX.value = withSpring(0); offsetY.value = withSpring(0);
    savedX.value = 0; savedY.value = 0;
  };

  // Abrir PDF en browser nativo
  const openPdf = async () => {
    try {
      await WebBrowser.openBrowserAsync(plan.file_url, {
        toolbarColor: '#141414',
        controlsColor: '#EAAB00',
      });
    } catch {
      await Linking.openURL(plan.file_url);
    }
  };

  // Descargar archivo al dispositivo
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const ext = plan.file_type;
      const localName = `${plan.code.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`;
      const localUri = (FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '') + localName;

      const downloadResult = await FileSystem.downloadAsync(plan.file_url, localUri);

      if (downloadResult.status === 200) {
        toast.success('Descargado ✓', `${localName} guardado en tu dispositivo`);
      } else {
        throw new Error(`HTTP ${downloadResult.status}`);
      }
    } catch {
      // Fallback: abrir directamente en el browser del dispositivo
      try {
        await WebBrowser.openBrowserAsync(plan.file_url);
      } catch {
        await Linking.openURL(plan.file_url);
      }
    } finally {
      setDownloading(false);
    }
  };

  const dc = DISCIPLINE_COLORS[plan.discipline as Discipline];
  const sc = STATUS_COLORS[plan.status as PlanStatus];
  const isPdf = plan.file_type === 'pdf';

  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={viewer.container}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />

          {/* Top bar */}
          <View style={viewer.topBar}>
            <TouchableOpacity onPress={onClose} style={viewer.iconBtn} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
              <ArrowLeft size={iconSize.md} color={colors.white} />
            </TouchableOpacity>
            <View style={viewer.topInfo}>
              <Text style={viewer.topCode}>{plan.code}</Text>
              <Text style={viewer.topTitle} numberOfLines={1}>{plan.title}</Text>
            </View>
            <View style={[viewer.fileTypeBadge, { backgroundColor: isPdf ? '#DC2626' : '#2563EB' }]}>
              <Text style={viewer.fileTypeText}>{plan.file_type.toUpperCase()}</Text>
            </View>
            <TouchableOpacity
              style={[viewer.iconBtn, { backgroundColor: 'rgba(239,68,68,0.2)' }]}
              onPress={() => confirm.confirm({
                title: 'Eliminar plano',
                message: `¿Eliminar "${plan.title}"?`,
                confirmLabel: 'Sí, eliminar',
                icon: 'trash',
                variant: 'danger',
                onConfirm: async () => {
                  try { await onDelete(); toast.success('Plano eliminado', plan.title); onClose(); }
                  catch { toast.error('Error al eliminar', 'Inténtalo de nuevo'); }
                },
              })}
            >
              <Trash2 size={iconSize.md} color={colors.error[400]} />
            </TouchableOpacity>
          </View>

          {/* Canvas / Preview */}
          <View style={viewer.canvasWrapper}>
            {isPdf ? (
              // ── PDF: preview grande + botón para abrir en browser ──
              <View style={viewer.pdfPreview}>
                <View style={viewer.pdfIconWrap}>
                  <FileText size={72} color="rgba(255,255,255,0.15)" strokeWidth={1} />
                  <View style={viewer.pdfBadge}>
                    <Text style={viewer.pdfBadgeText}>PDF</Text>
                  </View>
                </View>
                <Text style={viewer.pdfCode}>{plan.code}</Text>
                <Text style={viewer.pdfTitle}>{plan.title}</Text>
                <Text style={viewer.pdfSub}>{plan.discipline} · {plan.level} · {plan.revision}</Text>
                <TouchableOpacity style={viewer.pdfOpenBtn} onPress={openPdf} activeOpacity={0.85}>
                  <FileText size={18} color="#141414" />
                  <Text style={viewer.pdfOpenText}>Ver PDF completo</Text>
                </TouchableOpacity>
                <Text style={viewer.pdfHint}>Se abrirá en el visor de tu dispositivo</Text>
              </View>
            ) : (
              // ── PNG: imagen con pinch/pan ──
              <GestureDetector gesture={all}>
                <Animated.View style={[viewer.canvas, animStyle]}>
                  <Image
                    source={{ uri: plan.file_url }}
                    style={{ width: CANVAS_W, height: CANVAS_H }}
                    resizeMode="contain"
                  />
                </Animated.View>
              </GestureDetector>
            )}

            {!isPdf && (
              <View style={viewer.hint}>
                <Text style={viewer.hintText}>Pellizca para zoom · Doble tap para resetear</Text>
              </View>
            )}
          </View>

          {/* Zoom controls — solo para PNG */}
          {!isPdf && (
            <View style={viewer.zoomControls}>
              <TouchableOpacity style={viewer.zoomBtn} onPress={zoomIn}><ZoomIn size={18} color={colors.white} /></TouchableOpacity>
              <TouchableOpacity style={viewer.zoomBtn} onPress={zoomOut}><ZoomOut size={18} color={colors.white} /></TouchableOpacity>
              <TouchableOpacity style={viewer.zoomBtn} onPress={reset}><Maximize2 size={18} color={colors.white} /></TouchableOpacity>
            </View>
          )}

          {/* Info sheet */}
          <View style={viewer.infoSheet}>
            <View style={viewer.infoRow}>
              {dc && <Badge label={plan.discipline} bg={dc.bg} textColor={dc.text} />}
              {sc && <Badge label={plan.status} bg={sc.bg} textColor={sc.text} />}
              <Badge label={plan.revision} bg={colors.gray[100]} textColor={colors.gray[600]} />
            </View>
            <View style={viewer.infoGrid}>
              <View style={viewer.infoItem}><Layers size={12} color={colors.gray[400]} /><Text style={viewer.infoText}>{plan.level}</Text></View>
              <View style={viewer.infoItem}><User size={12} color={colors.gray[400]} /><Text style={viewer.infoText}>{plan.uploader?.full_name ?? 'Usuario'}</Text></View>
              <View style={viewer.infoItem}><Calendar size={12} color={colors.gray[400]} /><Text style={viewer.infoText}>{formatDate(plan.updated_at)}</Text></View>
              {plan.scale && <View style={viewer.infoItem}><Ruler size={12} color={colors.gray[400]} /><Text style={viewer.infoText}>Esc. {plan.scale}</Text></View>}
            </View>
            {/* Botón de descarga */}
            <TouchableOpacity
              style={[viewer.downloadBtn, downloading && { opacity: 0.7 }]}
              onPress={handleDownload}
              disabled={downloading}
              activeOpacity={0.85}
            >
              {downloading
                ? <ActivityIndicator size="small" color={colors.white} />
                : <Download size={18} color={colors.white} />
              }
              <Text style={viewer.downloadBtnText}>
                {downloading ? 'Descargando...' : `Descargar ${plan.file_type.toUpperCase()}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </GestureHandlerRootView>
      <ConfirmDialogContainer />
    </Modal>
  );
}

// ─── Plan Card ────────────────────────────────────────────────
function PlanCard({ plan, onPress }: { plan: DbPlan; onPress: () => void }) {
  const dc = DISCIPLINE_COLORS[plan.discipline as Discipline];
  const sc = STATUS_COLORS[plan.status as PlanStatus];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.thumbnail}>
        <PlanThumbnail plan={plan} width={88} height={72} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardCode}>{plan.code}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>{plan.title}</Text>
        <View style={styles.cardMeta}>
          <Layers size={11} color={colors.gray[400]} />
          <Text style={styles.cardMetaText}>{plan.level}</Text>
          <Text style={styles.cardMetaDot}>·</Text>
          <Text style={styles.cardMetaText}>{plan.revision}</Text>
          <Text style={styles.cardMetaDot}>·</Text>
          <View style={[styles.fileTypePill, { backgroundColor: plan.file_type === 'pdf' ? '#FEE2E2' : '#DBEAFE' }]}>
            <Text style={[styles.fileTypePillText, { color: plan.file_type === 'pdf' ? '#DC2626' : '#2563EB' }]}>
              {plan.file_type.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.cardBadges}>
          {sc && <Badge label={plan.status} bg={sc.bg} textColor={sc.text} />}
          {dc && <Badge label={plan.discipline} bg={dc.bg} textColor={dc.text} />}
        </View>
      </View>
      <ChevronRight size={16} color={colors.gray[300]} />
    </TouchableOpacity>
  );
}

// ─── New Plan Modal ───────────────────────────────────────────
const DISCIPLINE_OPTIONS: Discipline[] = ['Arquitectónico', 'Estructural', 'Eléctrico', 'Hidráulico', 'Mecánico'];
const SCALE_OPTIONS = ['1:25', '1:50', '1:75', '1:100', '1:150', '1:200', '1:500'];
const LEVEL_OPTIONS = ['Planta Baja', 'Nivel 1', 'Nivel 2', 'Nivel 3', 'Cimentación', 'Sótano', 'Azotea', 'General'];

function NewPlanModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (plan: DbPlan) => void;
}) {
  const toast = useToast();
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [discipline, setDiscipline] = useState<Discipline>('Arquitectónico');
  const [level, setLevel] = useState('Planta Baja');
  const [author, setAuthor] = useState('');
  const [scale, setScale] = useState('1:100');
  const [revision, setRevision] = useState('Rev. 1');
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'png' | 'pdf' | null>(null);
  const [saving, setSaving] = useState(false);

  const [showDisciplines, setShowDisciplines] = useState(false);
  const [showLevels, setShowLevels] = useState(false);
  const [showScales, setShowScales] = useState(false);

  // Seleccionar PNG desde galería
  const pickPng = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permiso requerido', 'Activa el acceso a la galería en ajustes.'); return; }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.9,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Validar que sea PNG
        const mime = asset.mimeType ?? 'image/png';
        if (!mime.includes('png') && !mime.includes('jpeg') && !mime.includes('jpg')) {
          Alert.alert('Formato no permitido', 'Solo se aceptan imágenes PNG o JPG para planos.\n\nSi tienes un PDF, usa la opción "Subir PDF".');
          return;
        }
        const isJpeg = mime.includes('jpeg') || mime.includes('jpg');
        setFileUri(asset.uri);
        setFileBase64(asset.base64 ?? null);
        setFileMime(isJpeg ? 'image/jpeg' : 'image/png');
        setFileType(isJpeg ? 'jpg' : 'png');
        const parts = asset.uri.split('/');
        setFileName(parts[parts.length - 1]);
      }
    } catch {
      Alert.alert('Error', 'No se pudo abrir la galería.');
    }
  };

  // Seleccionar PDF con DocumentPicker
  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        // Leer como base64
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = () => {
          const b64 = (reader.result as string).split(',')[1];
          setFileBase64(b64);
        };
        reader.readAsDataURL(blob);

        setFileUri(asset.uri);
        setFileMime('application/pdf');
        setFileType('pdf');
        setFileName(asset.name);
      }
    } catch {
      Alert.alert('Error', 'No se pudo seleccionar el PDF.');
    }
  };

  const handleSave = async () => {
    if (!code.trim()) { Alert.alert('Requerido', 'El código del plano es obligatorio.'); return; }
    if (!title.trim()) { Alert.alert('Requerido', 'El título del plano es obligatorio.'); return; }
    if (!fileUri || !fileBase64 || !fileMime || !fileType) {
      Alert.alert('Archivo requerido', 'Selecciona un archivo PNG o PDF antes de guardar.'); return;
    }

    setSaving(true);
    try {
      const projectId = useProjectsStore.getState().currentProjectId;
      if (!projectId) throw new Error('No hay proyecto activo');

      const uploaded = await uploadPlan({
        uri: fileUri,
        base64: fileBase64,
        mimeType: fileMime,
        projectId,
        code: code.trim().toUpperCase(),
        title: title.trim(),
        discipline,
        level,
        revision,
        scale,
      });

      toast.success('Plano subido', `${uploaded.code} — ${uploaded.title}`);
      onSave(uploaded);
      onClose();
    } catch (err: any) {
      Alert.alert('Error al subir', err.message ?? 'Inténtalo de nuevo');
    } finally {
      setSaving(false);
    }
  };

  const dc = DISCIPLINE_COLORS[discipline];

  return (
    <View style={np.fullscreen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={np.header}>
          <TouchableOpacity onPress={onClose} style={np.cancelBtn} disabled={saving}>
            <X size={18} color={colors.gray[500]} />
            <Text style={np.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={np.headerTitle}>Nuevo Plano</Text>
          <TouchableOpacity onPress={handleSave} style={np.saveBtn} disabled={saving}>
            {saving
              ? <ActivityIndicator size="small" color={colors.white} />
              : <Text style={np.saveBtnText}>Subir</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={np.body}>

          {/* ── Archivo (primero para que sea visible) ── */}
          <View style={np.section}>
            <Text style={np.sectionTitle}>Archivo del plano *</Text>
            <Text style={np.formatNote}>Solo se aceptan archivos PNG o PDF</Text>

            {fileUri ? (
              <View style={np.filePreview}>
                <View style={np.filePreviewLeft}>
                  <View style={[np.fileTypeBadge, { backgroundColor: fileType === 'pdf' ? '#FEE2E2' : '#DBEAFE' }]}>
                    <Text style={[np.fileTypeBadgeText, { color: fileType === 'pdf' ? '#DC2626' : '#2563EB' }]}>
                      {fileType?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={np.fileName} numberOfLines={1}>{fileName}</Text>
                    <Text style={np.fileSubtitle}>Listo para subir</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => { setFileUri(null); setFileName(null); setFileBase64(null); setFileMime(null); setFileType(null); }}>
                  <X size={16} color={colors.gray[400]} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={np.uploadRow}>
                <TouchableOpacity style={[np.uploadBtn, { flex: 1 }]} onPress={pickPng} activeOpacity={0.85}>
                  <ImagePlus size={22} color={colors.primary[500]} />
                  <Text style={np.uploadTitle}>Subir PNG / JPG</Text>
                  <Text style={np.uploadSub}>Imagen de plano</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[np.uploadBtn, { flex: 1, borderColor: '#FCA5A5' }]} onPress={pickPdf} activeOpacity={0.85}>
                  <FileText size={22} color="#DC2626" />
                  <Text style={[np.uploadTitle, { color: '#DC2626' }]}>Subir PDF</Text>
                  <Text style={np.uploadSub}>Documento PDF</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── Identificación ── */}
          <View style={np.section}>
            <Text style={np.sectionTitle}>Identificación</Text>

            <Text style={np.label}>Código del plano *</Text>
            <TextInput
              style={np.input}
              placeholder="Ej: ARQ-PB-001"
              placeholderTextColor={colors.gray[400]}
              value={code}
              onChangeText={t => setCode(t.toUpperCase())}
              maxLength={20}
              autoCapitalize="characters"
            />

            <Text style={np.label}>Título *</Text>
            <TextInput
              style={np.input}
              placeholder="Ej: Planta Baja — Distribución General"
              placeholderTextColor={colors.gray[400]}
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />

            <Text style={np.label}>Revisión</Text>
            <TextInput
              style={np.input}
              placeholder="Ej: Rev. 1"
              placeholderTextColor={colors.gray[400]}
              value={revision}
              onChangeText={setRevision}
              maxLength={10}
            />
          </View>

          {/* ── Clasificación ── */}
          <View style={np.section}>
            <Text style={np.sectionTitle}>Clasificación</Text>

            <Text style={np.label}>Disciplina</Text>
            <TouchableOpacity style={np.selector} onPress={() => setShowDisciplines(v => !v)} activeOpacity={0.8}>
              <View style={[np.disciplineDot, { backgroundColor: dc.pill }]} />
              <Text style={np.selectorText}>{discipline}</Text>
              <ChevronRight size={16} color={colors.gray[400]} />
            </TouchableOpacity>
            {showDisciplines && (
              <View style={np.dropdown}>
                {DISCIPLINE_OPTIONS.map(d => {
                  const c = DISCIPLINE_COLORS[d];
                  const active = d === discipline;
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[np.dropdownItem, active && { backgroundColor: c.bg }]}
                      onPress={() => { setDiscipline(d); setShowDisciplines(false); }}
                    >
                      <View style={[np.disciplineDot, { backgroundColor: c.pill }]} />
                      <Text style={[np.dropdownItemText, active && { color: c.text, fontWeight: fontWeight.bold }]}>{d}</Text>
                      {active && <Text style={{ color: c.text }}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <Text style={np.label}>Nivel / Zona</Text>
            <TouchableOpacity style={np.selector} onPress={() => setShowLevels(v => !v)} activeOpacity={0.8}>
              <Layers size={15} color={colors.gray[500]} />
              <Text style={np.selectorText}>{level}</Text>
              <ChevronRight size={16} color={colors.gray[400]} />
            </TouchableOpacity>
            {showLevels && (
              <View style={np.dropdown}>
                {LEVEL_OPTIONS.map(l => (
                  <TouchableOpacity
                    key={l}
                    style={[np.dropdownItem, l === level && { backgroundColor: colors.primary[50] }]}
                    onPress={() => { setLevel(l); setShowLevels(false); }}
                  >
                    <Text style={[np.dropdownItemText, l === level && { color: colors.primary[700], fontWeight: fontWeight.bold }]}>{l}</Text>
                    {l === level && <Text style={{ color: colors.primary[600] }}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ── Detalles técnicos ── */}
          <View style={np.section}>
            <Text style={np.sectionTitle}>Detalles técnicos</Text>

            <Text style={np.label}>Escala</Text>
            <TouchableOpacity style={np.selector} onPress={() => setShowScales(v => !v)} activeOpacity={0.8}>
              <Ruler size={15} color={colors.gray[500]} />
              <Text style={np.selectorText}>{scale}</Text>
              <ChevronRight size={16} color={colors.gray[400]} />
            </TouchableOpacity>
            {showScales && (
              <View style={np.dropdown}>
                {SCALE_OPTIONS.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[np.dropdownItem, s === scale && { backgroundColor: colors.primary[50] }]}
                    onPress={() => { setScale(s); setShowScales(false); }}
                  >
                    <Text style={[np.dropdownItemText, s === scale && { color: colors.primary[700], fontWeight: fontWeight.bold }]}>{s}</Text>
                    {s === scale && <Text style={{ color: colors.primary[600] }}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function PlansScreen() {
  const { colors: themeColors } = useTheme();
  const { currentProjectId, loadProjects, currentProject } = useProjectsStore();

  const [plans, setPlans] = useState<DbPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'Todas' | Discipline>('Todas');
  const [selectedPlan, setSelectedPlan] = useState<DbPlan | null>(null);
  const [showNewPlan, setShowNewPlan] = useState(false);

  const loadPlans = useCallback(async () => {
    const projectId = useProjectsStore.getState().currentProjectId;
    if (!projectId) return;
    const data = await fetchProjectPlans(projectId);
    setPlans(data);
    setIsLoading(false);
  }, []);

  useEffect(() => { loadProjects().then(loadPlans); }, []);
  useEffect(() => { if (currentProjectId) loadPlans(); }, [currentProjectId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlans();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    if (activeFilter === 'Todas') return plans;
    return plans.filter(p => p.discipline === activeFilter);
  }, [activeFilter, plans]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { Todas: plans.length };
    DISCIPLINES.forEach(d => {
      if (d !== 'Todas') result[d] = plans.filter(p => p.discipline === d).length;
    });
    return result;
  }, [plans]);

  const project = currentProject();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={{ marginTop: 12, color: colors.gray[500], fontSize: fontSize.body }}>Cargando planos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={themeColors.white} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={iconSize.md} color={colors.gray[700]} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Planos</Text>
            <Text style={styles.headerSub}>
              {plans.length} plano{plans.length !== 1 ? 's' : ''} · {project?.name ?? 'Proyecto'}
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <RefreshCw size={iconSize.md} color={colors.gray[600]} />
          </TouchableOpacity>
        </View>

        {/* Formato badge */}
        <View style={styles.formatBar}>
          <View style={styles.formatBadge}>
            <Text style={styles.formatText}>📐 Formatos permitidos:</Text>
            <View style={[styles.formatPill, { backgroundColor: '#DBEAFE' }]}>
              <Text style={[styles.formatPillText, { color: '#2563EB' }]}>PNG</Text>
            </View>
            <View style={[styles.formatPill, { backgroundColor: '#FEF9C3' }]}>
              <Text style={[styles.formatPillText, { color: '#CA8A04' }]}>JPG</Text>
            </View>
            <Text style={styles.formatText}>y</Text>
            <View style={[styles.formatPill, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.formatPillText, { color: '#DC2626' }]}>PDF</Text>
            </View>
          </View>
        </View>

        {/* Filter pills */}
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
            {DISCIPLINES.map(d => {
              const active = activeFilter === d;
              const pillColor = d === 'Todas' ? colors.primary[600] : DISCIPLINE_COLORS[d as Discipline]?.pill ?? colors.primary[600];
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => setActiveFilter(d)}
                  style={[styles.pill, active && { backgroundColor: pillColor }]}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {d === 'Todas' ? `Todos (${counts.Todas})` : `${d.slice(0, 4)}… (${counts[d] ?? 0})`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Plans list */}
        <ScreenEntrance>
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />}
            renderItem={({ item, index }) => (
              <StaggerItem index={index}>
                <PlanCard plan={item} onPress={() => setSelectedPlan(item)} />
              </StaggerItem>
            )}
            ListEmptyComponent={
              <EmptyPlans
                title="Sin planos"
                subtitle="Sube el primer plano del proyecto en formato PNG o PDF."
                cta={{ label: '+ Subir plano', onPress: () => setShowNewPlan(true) }}
              />
            }
          />
        </ScreenEntrance>

        {/* Viewer con herramientas de medición */}
        {selectedPlan && (
          <PlanViewerScreen
            plan={selectedPlan}
            onClose={() => setSelectedPlan(null)}
            onDelete={async () => {
              await deletePlan(selectedPlan);
              setPlans(prev => prev.filter(p => p.id !== selectedPlan.id));
              setSelectedPlan(null);
            }}
          />
        )}

        <FAB onPress={() => setShowNewPlan(true)} icon={<Plus size={24} color={colors.white} />} />
      </SafeAreaView>

      {showNewPlan && (
        <NewPlanModal
          onClose={() => setShowNewPlan(false)}
          onSave={plan => {
            setPlans(prev => [plan, ...prev]);
            setShowNewPlan(false);
          }}
        />
      )}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: spacing.base, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', gap: spacing.md, ...shadows.sm },
  backBtn: { width: 36, height: 36, borderRadius: borderRadius.full, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  refreshBtn: { padding: spacing.sm },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: '#0F0F0F' },
  headerSub: { fontSize: fontSize.small, color: '#737373', marginTop: 2 },
  formatBar: { backgroundColor: '#FFFFFF', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  formatBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  formatText: { fontSize: fontSize.small, color: '#737373' },
  formatPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  formatPillText: { fontSize: 10, fontWeight: fontWeight.bold },
  filterBar: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  filterContent: { paddingHorizontal: spacing.base, paddingVertical: spacing.md, gap: spacing.sm },
  pill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.full, backgroundColor: '#F5F5F5' },
  pillText: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: '#525252' },
  pillTextActive: { color: '#FFFFFF' },
  listContent: { padding: spacing.base, gap: spacing.md, paddingBottom: 32 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: borderRadius.md, borderWidth: 1, borderColor: '#F5F5F5', overflow: 'hidden', gap: spacing.md, paddingRight: spacing.md, ...shadows.sm },
  thumbnail: { width: 88, height: 72, flexShrink: 0 },
  cardInfo: { flex: 1, paddingVertical: spacing.md, gap: 4 },
  cardCode: { fontSize: fontSize.small, fontWeight: fontWeight.bold, color: '#EAAB00' },
  cardTitle: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: '#0F0F0F', lineHeight: 18 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  cardMetaText: { fontSize: 10, color: '#737373' },
  cardMetaDot: { color: '#D4D4D4', fontSize: 10 },
  fileTypePill: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  fileTypePillText: { fontSize: 9, fontWeight: fontWeight.bold },
  cardBadges: { flexDirection: 'row', gap: spacing.xs, marginTop: 2, flexWrap: 'wrap' },
});

const viewer = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingTop: (StatusBar.currentHeight ?? 44) + spacing.sm, paddingBottom: spacing.md, gap: spacing.md, backgroundColor: 'rgba(0,0,0,0.5)' },
  iconBtn: { width: 36, height: 36, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  topInfo: { flex: 1 },
  topCode: { fontSize: fontSize.small, fontWeight: fontWeight.bold, color: '#FBBF24' },
  topTitle: { fontSize: fontSize.body, color: '#FFFFFF', opacity: 0.85 },
  fileTypeBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  fileTypeText: { fontSize: 10, fontWeight: fontWeight.bold, color: '#FFFFFF' },
  canvasWrapper: { flex: 1, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  canvas: {},
  hint: { position: 'absolute', bottom: spacing.md, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  hintText: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  zoomControls: { position: 'absolute', right: spacing.base, bottom: 160, gap: spacing.sm },
  zoomBtn: { width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  infoSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.base, paddingBottom: 32, gap: spacing.md },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.base },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoText: { fontSize: fontSize.small, color: '#333333' },

  // PDF preview
  pdfPreview: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  pdfIconWrap: { position: 'relative', marginBottom: 8 },
  pdfBadge: { position: 'absolute', bottom: -4, right: -8, backgroundColor: '#DC2626', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pdfBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: fontWeight.bold },
  pdfCode: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: '#FBBF24', textAlign: 'center' },
  pdfTitle: { fontSize: fontSize.base, color: '#FFFFFF', textAlign: 'center', lineHeight: 22 },
  pdfSub: { fontSize: fontSize.small, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  pdfOpenBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: '#EAAB00', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.full, marginTop: 8 },
  pdfOpenText: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: '#141414' },
  pdfHint: { fontSize: fontSize.small, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },

  // Download button
  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: '#141414', paddingVertical: spacing.md, borderRadius: borderRadius.md },
  downloadBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: '#FFFFFF' },
});

const np = StyleSheet.create({
  fullscreen: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FAFAFA', zIndex: 200 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', paddingHorizontal: spacing.base, paddingTop: (StatusBar.currentHeight ?? 44) + spacing.sm, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', ...shadows.sm },
  headerTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: '#0F0F0F' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cancelText: { fontSize: fontSize.body, color: '#737373' },
  saveBtn: { backgroundColor: '#EAAB00', paddingHorizontal: spacing.base, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.sm, minWidth: 56, alignItems: 'center' },
  saveBtnText: { fontSize: fontSize.body, fontWeight: fontWeight.bold, color: '#FFFFFF' },
  body: { paddingBottom: 40 },
  section: { backgroundColor: '#FFFFFF', padding: spacing.base, marginTop: spacing.sm, gap: spacing.xs },
  sectionTitle: { fontSize: fontSize.body, fontWeight: fontWeight.bold, color: '#737373', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.xs },
  formatNote: { fontSize: fontSize.small, color: colors.gray[400], marginBottom: spacing.xs },
  label: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: '#333333', marginTop: spacing.sm, marginBottom: spacing.xs },
  input: { borderWidth: 1, borderColor: '#E8E8E8', borderRadius: borderRadius.md, paddingHorizontal: spacing.base, paddingVertical: spacing.md, fontSize: fontSize.base, color: '#0F0F0F', backgroundColor: '#FAFAFA' },
  selector: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: '#E8E8E8', borderRadius: borderRadius.md, paddingHorizontal: spacing.base, paddingVertical: spacing.md, backgroundColor: '#FAFAFA' },
  selectorText: { flex: 1, fontSize: fontSize.base, color: '#0F0F0F', fontWeight: fontWeight.medium },
  disciplineDot: { width: 10, height: 10, borderRadius: 5 },
  dropdown: { marginTop: spacing.xs, borderWidth: 1, borderColor: '#E8E8E8', borderRadius: borderRadius.md, overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.base, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  dropdownItemText: { flex: 1, fontSize: fontSize.base, color: '#333333' },
  uploadRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  uploadBtn: { borderWidth: 1.5, borderColor: '#FDE68A', borderStyle: 'dashed', borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg, gap: spacing.xs, backgroundColor: '#FFFBEB' },
  uploadTitle: { fontSize: fontSize.body, fontWeight: fontWeight.semibold, color: '#CA8A04' },
  uploadSub: { fontSize: fontSize.small, color: '#FBBF24' },
  filePreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#FDE68A', borderRadius: borderRadius.md, padding: spacing.base, backgroundColor: '#FFFBEB', marginTop: spacing.xs },
  filePreviewLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  fileTypeBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
  fileTypeBadgeText: { fontSize: 11, fontWeight: fontWeight.bold },
  fileName: { fontSize: fontSize.body, fontWeight: fontWeight.semibold, color: '#CA8A04', maxWidth: 220 },
  fileSubtitle: { fontSize: fontSize.small, color: '#FBBF24', marginTop: 2 },
});