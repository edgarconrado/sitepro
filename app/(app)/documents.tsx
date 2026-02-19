/**
 * SitePro — Documents Screen
 * Contratos, Reportes, Especificaciones, Permisos
 * Con búsqueda, filtros, favoritos y vista de detalle
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Search,
  X,
  Star,
  FileText,
  FileCheck,
  FileCog,
  FileKey,
  Download,
  Share2,
  Calendar,
  User,
  Building2,
  ChevronRight,
  Eye,
  Clock,
  Tag,
} from 'lucide-react-native';
import { colors } from '@theme/colors';
import {
  fontSize, fontWeight, spacing, borderRadius, shadows, iconSize,
} from '@theme/tokens';
import { Badge } from '@components/ui/Badge';
import { StaggerItem, ScreenEntrance } from '@components/ui/Animated';
import { formatDate, timeAgo } from '@utils/index';

// ─── Types ────────────────────────────────────────────────────
type DocCategory = 'Contrato' | 'Reporte' | 'Especificación' | 'Permiso';
type DocStatus   = 'Vigente' | 'En revisión' | 'Vencido' | 'Borrador';

interface SiteDocument {
  id: string;
  title: string;
  category: DocCategory;
  status: DocStatus;
  fileType: 'PDF' | 'DOCX' | 'XLSX';
  fileSize: string;
  version: string;
  author: string;
  company: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  description: string;
  tags: string[];
  isFavorite: boolean;
  pages?: number;
}

// ─── Mock Data ────────────────────────────────────────────────
const INITIAL_DOCS: SiteDocument[] = [
  {
    id: '1', category: 'Contrato', status: 'Vigente', fileType: 'PDF', fileSize: '2.4 MB',
    title: 'Contrato General de Obra — Torre Empresarial Norte',
    version: 'v3.1', author: 'Roberto Díaz', company: 'Constructora Alfa S.A.',
    createdAt: '2025-08-01T09:00:00Z', updatedAt: '2026-01-15T10:00:00Z', expiresAt: '2027-08-01T00:00:00Z',
    description: 'Contrato principal de construcción que ampara todos los trabajos de la torre. Incluye alcances, costos, penalizaciones y condiciones de entrega.',
    tags: ['obra', 'principal', 'legal'], isFavorite: true, pages: 48,
  },
  {
    id: '2', category: 'Contrato', status: 'Vigente', fileType: 'PDF', fileSize: '1.1 MB',
    title: 'Subcontrato Instalaciones Eléctricas',
    version: 'v1.2', author: 'Juan Pérez', company: 'Electro Servicios MX',
    createdAt: '2025-09-10T08:00:00Z', updatedAt: '2025-12-01T09:00:00Z', expiresAt: '2026-09-10T00:00:00Z',
    description: 'Subcontrato para instalación del sistema eléctrico en todos los niveles del edificio.',
    tags: ['eléctrico', 'subcontrato'], isFavorite: false, pages: 22,
  },
  {
    id: '3', category: 'Contrato', status: 'En revisión', fileType: 'DOCX', fileSize: '890 KB',
    title: 'Addendum — Cambio de Especificaciones Fachada',
    version: 'v1.0', author: 'Roberto Díaz', company: 'Constructora Alfa S.A.',
    createdAt: '2026-01-20T10:00:00Z', updatedAt: '2026-02-10T14:00:00Z',
    description: 'Modificación contractual por cambio en materiales de fachada norte. Pendiente de firma.',
    tags: ['fachada', 'addendum', 'pendiente'], isFavorite: false, pages: 8,
  },
  {
    id: '4', category: 'Reporte', status: 'Vigente', fileType: 'PDF', fileSize: '5.2 MB',
    title: 'Reporte de Avance — Febrero 2026',
    version: 'v1.0', author: 'Carlos Ruiz', company: 'Constructora Alfa S.A.',
    createdAt: '2026-02-15T09:00:00Z', updatedAt: '2026-02-15T09:00:00Z',
    description: 'Reporte mensual de avance físico y financiero del proyecto. Incluye fotografías, métricas y proyecciones.',
    tags: ['mensual', 'avance', 'febrero'], isFavorite: true, pages: 34,
  },
  {
    id: '5', category: 'Reporte', status: 'Vigente', fileType: 'XLSX', fileSize: '1.8 MB',
    title: 'Reporte de Avance — Enero 2026',
    version: 'v1.0', author: 'Carlos Ruiz', company: 'Constructora Alfa S.A.',
    createdAt: '2026-01-16T09:00:00Z', updatedAt: '2026-01-16T09:00:00Z',
    description: 'Reporte mensual de enero con análisis de desviaciones y plan de recuperación.',
    tags: ['mensual', 'avance', 'enero'], isFavorite: false,
  },
  {
    id: '6', category: 'Reporte', status: 'Vigente', fileType: 'PDF', fileSize: '3.1 MB',
    title: 'Informe de Supervisión Estructural Q4 2025',
    version: 'v2.0', author: 'Laura Morales', company: 'Ingeniería Estructural SA',
    createdAt: '2026-01-05T10:00:00Z', updatedAt: '2026-01-05T10:00:00Z',
    description: 'Informe trimestral de supervisión de elementos estructurales, columnas, trabes y losas.',
    tags: ['estructural', 'supervisión', 'Q4'], isFavorite: false, pages: 28,
  },
  {
    id: '7', category: 'Especificación', status: 'Vigente', fileType: 'PDF', fileSize: '4.7 MB',
    title: 'Especificaciones Técnicas Generales de Construcción',
    version: 'v5.0', author: 'Roberto Díaz', company: 'Constructora Alfa S.A.',
    createdAt: '2025-07-15T08:00:00Z', updatedAt: '2025-11-20T10:00:00Z',
    description: 'Documento maestro con todas las especificaciones técnicas aplicables al proyecto.',
    tags: ['técnico', 'maestro', 'general'], isFavorite: true, pages: 112,
  },
  {
    id: '8', category: 'Especificación', status: 'Vigente', fileType: 'PDF', fileSize: '2.0 MB',
    title: 'Especificaciones de Acabados — Interiores',
    version: 'v2.1', author: 'Ana López', company: 'Constructora Alfa S.A.',
    createdAt: '2025-10-01T09:00:00Z', updatedAt: '2026-01-10T11:00:00Z',
    description: 'Catálogo de materiales, marcas y acabados aprobados para interiores de todos los niveles.',
    tags: ['acabados', 'interiores', 'materiales'], isFavorite: false, pages: 55,
  },
  {
    id: '9', category: 'Especificación', status: 'Borrador', fileType: 'DOCX', fileSize: '750 KB',
    title: 'Especificación Sistema Contra Incendio',
    version: 'v0.3', author: 'Laura Morales', company: 'Ingeniería Estructural SA',
    createdAt: '2026-02-01T10:00:00Z', updatedAt: '2026-02-14T15:00:00Z',
    description: 'Especificaciones preliminares del sistema de detección y supresión de incendios. En desarrollo.',
    tags: ['incendio', 'seguridad', 'borrador'], isFavorite: false, pages: 18,
  },
  {
    id: '10', category: 'Permiso', status: 'Vigente', fileType: 'PDF', fileSize: '980 KB',
    title: 'Licencia de Construcción — Delegación Benito Juárez',
    version: 'v1.0', author: 'Roberto Díaz', company: 'Gobierno CDMX',
    createdAt: '2025-06-01T09:00:00Z', updatedAt: '2025-06-01T09:00:00Z', expiresAt: '2027-06-01T00:00:00Z',
    description: 'Licencia oficial de construcción otorgada por la alcaldía. Incluye uso de suelo y número de registro.',
    tags: ['legal', 'gobierno', 'licencia'], isFavorite: true, pages: 6,
  },
  {
    id: '11', category: 'Permiso', status: 'Vigente', fileType: 'PDF', fileSize: '650 KB',
    title: 'Manifestación de Impacto Ambiental',
    version: 'v1.0', author: 'Carlos Ruiz', company: 'SEMARNAT',
    createdAt: '2025-05-15T09:00:00Z', updatedAt: '2025-05-15T09:00:00Z', expiresAt: '2027-05-15T00:00:00Z',
    description: 'Documento de aprobación de impacto ambiental emitido por SEMARNAT.',
    tags: ['ambiental', 'gobierno', 'SEMARNAT'], isFavorite: false, pages: 12,
  },
  {
    id: '12', category: 'Permiso', status: 'Vencido', fileType: 'PDF', fileSize: '420 KB',
    title: 'Permiso de Ocupación de Vía Pública',
    version: 'v2.0', author: 'Roberto Díaz', company: 'Gobierno CDMX',
    createdAt: '2025-08-01T09:00:00Z', updatedAt: '2025-08-01T09:00:00Z', expiresAt: '2026-02-01T00:00:00Z',
    description: 'Permiso para ocupación temporal de banqueta y arroyo vehicular durante construcción. Requiere renovación.',
    tags: ['vía pública', 'vencido', 'renovar'], isFavorite: false, pages: 4,
  },
];

// ─── Config maps ──────────────────────────────────────────────
const CATEGORY_CONFIG: Record<DocCategory, { icon: React.FC<any>; color: string; bg: string; pill: string }> = {
  'Contrato':       { icon: FileCheck, color: colors.primary[600],  bg: colors.primary[50],  pill: colors.primary[600]  },
  'Reporte':        { icon: FileText,  color: colors.success[600],  bg: colors.success[50],  pill: colors.success[600]  },
  'Especificación': { icon: FileCog,   color: colors.purple[600],   bg: colors.purple[50],   pill: colors.purple[500]   },
  'Permiso':        { icon: FileKey,   color: colors.orange[600],   bg: colors.orange[50],   pill: colors.orange[500]   },
};

const STATUS_CONFIG: Record<DocStatus, { bg: string; text: string }> = {
  'Vigente':     { bg: colors.success[100], text: colors.success[700] },
  'En revisión': { bg: colors.warning[100], text: colors.warning[700] },
  'Vencido':     { bg: colors.error[100],   text: colors.error[700]   },
  'Borrador':    { bg: colors.gray[100],    text: colors.gray[600]    },
};

const FILETYPE_COLORS: Record<string, { bg: string; text: string }> = {
  PDF:  { bg: '#FEE2E2', text: '#DC2626' },
  DOCX: { bg: '#DBEAFE', text: '#2563EB' },
  XLSX: { bg: '#D1FAE5', text: '#059669' },
};

const CATEGORIES: ('Todos' | DocCategory)[] = [
  'Todos', 'Contrato', 'Reporte', 'Especificación', 'Permiso',
];

// ─── Document Detail Modal ────────────────────────────────────
function DocDetailModal({
  doc,
  onClose,
  onToggleFavorite,
}: {
  doc: SiteDocument | null;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
}) {
  if (!doc) return null;

  const cat = CATEGORY_CONFIG[doc.category];
  const st  = STATUS_CONFIG[doc.status];
  const ft  = FILETYPE_COLORS[doc.fileType];
  const CatIcon = cat.icon;

  return (
    <Modal visible animationType="slide" transparent>
      <View style={detailModal.overlay}>
        <View style={detailModal.sheet}>
          {/* Handle */}
          <View style={detailModal.handle} />

          {/* Header */}
          <View style={detailModal.header}>
            <View style={[detailModal.catIcon, { backgroundColor: cat.bg }]}>
              <CatIcon size={22} color={cat.color} strokeWidth={1.8} />
            </View>
            <View style={detailModal.headerInfo}>
              <Text style={detailModal.headerCat}>{doc.category} · {doc.version}</Text>
              <Text style={detailModal.headerTitle} numberOfLines={2}>{doc.title}</Text>
            </View>
            <TouchableOpacity
              onPress={() => onToggleFavorite(doc.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Star
                size={22}
                color={doc.isFavorite ? colors.warning[400] : colors.gray[300]}
                fill={doc.isFavorite ? colors.warning[400] : 'transparent'}
              />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={detailModal.body}>
            {/* Badges row */}
            <View style={detailModal.badgesRow}>
              <Badge label={doc.status} bg={st.bg} textColor={st.text} />
              <Badge label={doc.fileType} bg={ft.bg} textColor={ft.text} />
              {doc.pages && <Badge label={`${doc.pages} págs.`} bg={colors.gray[100]} textColor={colors.gray[600]} />}
              <Badge label={doc.fileSize} bg={colors.gray[100]} textColor={colors.gray[600]} />
            </View>

            {/* Description */}
            <View style={detailModal.descCard}>
              <Text style={detailModal.descLabel}>Descripción</Text>
              <Text style={detailModal.descText}>{doc.description}</Text>
            </View>

            {/* Info grid */}
            <View style={detailModal.infoGrid}>
              <View style={detailModal.infoCard}>
                <View style={detailModal.infoLabelRow}>
                  <User size={12} color={colors.gray[400]} />
                  <Text style={detailModal.infoLabel}>Autor</Text>
                </View>
                <Text style={detailModal.infoValue}>{doc.author}</Text>
              </View>
              <View style={detailModal.infoCard}>
                <View style={detailModal.infoLabelRow}>
                  <Building2 size={12} color={colors.gray[400]} />
                  <Text style={detailModal.infoLabel}>Empresa</Text>
                </View>
                <Text style={detailModal.infoValue} numberOfLines={2}>{doc.company}</Text>
              </View>
              <View style={detailModal.infoCard}>
                <View style={detailModal.infoLabelRow}>
                  <Calendar size={12} color={colors.gray[400]} />
                  <Text style={detailModal.infoLabel}>Creado</Text>
                </View>
                <Text style={detailModal.infoValue}>{formatDate(doc.createdAt)}</Text>
              </View>
              <View style={detailModal.infoCard}>
                <View style={detailModal.infoLabelRow}>
                  <Clock size={12} color={colors.gray[400]} />
                  <Text style={detailModal.infoLabel}>Actualizado</Text>
                </View>
                <Text style={detailModal.infoValue}>{timeAgo(doc.updatedAt)}</Text>
              </View>
              {doc.expiresAt && (
                <View style={[detailModal.infoCard, { width: '100%' }]}>
                  <View style={detailModal.infoLabelRow}>
                    <Calendar size={12} color={doc.status === 'Vencido' ? colors.error[500] : colors.gray[400]} />
                    <Text style={[detailModal.infoLabel, doc.status === 'Vencido' && { color: colors.error[500] }]}>
                      Vence
                    </Text>
                  </View>
                  <Text style={[detailModal.infoValue, doc.status === 'Vencido' && { color: colors.error[600] }]}>
                    {formatDate(doc.expiresAt)}
                    {doc.status === 'Vencido' ? ' — ⚠️ Requiere renovación' : ''}
                  </Text>
                </View>
              )}
            </View>

            {/* Tags */}
            <View style={detailModal.tagsSection}>
              <View style={detailModal.infoLabelRow}>
                <Tag size={12} color={colors.gray[400]} />
                <Text style={detailModal.infoLabel}>Etiquetas</Text>
              </View>
              <View style={detailModal.tagsRow}>
                {doc.tags.map(tag => (
                  <View key={tag} style={detailModal.tag}>
                    <Text style={detailModal.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={detailModal.actions}>
            <TouchableOpacity style={detailModal.btnSecondary} onPress={onClose} activeOpacity={0.85}>
              <X size={16} color={colors.gray[600]} />
              <Text style={detailModal.btnSecondaryText}>Cerrar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={detailModal.btnShare} activeOpacity={0.85}>
              <Share2 size={16} color={colors.primary[600]} />
              <Text style={detailModal.btnShareText}>Compartir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={detailModal.btnDownload} activeOpacity={0.85}>
              <Download size={16} color={colors.white} />
              <Text style={detailModal.btnDownloadText}>Descargar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Document Card ────────────────────────────────────────────
function DocCard({
  doc,
  onPress,
  onToggleFavorite,
}: {
  doc: SiteDocument;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  const cat = CATEGORY_CONFIG[doc.category];
  const st  = STATUS_CONFIG[doc.status];
  const ft  = FILETYPE_COLORS[doc.fileType];
  const CatIcon = cat.icon;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* Left icon */}
      <View style={[styles.cardIcon, { backgroundColor: cat.bg }]}>
        <CatIcon size={22} color={cat.color} strokeWidth={1.8} />
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={2}>{doc.title}</Text>
        </View>
        <View style={styles.cardMeta}>
          <View style={[styles.fileTypeBadge, { backgroundColor: ft.bg }]}>
            <Text style={[styles.fileTypeText, { color: ft.text }]}>{doc.fileType}</Text>
          </View>
          <Text style={styles.cardMetaText}>{doc.version}</Text>
          <Text style={styles.cardMetaDot}>·</Text>
          <Text style={styles.cardMetaText}>{doc.fileSize}</Text>
          <Text style={styles.cardMetaDot}>·</Text>
          <Text style={styles.cardMetaText}>{timeAgo(doc.updatedAt)}</Text>
        </View>
        <View style={styles.cardBadgeRow}>
          <Badge label={doc.status} bg={st.bg} textColor={st.text} />
          <Badge label={doc.category} bg={cat.bg} textColor={cat.color} />
        </View>
      </View>

      {/* Right actions */}
      <View style={styles.cardRight}>
        <TouchableOpacity
          onPress={onToggleFavorite}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.favoriteBtn}
        >
          <Star
            size={16}
            color={doc.isFavorite ? colors.warning[400] : colors.gray[300]}
            fill={doc.isFavorite ? colors.warning[400] : 'transparent'}
          />
        </TouchableOpacity>
        <ChevronRight size={14} color={colors.gray[300]} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function DocumentsScreen() {
  const [docs, setDocs]                 = useState<SiteDocument[]>(INITIAL_DOCS);
  const [search, setSearch]             = useState('');
  const [activeCategory, setActiveCategory] = useState<'Todos' | DocCategory>('Todos');
  const [onlyFavorites, setOnlyFavorites]   = useState(false);
  const [selectedDoc, setSelectedDoc]       = useState<SiteDocument | null>(null);

  const handleToggleFavorite = (id: string) => {
    setDocs(prev =>
      prev.map(d => d.id === id ? { ...d, isFavorite: !d.isFavorite } : d)
    );
    // Keep modal in sync
    if (selectedDoc?.id === id) {
      setSelectedDoc(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  };

  const counts = useMemo(() => {
    const result: Record<string, number> = { Todos: docs.length };
    CATEGORIES.forEach(c => {
      if (c !== 'Todos') result[c] = docs.filter(d => d.category === c).length;
    });
    return result;
  }, [docs]);

  const filtered = useMemo(() => {
    return docs
      .filter(d => activeCategory === 'Todos' || d.category === activeCategory)
      .filter(d => !onlyFavorites || d.isFavorite)
      .filter(d => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          d.title.toLowerCase().includes(q) ||
          d.author.toLowerCase().includes(q) ||
          d.company.toLowerCase().includes(q) ||
          d.tags.some(t => t.toLowerCase().includes(q))
        );
      });
  }, [docs, activeCategory, onlyFavorites, search]);

  const favCount = docs.filter(d => d.isFavorite).length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={iconSize.md} color={colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Documentos</Text>
          <Text style={styles.headerSub}>{docs.length} documentos · Torre Empresarial Norte</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Search size={16} color={colors.gray[400]} />
          <TextInput
            style={styles.searchText}
            placeholder="Buscar por nombre, autor, etiqueta..."
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

        {/* Favorites toggle */}
        <TouchableOpacity
          style={[styles.favToggle, onlyFavorites && styles.favToggleActive]}
          onPress={() => setOnlyFavorites(v => !v)}
          activeOpacity={0.8}
        >
          <Star
            size={16}
            color={onlyFavorites ? colors.warning[500] : colors.gray[400]}
            fill={onlyFavorites ? colors.warning[400] : 'transparent'}
          />
          {favCount > 0 && (
            <Text style={[styles.favCount, onlyFavorites && styles.favCountActive]}>
              {favCount}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Category filter pills */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat;
            const cfg = cat !== 'Todos' ? CATEGORY_CONFIG[cat as DocCategory] : null;
            const pillColor = cfg ? cfg.pill : colors.primary[600];
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[styles.pill, active && { backgroundColor: pillColor }]}
                activeOpacity={0.75}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {cat === 'Todos' ? `Todos (${counts.Todos})` : `${cat} (${counts[cat] ?? 0})`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Stats strip */}
      <View style={styles.statsStrip}>
        {([
          { label: 'Vigentes',     count: docs.filter(d => d.status === 'Vigente').length,     color: colors.success[600] },
          { label: 'En revisión',  count: docs.filter(d => d.status === 'En revisión').length,  color: colors.warning[600] },
          { label: 'Vencidos',     count: docs.filter(d => d.status === 'Vencido').length,      color: colors.error[600]   },
          { label: 'Borradores',   count: docs.filter(d => d.status === 'Borrador').length,     color: colors.gray[500]    },
        ] as const).map((s, i) => (
          <View key={s.label} style={[styles.statItem, i < 3 && styles.statItemBorder]}>
            <Text style={[styles.statCount, { color: s.color }]}>{s.count}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* List */}
      <ScreenEntrance>
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <StaggerItem index={index}>
              <DocCard
                doc={item}
                onPress={() => setSelectedDoc(item)}
                onToggleFavorite={() => handleToggleFavorite(item.id)}
              />
            </StaggerItem>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <FileText size={44} color={colors.gray[200]} />
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptySubtitle}>
                {search ? `No se encontraron documentos para "${search}"` : 'No hay documentos en esta categoría'}
              </Text>
            </View>
          }
        />
      </ScreenEntrance>

      {/* Detail Modal */}
      <DocDetailModal
        doc={selectedDoc}
        onClose={() => setSelectedDoc(null)}
        onToggleFavorite={handleToggleFavorite}
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
    backgroundColor: colors.white,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    gap: spacing.md,
    ...shadows.sm,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    alignItems: 'center', justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text.primary },
  headerSub:   { fontSize: fontSize.small, color: colors.text.tertiary, marginTop: 2 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.gray[200],
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md, height: 40, gap: spacing.sm,
    backgroundColor: colors.background.secondary,
  },
  searchText: { flex: 1, fontSize: fontSize.body, color: colors.text.primary, paddingVertical: 0 },
  favToggle: {
    flexDirection: 'row', alignItems: 'center',
    width: 44, height: 40, borderRadius: borderRadius.sm,
    backgroundColor: colors.gray[100],
    alignItems: 'center', justifyContent: 'center',
    gap: 3,
  },
  favToggleActive: { backgroundColor: colors.warning[50], borderWidth: 1, borderColor: colors.warning[200] },
  favCount: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.gray[500] },
  favCountActive: { color: colors.warning[600] },

  filterBar: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  filterContent: { paddingHorizontal: spacing.base, paddingVertical: spacing.md, gap: spacing.sm },
  pill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.full, backgroundColor: colors.gray[100] },
  pillText: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: colors.gray[600] },
  pillTextActive: { color: colors.white },

  // Stats strip
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  statItemBorder: { borderRightWidth: 1, borderRightColor: colors.gray[100] },
  statCount: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  statLabel: { fontSize: 9, color: colors.text.tertiary, marginTop: 2 },

  listContent: { padding: spacing.base, gap: spacing.md, paddingBottom: 40 },

  // Card
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.gray[100],
    padding: spacing.md, gap: spacing.md,
    ...shadows.sm,
  },
  cardIcon: { width: 48, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardContent: { flex: 1, gap: 5, minWidth: 0 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cardTitle: { fontSize: fontSize.body, fontWeight: fontWeight.semibold, color: colors.text.primary, flex: 1, lineHeight: 18 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  fileTypeBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  fileTypeText: { fontSize: 9, fontWeight: fontWeight.bold },
  cardMetaText: { fontSize: 10, color: colors.text.tertiary },
  cardMetaDot: { fontSize: 10, color: colors.gray[300] },
  cardBadgeRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  cardRight: { alignItems: 'center', gap: spacing.sm, flexShrink: 0 },
  favoriteBtn: { padding: 4 },

  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.sm },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text.secondary },
  emptySubtitle: { fontSize: fontSize.body, color: colors.text.tertiary, textAlign: 'center', paddingHorizontal: spacing.xl },
});

// ─── Detail Modal Styles ──────────────────────────────────────
const detailModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.gray[200], alignSelf: 'center', marginTop: spacing.sm },
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: spacing.base, gap: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  catIcon: { width: 44, height: 44, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerInfo: { flex: 1 },
  headerCat:   { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: colors.text.tertiary, marginBottom: 4 },
  headerTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.text.primary, lineHeight: 20 },
  body: { padding: spacing.base },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  descCard: { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, padding: spacing.base, marginBottom: spacing.base },
  descLabel: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: colors.text.tertiary, marginBottom: spacing.xs },
  descText:  { fontSize: fontSize.body, color: colors.text.secondary, lineHeight: 20 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  infoCard: { width: '47%', backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, padding: spacing.md, gap: spacing.xs },
  infoLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoLabel: { fontSize: fontSize.small, color: colors.text.tertiary },
  infoValue: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: colors.text.primary },
  tagsSection: { gap: spacing.sm, marginBottom: spacing.lg },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { backgroundColor: colors.primary[50], paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  tagText: { fontSize: fontSize.small, color: colors.primary[600], fontWeight: fontWeight.medium },
  actions: {
    flexDirection: 'row', gap: spacing.sm,
    padding: spacing.base, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: colors.gray[100],
  },
  btnSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: colors.gray[100],
    paddingVertical: spacing.md, borderRadius: borderRadius.md,
  },
  btnSecondaryText: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: colors.gray[600] },
  btnShare: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: colors.primary[50],
    paddingVertical: spacing.md, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.primary[200],
  },
  btnShareText: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: colors.primary[600] },
  btnDownload: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: colors.primary[600],
    paddingVertical: spacing.md, borderRadius: borderRadius.md,
  },
  btnDownloadText: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: colors.white },
});
