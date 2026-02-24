/**
 * SitePro — Búsqueda Global
 * Busca en tareas, documentos, planos y fotos simultáneamente
 */

import { colors } from '@/theme';
import { useTheme } from '@hooks/useTheme';
import { useAppStore } from '@store/appStore';
import { borderRadius, fontSize, fontWeight, spacing } from '@theme/tokens';
import {
  Camera,
  CheckSquare,
  Clock,
  FileText,
  Map,
  Search,
  X
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// ─── Static data (same mocks as screens) ─────────────────────
// Documents
const SEARCH_DOCS = [
  { id: 'd1', title: 'Contrato General de Obra — Torre Empresarial Norte', subtitle: 'Contrato · PDF · v3.1', tags: ['obra', 'principal', 'legal'] },
  { id: 'd2', title: 'Subcontrato Instalaciones Eléctricas', subtitle: 'Contrato · PDF · v1.2', tags: ['eléctrico', 'subcontrato'] },
  { id: 'd3', title: 'Addendum — Cambio de Especificaciones Fachada', subtitle: 'Contrato · DOCX · v1.0', tags: ['fachada', 'addendum'] },
  { id: 'd4', title: 'Reporte de Avance — Febrero 2026', subtitle: 'Reporte · PDF · v1.0', tags: ['avance', 'mensual'] },
  { id: 'd5', title: 'Bitácora de Obra — Semana 7', subtitle: 'Reporte · PDF · v2.0', tags: ['bitácora', 'semana'] },
  { id: 'd6', title: 'Planos Estructurales As-Built Nivel 1-5', subtitle: 'Plano · PDF · v1.0', tags: ['estructural', 'as-built'] },
  { id: 'd7', title: 'Catálogo de Conceptos y Precios Unitarios', subtitle: 'Presupuesto · XLSX · v4.2', tags: ['presupuesto', 'conceptos'] },
  { id: 'd8', title: 'Estimación No. 8 — Trabajos de Albañilería', subtitle: 'Estimación · XLSX · v1.0', tags: ['estimación', 'albañilería'] },
  { id: 'd9', title: 'Manual de Especificaciones Técnicas', subtitle: 'Especificación · PDF · v2.1', tags: ['especificaciones', 'técnico'] },
  { id: 'd10', title: 'Protocolo de Seguridad e Higiene', subtitle: 'Especificación · PDF · v3.0', tags: ['seguridad', 'higiene'] },
];

// Plans
const SEARCH_PLANS = [
  { id: 'p1', title: 'Planta Baja — Distribución General', subtitle: 'Arquitectónico · Planta Baja · Rev. 4', tags: [] },
  { id: 'p2', title: 'Nivel 1 — Distribución y Cotas', subtitle: 'Arquitectónico · Nivel 1 · Rev. 3', tags: [] },
  { id: 'p3', title: 'Nivel 2 — Planta Arquitectónica', subtitle: 'Arquitectónico · Nivel 2 · Rev. 2', tags: [] },
  { id: 'p4', title: 'Cimentación — Planta de Trazo', subtitle: 'Estructural · Cimentación · Rev. 5', tags: [] },
  { id: 'p5', title: 'Losa Nivel 1 — Planta de Viguetas', subtitle: 'Estructural · Nivel 1 · Rev. 2', tags: [] },
  { id: 'p6', title: 'Instalación Eléctrica — Planta Baja', subtitle: 'Eléctrico · Planta Baja · Rev. 1', tags: ['eléctrico'] },
  { id: 'p7', title: 'Instalación Hidráulica — Niveles 1-5', subtitle: 'Hidráulico · Niveles 1-5 · Rev. 3', tags: ['hidráulico'] },
];

// Photos
const SEARCH_PHOTOS = [
  { id: 'ph1', title: 'Foto — Piso 5 Zona A', subtitle: 'Juan Pérez · Zona A', tags: ['eléctrico', 'piso-5'] },
  { id: 'ph2', title: 'Foto — Piso 3 Baños', subtitle: 'Ana López · Baños', tags: ['plomería', 'piso-3'] },
  { id: 'ph3', title: 'Foto — Piso 7 Estructura', subtitle: 'Carlos Ruiz · Estructura', tags: ['estructura', 'piso-7'] },
  { id: 'ph4', title: 'Foto — Fachada Norte', subtitle: 'María García · Fachada', tags: ['fachada', 'exterior'] },
  { id: 'ph5', title: 'Foto — Lobby PB', subtitle: 'Juan Pérez · Planta Baja', tags: ['acabados', 'lobby'] },
  { id: 'ph6', title: 'Foto — Cuarto de Máquinas', subtitle: 'Carlos Ruiz · Sótano', tags: ['mecánico', 'sótano'] },
  { id: 'ph7', title: 'Foto — Piso 10 Losa', subtitle: 'Ana López · Techo', tags: ['losa', 'piso-10'] },
  { id: 'ph8', title: 'Foto — Escalera de Emergencia', subtitle: 'María García · Circulación', tags: ['escalera', 'seguridad'] },
];

// ─── Types ────────────────────────────────────────────────────
type ResultType = 'task' | 'document' | 'plan' | 'photo';

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string;
  tags: string[];
}

const TYPE_META: Record<ResultType, {
  label: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
}> = {
  task: { label: 'Tarea', icon: <CheckSquare size={16} color={colors.primary[600]} strokeWidth={2} />, iconColor: colors.primary[600], iconBg: colors.primary[50] },
  document: { label: 'Documento', icon: <FileText size={16} color={colors.warning[600]} strokeWidth={2} />, iconColor: colors.warning[600], iconBg: colors.warning[50] },
  plan: { label: 'Plano', icon: <Map size={16} color={colors.purple[500]} strokeWidth={2} />, iconColor: colors.purple[500], iconBg: colors.purple[50] },
  photo: { label: 'Foto', icon: <Camera size={16} color={colors.success[600]} strokeWidth={2} />, iconColor: colors.success[600], iconBg: colors.success[50] },
};

// ─── Result Row ───────────────────────────────────────────────
function ResultRow({ result }: { result: SearchResult }) {
  const { colors, isDark } = useTheme();
  const meta = TYPE_META[result.type];
  return (
    <TouchableOpacity style={s.row} activeOpacity={0.7}>
      <View style={[s.rowIcon, { backgroundColor: meta.iconBg }]}>
        {meta.icon}
      </View>
      <View style={s.rowContent}>
        <Text style={s.rowTitle} numberOfLines={1}>{result.title}</Text>
        <Text style={s.rowSub} numberOfLines={1}>{result.subtitle}</Text>
      </View>
      <View style={[s.typePill, { backgroundColor: meta.iconBg }]}>
        <Text style={[s.typePillText, { color: meta.iconColor }]}>{meta.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Empty State ──────────────────────────────────────────────
function EmptySearch({ query }: { query: string }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Search size={28} color={colors.gray[400]} strokeWidth={1.5} />
      </View>
      <Text style={s.emptyTitle}>Sin resultados</Text>
      <Text style={s.emptySub}>No encontramos nada para "{query}"</Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────
export function GlobalSearch({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const tasks = useAppStore((s) => s.tasks);

  // Build all searchable items
  const allItems = useMemo((): SearchResult[] => [
    ...tasks.map(t => ({
      id: `task-${t.id}`,
      type: 'task' as ResultType,
      title: t.title,
      subtitle: `${t.status} · ${t.location} · ${t.assignedTo.name}`,
      tags: [t.status, t.priority, t.location],
    })),
    ...SEARCH_DOCS.map(d => ({ ...d, type: 'document' as ResultType })),
    ...SEARCH_PLANS.map(p => ({ ...p, type: 'plan' as ResultType })),
    ...SEARCH_PHOTOS.map(p => ({ ...p, type: 'photo' as ResultType })),
  ], [tasks]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allItems.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.tags.some(t => t.toLowerCase().includes(q))
    ).slice(0, 30);
  }, [query, allItems]);

  // Group by type
  const grouped = useMemo(() => {
    const map: Partial<Record<ResultType, SearchResult[]>> = {};
    results.forEach(r => {
      if (!map[r.type]) map[r.type] = [];
      map[r.type]!.push(r);
    });
    return map;
  }, [results]);

  const hasQuery = query.trim().length > 0;
  const hasResults = results.length > 0;

  // Recent searches (static mock)
  const recents = ['instalación eléctrica', 'fachada norte', 'contrato obra', 'piso 5'];

  // Animation
  const sheetY = useSharedValue(60);
  const sheetOp = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      sheetY.value = withSpring(0, { damping: 22, stiffness: 280 });
      sheetOp.value = withTiming(1, { duration: 180 });
    } else {
      sheetY.value = withTiming(60, { duration: 220 });
      sheetOp.value = withTiming(0, { duration: 180 });
      setQuery('');
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
    opacity: sheetOp.value,
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />

      <Animated.View style={[s.sheet, sheetStyle]} pointerEvents="box-none">
        {/* Search Input */}
        <View style={s.inputRow}>
          <View style={s.inputWrap}>
            <Search size={18} color={colors.gray[400]} strokeWidth={2} style={s.searchIcon} />
            <TextInput
              style={s.input}
              placeholder="Buscar tareas, documentos, planos, fotos..."
              placeholderTextColor={colors.gray[400]}
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {hasQuery && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={colors.gray[400]} strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
            <Text style={s.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* No query → recents */}
          {!hasQuery && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>Búsquedas recientes</Text>
              {recents.map(r => (
                <TouchableOpacity
                  key={r}
                  style={s.recentRow}
                  onPress={() => setQuery(r)}
                  activeOpacity={0.7}
                >
                  <Clock size={14} color={colors.gray[400]} strokeWidth={2} />
                  <Text style={s.recentText}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Has query + results */}
          {hasQuery && hasResults && (
            <>
              <Text style={s.countLabel}>{results.length} resultado{results.length !== 1 ? 's' : ''}</Text>
              {(['task', 'document', 'plan', 'photo'] as ResultType[]).map(type => {
                const group = grouped[type];
                if (!group?.length) return null;
                const meta = TYPE_META[type];
                return (
                  <View key={type} style={s.section}>
                    <View style={s.groupHeader}>
                      <View style={[s.groupIconBg, { backgroundColor: meta.iconBg }]}>
                        {meta.icon}
                      </View>
                      <Text style={s.sectionLabel}>{meta.label}s</Text>
                      <Text style={s.groupCount}>{group.length}</Text>
                    </View>
                    {group.map(r => <ResultRow key={r.id} result={r} />)}
                  </View>
                );
              })}
            </>
          )}

          {/* Has query + no results */}
          {hasQuery && !hasResults && <EmptySearch query={query} />}

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    // Only rounded bottom-left/right if partial sheet — but full screen is cleaner
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  searchIcon: { flexShrink: 0 },
  input: {
    flex: 1,
    fontSize: fontSize.body,
    color: '#0F0F0F',
    padding: 0,
  },
  cancelBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  cancelText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    color: '#EAAB00',
  },
  scroll: { flex: 1 },
  countLabel: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    color: '#737373',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  section: {
    paddingTop: spacing.md,
  },
  sectionLabel: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.bold,
    color: '#737373',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xs,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  groupIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupCount: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.bold,
    color: '#737373',
    marginLeft: 'auto',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#FAFAFA',
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowContent: { flex: 1 },
  rowTitle: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    color: '#0F0F0F',
  },
  rowSub: {
    fontSize: fontSize.small,
    color: '#737373',
    marginTop: 2,
  },
  typePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#FAFAFA',
  },
  recentText: {
    fontSize: fontSize.body,
    color: '#333333',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 64,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: '#333333',
  },
  emptySub: {
    fontSize: fontSize.body,
    color: '#737373',
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});