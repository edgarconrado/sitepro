/**
 * SitePro — Plans Screen
 * Lista de planos filtrable + visor con zoom/pan (Reanimated + GestureHandler)
 */

import { colors } from '@/theme';
import { ScreenEntrance, StaggerItem } from '@components/ui/Animated';
import { Badge } from '@components/ui/Badge';
import { ConfirmDialogContainer, useConfirm } from '@components/ui/ConfirmDialog';
import { EmptyPlans } from '@components/ui/EmptyStates';
import { FAB } from '@components/ui/FAB';
import { useToast } from '@components/ui/Toast';
import { useTheme } from '@hooks/useTheme';
import { borderRadius, fontSize, fontWeight, iconSize, shadows, spacing } from '@theme/tokens';
import { formatDate } from '@utils/index';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Download,
  FileText,
  ImagePlus,
  Layers,
  Maximize2,
  Plus,
  Ruler,
  Share2,
  Trash2,
  User,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
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
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────
type Discipline = 'Arquitectónico' | 'Estructural' | 'Eléctrico' | 'Hidráulico' | 'Mecánico';
type PlanStatus = 'Vigente' | 'Revisión' | 'Obsoleto';

interface BlueprintPlan {
  id: string;
  code: string;
  title: string;
  discipline: Discipline;
  level: string;
  revision: string;
  status: PlanStatus;
  updatedAt: string;
  author: string;
  scale: string;
  bgColor: string;    // Color del placeholder
  gridColor: string;  // Color del grid del plano
}

// ─── Mock data ────────────────────────────────────────────────
const PLANS: BlueprintPlan[] = [
  { id: '1', code: 'ARQ-PB-001', title: 'Planta Baja — Distribución General', discipline: 'Arquitectónico', level: 'Planta Baja', revision: 'Rev. 4', status: 'Vigente', updatedAt: '2026-02-10T10:00:00Z', author: 'Roberto Díaz', scale: '1:100', bgColor: '#0F2940', gridColor: '#1E4A7A' },
  { id: '2', code: 'ARQ-N1-002', title: 'Nivel 1 — Distribución y Cotas', discipline: 'Arquitectónico', level: 'Nivel 1', revision: 'Rev. 3', status: 'Vigente', updatedAt: '2026-02-08T09:00:00Z', author: 'Roberto Díaz', scale: '1:100', bgColor: '#0F2940', gridColor: '#1E4A7A' },
  { id: '3', code: 'ARQ-N2-003', title: 'Nivel 2 — Planta Arquitectónica', discipline: 'Arquitectónico', level: 'Nivel 2', revision: 'Rev. 2', status: 'Revisión', updatedAt: '2026-02-05T14:00:00Z', author: 'Roberto Díaz', scale: '1:100', bgColor: '#0F2940', gridColor: '#1E4A7A' },
  { id: '4', code: 'EST-CIM-001', title: 'Cimentación — Planta de Trazo', discipline: 'Estructural', level: 'Cimentación', revision: 'Rev. 5', status: 'Vigente', updatedAt: '2026-02-12T08:00:00Z', author: 'Laura Morales', scale: '1:75', bgColor: '#1A0A2E', gridColor: '#3D1F6B' },
  { id: '5', code: 'EST-N1-002', title: 'Nivel 1 — Losa y Trabes', discipline: 'Estructural', level: 'Nivel 1', revision: 'Rev. 3', status: 'Vigente', updatedAt: '2026-02-11T11:00:00Z', author: 'Laura Morales', scale: '1:75', bgColor: '#1A0A2E', gridColor: '#3D1F6B' },
  { id: '6', code: 'EST-COL-003', title: 'Detalle de Columnas Tipo A y B', discipline: 'Estructural', level: 'General', revision: 'Rev. 1', status: 'Vigente', updatedAt: '2026-01-28T10:00:00Z', author: 'Laura Morales', scale: '1:25', bgColor: '#1A0A2E', gridColor: '#3D1F6B' },
  { id: '7', code: 'ELE-PB-001', title: 'Planta Baja — Instalación Eléctrica', discipline: 'Eléctrico', level: 'Planta Baja', revision: 'Rev. 2', status: 'Vigente', updatedAt: '2026-02-09T15:00:00Z', author: 'Juan Pérez', scale: '1:100', bgColor: '#0A1E0A', gridColor: '#1A4A1A' },
  { id: '8', code: 'ELE-N3-002', title: 'Nivel 3 — Tableros y Circuitos', discipline: 'Eléctrico', level: 'Nivel 3', revision: 'Rev. 1', status: 'Revisión', updatedAt: '2026-02-06T13:00:00Z', author: 'Juan Pérez', scale: '1:75', bgColor: '#0A1E0A', gridColor: '#1A4A1A' },
  { id: '9', code: 'HID-PB-001', title: 'Planta Baja — Red Hidráulica', discipline: 'Hidráulico', level: 'Planta Baja', revision: 'Rev. 3', status: 'Vigente', updatedAt: '2026-02-07T10:00:00Z', author: 'María García', scale: '1:100', bgColor: '#0A1A2E', gridColor: '#0A3A5A' },
  { id: '10', code: 'HID-SAN-002', title: 'Sistema Sanitario — Isométrico', discipline: 'Hidráulico', level: 'General', revision: 'Rev. 2', status: 'Vigente', updatedAt: '2026-02-04T09:00:00Z', author: 'María García', scale: '1:50', bgColor: '#0A1A2E', gridColor: '#0A3A5A' },
  { id: '11', code: 'MEC-CT-001', title: 'Cuarto de Máquinas — Distribución', discipline: 'Mecánico', level: 'Sótano', revision: 'Rev. 1', status: 'Vigente', updatedAt: '2026-01-30T11:00:00Z', author: 'Carlos Ruiz', scale: '1:50', bgColor: '#2E1A0A', gridColor: '#5A3A0A' },
  { id: '12', code: 'MEC-CLI-002', title: 'Climatización — Ductos Nivel 1-3', discipline: 'Mecánico', level: 'Niveles 1-3', revision: 'Rev. 2', status: 'Obsoleto', updatedAt: '2026-01-15T08:00:00Z', author: 'Carlos Ruiz', scale: '1:100', bgColor: '#2E1A0A', gridColor: '#5A3A0A' },
];

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

// ─── Blueprint Placeholder SVG-like View ──────────────────────
function BlueprintCanvas({ plan, width, height }: { plan: BlueprintPlan; width: number; height: number }) {
  const { colors, isDark } = useTheme();
  const gridSpacing = 24;
  const cols = Math.floor(width / gridSpacing);
  const rows = Math.floor(height / gridSpacing);

  return (
    <View style={{ width, height, backgroundColor: plan.bgColor, overflow: 'hidden' }}>
      {/* Grid horizontal lines */}
      {Array.from({ length: rows + 1 }).map((_, i) => (
        <View key={`h${i}`} style={{
          position: 'absolute', top: i * gridSpacing,
          left: 0, right: 0, height: 0.5,
          backgroundColor: plan.gridColor, opacity: 0.6,
        }} />
      ))}
      {/* Grid vertical lines */}
      {Array.from({ length: cols + 1 }).map((_, i) => (
        <View key={`v${i}`} style={{
          position: 'absolute', left: i * gridSpacing,
          top: 0, bottom: 0, width: 0.5,
          backgroundColor: plan.gridColor, opacity: 0.6,
        }} />
      ))}

      {/* Simulated floor plan shapes */}
      <View style={{ position: 'absolute', top: 40, left: 40, right: 40, bottom: 40, borderWidth: 1.5, borderColor: `${plan.gridColor}FF`, opacity: 0.9 }} />
      <View style={{ position: 'absolute', top: 40, left: 40, width: width * 0.45, height: height * 0.5, borderWidth: 1, borderColor: `${plan.gridColor}CC` }} />
      <View style={{ position: 'absolute', top: 40, right: 40, width: width * 0.3, height: height * 0.35, borderWidth: 1, borderColor: `${plan.gridColor}CC` }} />
      <View style={{ position: 'absolute', bottom: 80, left: 40, width: width * 0.6, height: height * 0.3, borderWidth: 1, borderColor: `${plan.gridColor}CC` }} />

      {/* Axis labels */}
      {['A', 'B', 'C', 'D'].map((l, i) => (
        <Text key={l} style={{
          position: 'absolute', left: 8, top: 48 + i * (height * 0.18),
          color: `${plan.gridColor}FF`, fontSize: 9, fontWeight: '700',
        }}>{l}</Text>
      ))}
      {['1', '2', '3', '4', '5'].map((l, i) => (
        <Text key={l} style={{
          position: 'absolute', top: 8, left: 32 + i * (width * 0.16),
          color: `${plan.gridColor}FF`, fontSize: 9, fontWeight: '700',
        }}>{l}</Text>
      ))}

      {/* Title block bottom right */}
      <View style={{
        position: 'absolute', bottom: 0, right: 0,
        borderTopWidth: 1, borderLeftWidth: 1, borderColor: `${plan.gridColor}FF`,
        padding: 8, width: width * 0.45,
      }}>
        <Text style={{ color: colors.white, fontSize: 8, opacity: 0.9, fontWeight: '700' }}>{plan.code}</Text>
        <Text style={{ color: colors.white, fontSize: 7, opacity: 0.6, marginTop: 2 }} numberOfLines={1}>{plan.title}</Text>
        <Text style={{ color: colors.white, fontSize: 7, opacity: 0.5, marginTop: 1 }}>Esc. {plan.scale}  •  {plan.revision}</Text>
      </View>
    </View>
  );
}

// ─── Pinch-to-zoom Viewer Modal ───────────────────────────────
function PlanViewer({ plan, onClose, onDelete }: { plan: BlueprintPlan; onClose: () => void; onDelete?: () => void }) {
  const confirm = useConfirm();
  const toast = useToast();
  const CANVAS_W = SW * 2;
  const CANVAS_H = SH * 1.6;

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  // Pinch gesture
  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, 0.5, 4);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  // Pan gesture
  const pan = Gesture.Pan()
    .onUpdate((e) => {
      offsetX.value = savedX.value + e.translationX;
      offsetY.value = savedY.value + e.translationY;
    })
    .onEnd(() => {
      savedX.value = offsetX.value;
      savedY.value = offsetY.value;
    });

  // Double tap to reset
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withSpring(1, { damping: 18, stiffness: 200 });
      savedScale.value = 1;
      offsetX.value = withSpring(0, { damping: 18, stiffness: 200 });
      offsetY.value = withSpring(0, { damping: 18, stiffness: 200 });
      savedX.value = 0;
      savedY.value = 0;
    });

  const composed = Gesture.Simultaneous(pinch, pan);
  const all = Gesture.Exclusive(doubleTap, composed);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale: scale.value },
    ],
  }));

  const zoomIn = () => { scale.value = withSpring(Math.min(scale.value + 0.5, 4), { damping: 18, stiffness: 200 }); savedScale.value = scale.value; };
  const zoomOut = () => { scale.value = withSpring(Math.max(scale.value - 0.5, 0.5), { damping: 18, stiffness: 200 }); savedScale.value = scale.value; };
  const reset = () => {
    scale.value = withSpring(1); savedScale.value = 1;
    offsetX.value = withSpring(0); offsetY.value = withSpring(0);
    savedX.value = 0; savedY.value = 0;
  };

  const dc = DISCIPLINE_COLORS[plan.discipline];

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
            <TouchableOpacity style={viewer.iconBtn}>
              <Download size={iconSize.md} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[viewer.iconBtn, viewer.iconBtnDanger]}
              onPress={() => confirm.confirm({
                title: 'Eliminar plano',
                message: `¿Eliminar "${plan.title}"? Se eliminará del proyecto permanentemente.`,
                confirmLabel: 'Sí, eliminar',
                icon: 'trash',
                variant: 'danger',
                onConfirm: () => { try { onDelete(); toast.success('Plano eliminado', plan.title); onClose(); } catch { toast.error('Error al eliminar', 'Inténtalo de nuevo'); } },
              })}
            >
              <Trash2 size={iconSize.md} color={colors.error[400]} />
            </TouchableOpacity>
          </View>

          {/* Blueprint canvas with gesture */}
          <View style={viewer.canvasWrapper}>
            <GestureDetector gesture={all}>
              <Animated.View style={[viewer.canvas, animStyle]}>
                <BlueprintCanvas plan={plan} width={CANVAS_W} height={CANVAS_H} />
              </Animated.View>
            </GestureDetector>

            {/* Hint */}
            <View style={viewer.hint}>
              <Text style={viewer.hintText}>Pellizca para zoom · Doble tap para resetear</Text>
            </View>
          </View>

          {/* Zoom controls */}
          <View style={viewer.zoomControls}>
            <TouchableOpacity style={viewer.zoomBtn} onPress={zoomIn}>
              <ZoomIn size={18} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={viewer.zoomBtn} onPress={zoomOut}>
              <ZoomOut size={18} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={viewer.zoomBtn} onPress={reset}>
              <Maximize2 size={18} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* Bottom info sheet */}
          <View style={viewer.infoSheet}>
            <View style={viewer.infoRow}>
              <Badge label={plan.discipline} bg={dc.bg} textColor={dc.text} />
              <Badge label={plan.status} bg={STATUS_COLORS[plan.status].bg} textColor={STATUS_COLORS[plan.status].text} />
              <Badge label={plan.revision} bg={colors.gray[100]} textColor={colors.gray[600]} />
            </View>
            <View style={viewer.infoGrid}>
              <View style={viewer.infoItem}>
                <Layers size={12} color={colors.gray[400]} />
                <Text style={viewer.infoText}>{plan.level}</Text>
              </View>
              <View style={viewer.infoItem}>
                <User size={12} color={colors.gray[400]} />
                <Text style={viewer.infoText}>{plan.author}</Text>
              </View>
              <View style={viewer.infoItem}>
                <Calendar size={12} color={colors.gray[400]} />
                <Text style={viewer.infoText}>{formatDate(plan.updatedAt)}</Text>
              </View>
              <View style={viewer.infoItem}>
                <FileText size={12} color={colors.gray[400]} />
                <Text style={viewer.infoText}>Esc. {plan.scale}</Text>
              </View>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
      <ConfirmDialogContainer />
    </Modal>
  );
}

// ─── Plan Card ────────────────────────────────────────────────
function PlanCard({ plan, onPress }: { plan: BlueprintPlan; onPress: () => void }) {
  const dc = DISCIPLINE_COLORS[plan.discipline];
  const sc = STATUS_COLORS[plan.status];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* Thumbnail */}
      <View style={styles.thumbnail}>
        <BlueprintCanvas plan={plan} width={88} height={72} />
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardCode}>{plan.code}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>{plan.title}</Text>
        <View style={styles.cardMeta}>
          <Layers size={11} color={colors.gray[400]} />
          <Text style={styles.cardMetaText}>{plan.level}</Text>
          <Text style={styles.cardMetaDot}>·</Text>
          <Text style={styles.cardMetaText}>{plan.revision}</Text>
        </View>
        <View style={styles.cardBadges}>
          <Badge label={plan.status} bg={sc.bg} textColor={sc.text} />
        </View>
      </View>

      <ChevronRight size={16} color={colors.gray[300]} />
    </TouchableOpacity>
  );
}


// ─── Discipline & Scale options ───────────────────────────────
const DISCIPLINE_OPTIONS: Discipline[] = ['Arquitectónico', 'Estructural', 'Eléctrico', 'Hidráulico', 'Mecánico'];
const SCALE_OPTIONS = ['1:25', '1:50', '1:75', '1:100', '1:150', '1:200', '1:500'];
const LEVEL_OPTIONS = ['Planta Baja', 'Nivel 1', 'Nivel 2', 'Nivel 3', 'Cimentación', 'Sótano', 'Azotea', 'General'];

const DISCIPLINE_BG: Record<Discipline, string> = {
  'Arquitectónico': '#0F2940',
  'Estructural': '#1A0A2E',
  'Eléctrico': '#0A1E0A',
  'Hidráulico': '#0A1A2E',
  'Mecánico': '#2E1A0A',
};
const DISCIPLINE_GRID: Record<Discipline, string> = {
  'Arquitectónico': '#1E4A7A',
  'Estructural': '#3D1F6B',
  'Eléctrico': '#1A4A1A',
  'Hidráulico': '#0A3A5A',
  'Mecánico': '#5A3A0A',
};

function NewPlanModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (plan: BlueprintPlan) => void;
}) {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [discipline, setDiscipline] = useState<Discipline>('Arquitectónico');
  const [level, setLevel] = useState('Planta Baja');
  const [author, setAuthor] = useState('');
  const [scale, setScale] = useState('1:100');
  const [revision, setRevision] = useState('Rev. 1');
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showDisciplines, setShowDisciplines] = useState(false);
  const [showLevels, setShowLevels] = useState(false);
  const [showScales, setShowScales] = useState(false);

  const pickFile = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: false,
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setFileUri(result.assets[0].uri);
        const parts = result.assets[0].uri.split('/');
        setFileName(parts[parts.length - 1]);
      }
    } catch {
      Alert.alert('Error', 'No se pudo seleccionar el archivo.');
    }
  };

  const handleSave = () => {
    if (!code.trim()) { Alert.alert('Requerido', 'El código del plano es obligatorio.'); return; }
    if (!title.trim()) { Alert.alert('Requerido', 'El título del plano es obligatorio.'); return; }

    const newPlan: BlueprintPlan = {
      id: `plan-${Date.now()}`,
      code: code.trim().toUpperCase(),
      title: title.trim(),
      discipline,
      level,
      revision,
      status: 'Vigente',
      updatedAt: new Date().toISOString(),
      author: author.trim() || 'Sin especificar',
      scale,
      bgColor: DISCIPLINE_BG[discipline],
      gridColor: DISCIPLINE_GRID[discipline],
    };
    onSave(newPlan);
  };

  const dc = DISCIPLINE_COLORS[discipline];

  return (
    <View style={np.fullscreen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* Header */}
        <View style={np.header}>
          <TouchableOpacity onPress={onClose} style={np.cancelBtn}>
            <X size={18} color={colors.gray[500]} />
            <Text style={np.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={np.headerTitle}>Nuevo Plano</Text>
          <TouchableOpacity onPress={handleSave} style={np.saveBtn}>
            <Text style={np.saveBtnText}>Agregar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={np.body}
        >
          {/* Preview card */}
          <View style={[np.preview, { backgroundColor: DISCIPLINE_BG[discipline] }]}>
            <BlueprintCanvas
              plan={{ id: '0', code: code || 'XXX-000', title: title || 'Nuevo plano', discipline, level, revision, status: 'Vigente', updatedAt: '', author, scale, bgColor: DISCIPLINE_BG[discipline], gridColor: DISCIPLINE_GRID[discipline] }}
              width={SW - spacing.base * 2}
              height={160}
            />
          </View>

          {/* ── Código y título ── */}
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

          {/* ── Disciplina y nivel ── */}
          <View style={np.section}>
            <Text style={np.sectionTitle}>Clasificación</Text>

            <Text style={np.label}>Disciplina</Text>
            <TouchableOpacity style={np.selector} onPress={() => setShowDisciplines(v => !v)} activeOpacity={0.8}>
              <View style={[np.disciplineDot, { backgroundColor: dc.pill }]} />
              <Text style={np.selectorText}>{discipline}</Text>
              <ChevronRight size={16} color={colors.gray[400]} style={{ transform: [{ rotate: showDisciplines ? '90deg' : '0deg' }] }} />
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
                      activeOpacity={0.8}
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
              <ChevronRight size={16} color={colors.gray[400]} style={{ transform: [{ rotate: showLevels ? '90deg' : '0deg' }] }} />
            </TouchableOpacity>
            {showLevels && (
              <View style={np.dropdown}>
                {LEVEL_OPTIONS.map(l => (
                  <TouchableOpacity
                    key={l}
                    style={[np.dropdownItem, l === level && { backgroundColor: colors.primary[50] }]}
                    onPress={() => { setLevel(l); setShowLevels(false); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[np.dropdownItemText, l === level && { color: colors.primary[700], fontWeight: fontWeight.bold }]}>{l}</Text>
                    {l === level && <Text style={{ color: colors.primary[600] }}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ── Autor y escala ── */}
          <View style={np.section}>
            <Text style={np.sectionTitle}>Detalles técnicos</Text>

            <Text style={np.label}>Autor / Responsable</Text>
            <TextInput
              style={np.input}
              placeholder="Ej: Roberto Díaz"
              placeholderTextColor={colors.gray[400]}
              value={author}
              onChangeText={setAuthor}
              maxLength={40}
            />

            <Text style={np.label}>Escala</Text>
            <TouchableOpacity style={np.selector} onPress={() => setShowScales(v => !v)} activeOpacity={0.8}>
              <Ruler size={15} color={colors.gray[500]} />
              <Text style={np.selectorText}>{scale}</Text>
              <ChevronRight size={16} color={colors.gray[400]} style={{ transform: [{ rotate: showScales ? '90deg' : '0deg' }] }} />
            </TouchableOpacity>
            {showScales && (
              <View style={np.dropdown}>
                {SCALE_OPTIONS.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[np.dropdownItem, s === scale && { backgroundColor: colors.primary[50] }]}
                    onPress={() => { setScale(s); setShowScales(false); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[np.dropdownItemText, s === scale && { color: colors.primary[700], fontWeight: fontWeight.bold }]}>{s}</Text>
                    {s === scale && <Text style={{ color: colors.primary[600] }}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ── Archivo ── */}
          <View style={np.section}>
            <Text style={np.sectionTitle}>Archivo del plano</Text>

            {fileUri ? (
              <View style={np.filePreview}>
                <View style={np.filePreviewLeft}>
                  <ImagePlus size={20} color={colors.primary[600]} />
                  <View>
                    <Text style={np.fileName} numberOfLines={1}>{fileName}</Text>
                    <Text style={np.fileSubtitle}>Archivo seleccionado</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => { setFileUri(null); setFileName(null); }}>
                  <X size={16} color={colors.gray[400]} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={np.uploadBtn} onPress={pickFile} activeOpacity={0.85}>
                <ImagePlus size={24} color={colors.primary[500]} />
                <Text style={np.uploadTitle}>Subir PDF o imagen</Text>
                <Text style={np.uploadSub}>Toca para seleccionar desde tu dispositivo</Text>
              </TouchableOpacity>
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
  const { colors, isDark } = useTheme();
  const [plans, setPlans] = useState<BlueprintPlan[]>(PLANS);
  const [activeFilter, setActiveFilter] = useState<'Todas' | Discipline>('Todas');
  const [selectedPlan, setSelectedPlan] = useState<BlueprintPlan | null>(null);
  const [showNewPlan, setShowNewPlan] = useState(false);

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

  return (
    <>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={iconSize.md} color={colors.gray[700]} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Planos</Text>
            <Text style={styles.headerSub}>{plans.length} planos · Torre Empresarial Norte</Text>
          </View>
          <TouchableOpacity style={styles.shareBtn}>
            <Share2 size={iconSize.md} color={colors.gray[600]} />
          </TouchableOpacity>
        </View>

        {/* Filter pills */}
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
            {DISCIPLINES.map((d) => {
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
                    {d === 'Todas' ? `Todos (${counts.Todas})` : `${d.split('')[0]}... (${counts[d] ?? 0})`}
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
            renderItem={({ item, index }) => (
              <StaggerItem index={index}>
                <PlanCard plan={item} onPress={() => setSelectedPlan(item)} />
              </StaggerItem>
            )}
            ListEmptyComponent={
              <EmptyPlans
                title="Sin planos"
                subtitle="Esta disciplina no tiene planos cargados. Sube el primero para que el equipo pueda consultarlo."
                cta={{ label: '+ Subir plano', onPress: () => setShowNewPlan(true) }}
              />
            }
          />
        </ScreenEntrance>

        {/* Viewer */}
        {selectedPlan && (
          <PlanViewer
            plan={selectedPlan}
            onClose={() => setSelectedPlan(null)}
            onDelete={() => setPlans(prev => prev.filter(p => p.id !== selectedPlan.id))}
          />
        )}

        {/* FAB */}
        <FAB
          onPress={() => setShowNewPlan(true)}
          icon={<Plus size={24} color={colors.white} />}
        />

      </SafeAreaView>

      {/* New Plan Modal */}
      {showNewPlan && (
        <NewPlanModal
          onClose={() => setShowNewPlan(false)}
          onSave={(plan) => {
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: spacing.md,
    ...shadows.sm,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: '#0F0F0F' },
  headerSub: { fontSize: fontSize.small, color: '#737373', marginTop: 2 },
  shareBtn: { padding: spacing.sm },

  filterBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  filterContent: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: '#F5F5F5',
  },
  pillText: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: '#525252' },
  pillTextActive: { color: '#FFFFFF' },

  listContent: { padding: spacing.base, gap: spacing.md, paddingBottom: 32 },

  // Plan card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    overflow: 'hidden',
    gap: spacing.md,
    paddingRight: spacing.md,
    ...shadows.sm,
  },
  thumbnail: {
    width: 88,
    height: 72,
    flexShrink: 0,
  },
  cardInfo: { flex: 1, paddingVertical: spacing.md, gap: 4 },
  cardCode: { fontSize: fontSize.small, fontWeight: fontWeight.bold, color: '#EAAB00' },
  cardTitle: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: '#0F0F0F', lineHeight: 18 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { fontSize: 10, color: '#737373' },
  cardMetaDot: { color: '#D4D4D4', fontSize: 10 },
  cardBadges: { flexDirection: 'row', gap: spacing.xs, marginTop: 2 },

  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.sm },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#333333' },
  emptySubtitle: { fontSize: fontSize.body, color: '#737373' },
});

// ─── Viewer Styles ────────────────────────────────────────────
const viewer = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: (StatusBar.currentHeight ?? 44) + spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  iconBtn: {
    width: 36, height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  topInfo: { flex: 1 },
  topCode: { fontSize: fontSize.small, fontWeight: fontWeight.bold, color: '#FBBF24' },
  topTitle: { fontSize: fontSize.body, color: '#FFFFFF', opacity: 0.85 },

  canvasWrapper: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvas: {},

  hint: {
    position: 'absolute',
    bottom: spacing.md,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  hintText: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },

  zoomControls: {
    position: 'absolute',
    right: spacing.base,
    bottom: 160,
    gap: spacing.sm,
  },
  zoomBtn: {
    width: 40, height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },

  infoSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.base,
    paddingBottom: 32,
    gap: spacing.md,
  },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.base,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoText: { fontSize: fontSize.small, color: '#333333' },
});

// ─── New Plan Modal Styles ────────────────────────────────────
const np = StyleSheet.create({
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FAFAFA',
    zIndex: 200,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.base,
    paddingTop: (StatusBar.currentHeight ?? 44) + spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
    ...shadows.sm,
  },
  headerTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: '#0F0F0F' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cancelText: { fontSize: fontSize.body, color: '#737373' },
  saveBtn: { backgroundColor: '#EAAB00', paddingHorizontal: spacing.base, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.sm },
  saveBtnText: { fontSize: fontSize.body, fontWeight: fontWeight.bold, color: '#FFFFFF' },

  body: { paddingBottom: 40 },

  preview: {
    borderRadius: borderRadius.md,
    margin: spacing.base,
    overflow: 'hidden',
    ...shadows.md,
  },

  section: {
    backgroundColor: '#FFFFFF',
    padding: spacing.base,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: '#737373',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    color: '#333333',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1, borderColor: '#E8E8E8',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    fontSize: fontSize.base, color: '#0F0F0F',
    backgroundColor: '#FAFAFA',
  },
  selector: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderColor: '#E8E8E8',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    backgroundColor: '#FAFAFA',
  },
  selectorText: { flex: 1, fontSize: fontSize.base, color: '#0F0F0F', fontWeight: fontWeight.medium },
  disciplineDot: { width: 10, height: 10, borderRadius: 5 },
  dropdown: {
    marginTop: spacing.xs,
    borderWidth: 1, borderColor: '#E8E8E8',
    borderRadius: borderRadius.md, overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  dropdownItemText: { flex: 1, fontSize: fontSize.base, color: '#333333' },

  uploadBtn: {
    borderWidth: 1.5, borderColor: '#FDE68A',
    borderStyle: 'dashed', borderRadius: borderRadius.md,
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.xl, gap: spacing.sm,
    backgroundColor: '#FFFBEB',
    marginTop: spacing.xs,
  },
  uploadTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: '#CA8A04' },
  uploadSub: { fontSize: fontSize.small, color: '#FBBF24' },

  filePreview: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#FDE68A',
    borderRadius: borderRadius.md, padding: spacing.base,
    backgroundColor: '#FFFBEB', marginTop: spacing.xs,
  },
  filePreviewLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  fileName: { fontSize: fontSize.body, fontWeight: fontWeight.semibold, color: '#CA8A04', maxWidth: 220 },
  fileSubtitle: { fontSize: fontSize.small, color: '#FBBF24', marginTop: 2 },
  iconBtnDanger: {
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
});