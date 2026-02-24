/**
 * SitePro — Documents Screen
 * Contratos, Reportes, Especificaciones, Permisos
 * Con búsqueda, filtros, favoritos y vista de detalle
 */

import { colors } from '@/theme';
import { ScreenEntrance, StaggerItem } from '@components/ui/Animated';
import { Badge } from '@components/ui/Badge';
import { ConfirmDialogContainer, useConfirm } from '@components/ui/ConfirmDialog';
import { EmptyDocuments, EmptySearch } from '@components/ui/EmptyStates';
import { FAB } from '@components/ui/FAB';
import { useToast } from '@components/ui/Toast';
import { useTheme } from '@hooks/useTheme';
import {
  borderRadius,
  fontSize, fontWeight,
  iconSize,
  shadows,
  spacing,
} from '@theme/tokens';
import { formatDate, timeAgo } from '@utils/index';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Building2,
  Calendar,
  ChevronRight,
  Clock,
  Download,
  FileCheck,
  FileCog,
  FileKey,
  FileText,
  ImagePlus,
  Plus,
  Search,
  Share2,
  Star,
  Tag,
  Trash2,
  User,
  X
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Alert,
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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────
type DocCategory = 'Contrato' | 'Reporte' | 'Especificación' | 'Permiso';
type DocStatus = 'Vigente' | 'En revisión' | 'Vencido' | 'Borrador';

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
  'Contrato': { icon: FileCheck, color: colors.primary[600], bg: colors.primary[50], pill: colors.primary[600] },
  'Reporte': { icon: FileText, color: colors.success[600], bg: colors.success[50], pill: colors.success[600] },
  'Especificación': { icon: FileCog, color: colors.purple[600], bg: colors.purple[50], pill: colors.purple[500] },
  'Permiso': { icon: FileKey, color: colors.orange[600], bg: colors.orange[50], pill: colors.orange[500] },
};

const STATUS_CONFIG: Record<DocStatus, { bg: string; text: string }> = {
  'Vigente': { bg: colors.success[100], text: colors.success[700] },
  'En revisión': { bg: colors.warning[100], text: colors.warning[700] },
  'Vencido': { bg: colors.error[100], text: colors.error[700] },
  'Borrador': { bg: colors.gray[100], text: colors.gray[600] },
};

const FILETYPE_COLORS: Record<string, { bg: string; text: string }> = {
  PDF: { bg: '#FEE2E2', text: '#DC2626' },
  DOCX: { bg: '#E0F2FE', text: '#0369A1' },
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
  onDelete,
}: {
  doc: SiteDocument | null;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const confirm = useConfirm();
  const toast = useToast();
  if (!doc) return null;
  const cat = CATEGORY_CONFIG[doc.category];
  const st = STATUS_CONFIG[doc.status];
  const ft = FILETYPE_COLORS[doc.fileType];
  const CatIcon = cat.icon;

  return (
    <Modal visible={!!doc} animationType="slide" transparent>
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
            <TouchableOpacity
              style={detailModal.btnDelete}
              activeOpacity={0.85}
              onPress={() => confirm.confirm({
                title: 'Eliminar documento',
                message: `¿Eliminar "${doc.title}"? Se eliminará permanentemente del proyecto.`,
                confirmLabel: 'Sí, eliminar',
                icon: 'folder-remove',
                variant: 'danger',
                onConfirm: () => { try { onDelete(doc.id); toast.success('Documento eliminado', doc.title); onClose(); } catch { toast.error('Error al eliminar', 'Inténtalo de nuevo'); } },
              })}
            >
              <Trash2 size={15} color={colors.error[500]} strokeWidth={2} />
              <Text style={detailModal.btnDeleteText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <ConfirmDialogContainer />
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
  const st = STATUS_CONFIG[doc.status];
  const ft = FILETYPE_COLORS[doc.fileType];
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


// ─── New Document Modal ───────────────────────────────────────
const CAT_OPTIONS: DocCategory[] = ['Contratos', 'Reportes', 'Especificaciones', 'Permisos'];
const FILETYPE_OPTIONS: ('PDF' | 'DOCX' | 'XLSX')[] = ['PDF', 'DOCX', 'XLSX'];
const TAG_SUGGESTIONS = ['urgente', 'revisión', 'aprobado', 'pendiente', 'confidencial', 'externo', 'interno', 'legal'];

const CAT_ICONS: Record<DocCategory, React.ReactNode> = {
  'Contratos': <FileCheck size={16} color={colors.primary[600]} />,
  'Reportes': <FileText size={16} color={colors.success[600]} />,
  'Especificaciones': <FileCog size={16} color={colors.purple[500]} />,
  'Permisos': <FileKey size={16} color={colors.orange[500]} />,
};

const NEW_CAT_COLORS = {
  'Contratos': { bg: colors.primary[50], border: colors.primary[300], text: colors.primary[700] },
  'Reportes': { bg: colors.success[50], border: colors.success[300], text: colors.success[700] },
  'Especificaciones': { bg: colors.purple[50], border: colors.purple[300], text: colors.purple[700] },
  'Permisos': { bg: colors.orange[50], border: colors.orange[300], text: colors.orange[700] },
};

const NEW_FILETYPE_COLORS = {
  'PDF': { bg: '#FEE2E2', text: '#991B1B' },
  'DOCX': { bg: '#DBEAFE', text: '#1E40AF' },
  'XLSX': { bg: '#D1FAE5', text: '#065F46' },
};

function NewDocModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (doc: SiteDocument) => void;
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocCategory>('Contratos');
  const [fileType, setFileType] = useState<'PDF' | 'DOCX' | 'XLSX'>('PDF');
  const [company, setCompany] = useState('');
  const [author, setAuthor] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState('');

  const fmtDate = (t: string, setter: (v: string) => void) => {
    const d = t.replace(/[^0-9]/g, '').slice(0, 8);
    let f = d;
    if (d.length > 4) f = d.slice(0, 4) + '-' + d.slice(4);
    if (d.length > 6) f = f.slice(0, 7) + '-' + d.slice(6);
    setter(f);
  };

  const toggleTag = (tag: string) =>
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const addCustomTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const pickFile = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: false,
        quality: 0.8,
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
    if (!title.trim()) { Alert.alert('Requerido', 'El título es obligatorio.'); return; }
    const now = new Date().toISOString();
    const newDoc: SiteDocument = {
      id: `doc-${Date.now()}`,
      title: title.trim(),
      category,
      status: 'Vigente',
      fileType,
      fileSize: fileSize.trim() || '—',
      version: 'v1.0',
      author: author.trim() || 'Sin especificar',
      company: company.trim() || 'Sin especificar',
      createdAt: now,
      updatedAt: now,
      expiresAt: expiresAt.length === 10 ? expiresAt : undefined,
      description: description.trim(),
      tags,
      isFavorite: false,
    };
    onSave(newDoc);
  };

  const cc = NEW_CAT_COLORS[category];
  const ftc = NEW_FILETYPE_COLORS[fileType];

  return (
    <View style={nd.fullscreen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* Header */}
        <View style={nd.header}>
          <TouchableOpacity onPress={onClose} style={nd.cancelBtn}>
            <X size={18} color={colors.gray[500]} />
            <Text style={nd.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={nd.headerTitle}>Nuevo Documento</Text>
          <TouchableOpacity onPress={handleSave} style={nd.saveBtn}>
            <Text style={nd.saveBtnText}>Agregar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={nd.body}
        >
          {/* ── Título y categoría ── */}
          <View style={nd.section}>
            <Text style={nd.sectionTitle}>Identificación</Text>

            <Text style={nd.label}>Título del documento *</Text>
            <TextInput
              style={nd.input}
              placeholder="Ej: Contrato General de Obra"
              placeholderTextColor={colors.gray[400]}
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />

            <Text style={nd.label}>Categoría</Text>
            <View style={nd.catRow}>
              {CAT_OPTIONS.map(cat => {
                const c = NEW_CAT_COLORS[cat];
                const active = cat === category;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[nd.catChip, active && { backgroundColor: c.bg, borderColor: c.border }]}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.8}
                  >
                    {CAT_ICONS[cat]}
                    <Text style={[nd.catChipText, active && { color: c.text, fontWeight: fontWeight.bold }]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Tipo de archivo ── */}
          <View style={nd.section}>
            <Text style={nd.sectionTitle}>Tipo de archivo</Text>
            <View style={nd.ftRow}>
              {FILETYPE_OPTIONS.map(ft => {
                const c = NEW_FILETYPE_COLORS[ft];
                const active = ft === fileType;
                return (
                  <TouchableOpacity
                    key={ft}
                    style={[nd.ftChip, active && { backgroundColor: c.bg, borderColor: c.text }]}
                    onPress={() => setFileType(ft)}
                    activeOpacity={0.8}
                  >
                    <FileText size={16} color={active ? c.text : colors.gray[400]} />
                    <Text style={[nd.ftChipText, active && { color: c.text, fontWeight: fontWeight.bold }]}>
                      {ft}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={nd.label}>Tamaño del archivo</Text>
            <TextInput
              style={nd.input}
              placeholder="Ej: 2.4 MB"
              placeholderTextColor={colors.gray[400]}
              value={fileSize}
              onChangeText={setFileSize}
              maxLength={10}
            />
          </View>

          {/* ── Empresa y autor ── */}
          <View style={nd.section}>
            <Text style={nd.sectionTitle}>Responsables</Text>

            <Text style={nd.label}>Empresa</Text>
            <TextInput
              style={nd.input}
              placeholder="Ej: Constructora ABC"
              placeholderTextColor={colors.gray[400]}
              value={company}
              onChangeText={setCompany}
              maxLength={60}
            />

            <Text style={nd.label}>Autor</Text>
            <TextInput
              style={nd.input}
              placeholder="Ej: Roberto Díaz"
              placeholderTextColor={colors.gray[400]}
              value={author}
              onChangeText={setAuthor}
              maxLength={40}
            />
          </View>

          {/* ── Fecha de vencimiento ── */}
          <View style={nd.section}>
            <Text style={nd.sectionTitle}>Vigencia</Text>
            <Text style={nd.label}>Fecha de vencimiento</Text>
            <TextInput
              style={nd.input}
              placeholder="aaaa-mm-dd  (opcional)"
              placeholderTextColor={colors.gray[400]}
              value={expiresAt}
              onChangeText={t => fmtDate(t, setExpiresAt)}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          {/* ── Descripción ── */}
          <View style={nd.section}>
            <Text style={nd.sectionTitle}>Descripción y etiquetas</Text>

            <Text style={nd.label}>Descripción</Text>
            <TextInput
              style={[nd.input, nd.textarea]}
              placeholder="Describe el contenido o propósito del documento..."
              placeholderTextColor={colors.gray[400]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={300}
            />
            <Text style={nd.charCount}>{description.length}/300</Text>

            <Text style={nd.label}>Etiquetas</Text>
            <View style={nd.tagGrid}>
              {TAG_SUGGESTIONS.map(tag => {
                const active = tags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[nd.tagChip, active && nd.tagChipActive]}
                    onPress={() => toggleTag(tag)}
                    activeOpacity={0.75}
                  >
                    <Text style={[nd.tagChipText, active && nd.tagChipTextActive]}>#{tag}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={nd.tagInputRow}>
              <TextInput
                style={nd.tagInput}
                placeholder="Etiqueta personalizada..."
                placeholderTextColor={colors.gray[400]}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addCustomTag}
                returnKeyType="done"
                maxLength={20}
              />
              {tagInput.length > 0 && (
                <TouchableOpacity style={nd.tagAddBtn} onPress={addCustomTag}>
                  <Plus size={16} color={colors.white} />
                </TouchableOpacity>
              )}
            </View>

            {tags.length > 0 && (
              <View style={nd.selectedTags}>
                {tags.map(tag => (
                  <TouchableOpacity key={tag} style={nd.selectedTag} onPress={() => toggleTag(tag)}>
                    <Text style={nd.selectedTagText}>#{tag}</Text>
                    <X size={10} color={colors.primary[600]} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ── Archivo ── */}
          <View style={nd.section}>
            <Text style={nd.sectionTitle}>Archivo</Text>
            {fileUri ? (
              <View style={nd.filePreview}>
                <View style={nd.filePreviewLeft}>
                  <View style={[nd.fileTypeBadge, { backgroundColor: ftc.bg }]}>
                    <Text style={[nd.fileTypeBadgeText, { color: ftc.text }]}>{fileType}</Text>
                  </View>
                  <Text style={nd.fileName} numberOfLines={1}>{fileName}</Text>
                </View>
                <TouchableOpacity onPress={() => { setFileUri(null); setFileName(null); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={16} color={colors.gray[400]} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={nd.uploadBtn} onPress={pickFile} activeOpacity={0.85}>
                <ImagePlus size={26} color={colors.primary[500]} />
                <Text style={nd.uploadTitle}>Subir archivo</Text>
                <Text style={nd.uploadSub}>PDF, DOCX o XLSX desde tu dispositivo</Text>
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
export default function DocumentsScreen() {
  const { colors, isDark } = useTheme();
  const [docs, setDocs] = useState<SiteDocument[]>(INITIAL_DOCS);
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'Todos' | DocCategory>('Todos');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<SiteDocument | null>(null);

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
    <>
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
            { label: 'Vigentes', count: docs.filter(d => d.status === 'Vigente').length, color: colors.success[600] },
            { label: 'En revisión', count: docs.filter(d => d.status === 'En revisión').length, color: colors.warning[600] },
            { label: 'Vencidos', count: docs.filter(d => d.status === 'Vencido').length, color: colors.error[600] },
            { label: 'Borradores', count: docs.filter(d => d.status === 'Borrador').length, color: colors.gray[500] },
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
              search
                ? <EmptySearch title="Sin resultados" subtitle={`No se encontraron documentos para "${search}"`} />
                : <EmptyDocuments
                  title="Sin documentos"
                  subtitle="Sube contratos, reportes, permisos y especificaciones del proyecto en un solo lugar."
                  cta={{ label: '+ Subir documento', onPress: () => setShowNewDoc(true) }}
                />
            }
          />
        </ScreenEntrance>

        {/* Detail Modal */}
        <DocDetailModal
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onToggleFavorite={handleToggleFavorite}
          onDelete={(id) => setDocs(prev => prev.filter(d => d.id !== id))}
        />

        {/* FAB */}
        <FAB
          onPress={() => setShowNewDoc(true)}
          icon={<Plus size={24} color={colors.white} />}
        />

      </SafeAreaView>

      {showNewDoc && (
        <NewDocModal
          onClose={() => setShowNewDoc(false)}
          onSave={(doc) => { setDocs(prev => [doc, ...prev]); setShowNewDoc(false); }}
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
    width: 36, height: 36, borderRadius: borderRadius.full,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: '#0F0F0F' },
  headerSub: { fontSize: fontSize.small, color: '#737373', marginTop: 2 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E8E8E8',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md, height: 40, gap: spacing.sm,
    backgroundColor: '#FAFAFA',
  },
  searchText: { flex: 1, fontSize: fontSize.body, color: '#0F0F0F', paddingVertical: 0 },
  favToggle: {
    flexDirection: 'row', alignItems: 'center',
    width: 44, height: 40, borderRadius: borderRadius.sm,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
    gap: 3,
  },
  favToggleActive: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' },
  favCount: { fontSize: 11, fontWeight: fontWeight.bold, color: '#737373' },
  favCountActive: { color: '#D97706' },

  filterBar: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  filterContent: { paddingHorizontal: spacing.base, paddingVertical: spacing.md, gap: spacing.sm },
  pill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.full, backgroundColor: '#F5F5F5' },
  pillText: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: '#525252' },
  pillTextActive: { color: '#FFFFFF' },

  // Stats strip
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  statItemBorder: { borderRightWidth: 1, borderRightColor: '#F5F5F5' },
  statCount: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  statLabel: { fontSize: 9, color: '#737373', marginTop: 2 },

  listContent: { padding: spacing.base, gap: spacing.md, paddingBottom: 40 },

  // Card
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: '#F5F5F5',
    padding: spacing.md, gap: spacing.md,
    ...shadows.sm,
  },
  cardIcon: { width: 48, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardContent: { flex: 1, gap: 5, minWidth: 0 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cardTitle: { fontSize: fontSize.body, fontWeight: fontWeight.semibold, color: '#0F0F0F', flex: 1, lineHeight: 18 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  fileTypeBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  fileTypeText: { fontSize: 9, fontWeight: fontWeight.bold },
  cardMetaText: { fontSize: 10, color: '#737373' },
  cardMetaDot: { fontSize: 10, color: '#D4D4D4' },
  cardBadgeRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  cardRight: { alignItems: 'center', gap: spacing.sm, flexShrink: 0 },
  favoriteBtn: { padding: 4 },

  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.sm },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#333333' },
  emptySubtitle: { fontSize: fontSize.body, color: '#737373', textAlign: 'center', paddingHorizontal: spacing.xl },
});

// ─── Detail Modal Styles ──────────────────────────────────────
const detailModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E8E8E8', alignSelf: 'center', marginTop: spacing.sm },
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: spacing.base, gap: spacing.md,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  catIcon: { width: 44, height: 44, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerInfo: { flex: 1 },
  headerCat: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: '#737373', marginBottom: 4 },
  headerTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: '#0F0F0F', lineHeight: 20 },
  body: { padding: spacing.base },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  descCard: { backgroundColor: '#FAFAFA', borderRadius: borderRadius.md, padding: spacing.base, marginBottom: spacing.base },
  descLabel: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: '#737373', marginBottom: spacing.xs },
  descText: { fontSize: fontSize.body, color: '#333333', lineHeight: 20 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  infoCard: { width: '47%', backgroundColor: '#FAFAFA', borderRadius: borderRadius.md, padding: spacing.md, gap: spacing.xs },
  infoLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoLabel: { fontSize: fontSize.small, color: '#737373' },
  infoValue: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: '#0F0F0F' },
  tagsSection: { gap: spacing.sm, marginBottom: spacing.lg },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { backgroundColor: '#FFFBEB', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  tagText: { fontSize: fontSize.small, color: '#EAAB00', fontWeight: fontWeight.medium },
  actions: {
    flexDirection: 'row', gap: spacing.sm,
    padding: spacing.base, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: '#F5F5F5',
  },
  btnSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: '#F5F5F5',
    paddingVertical: spacing.md, borderRadius: borderRadius.md,
  },
  btnSecondaryText: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: '#525252' },
  btnShare: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: '#FFFBEB',
    paddingVertical: spacing.md, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  btnShareText: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: '#EAAB00' },
  btnDownload: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: '#EAAB00',
    paddingVertical: spacing.md, borderRadius: borderRadius.md,
  },
  btnDownloadText: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: '#FFFFFF' },
  btnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: spacing.xs,
  },
  btnDeleteText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    color: '#EF4444',
  },
});

// ─── New Document Modal Styles ────────────────────────────────
const nd = StyleSheet.create({
  fullscreen: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FAFAFA', zIndex: 200 },
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
  section: { backgroundColor: '#FFFFFF', padding: spacing.base, marginTop: spacing.sm },
  sectionTitle: { fontSize: fontSize.small, fontWeight: fontWeight.bold, color: '#737373', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  label: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: '#333333', marginTop: spacing.sm, marginBottom: spacing.xs },
  input: { borderWidth: 1, borderColor: '#E8E8E8', borderRadius: borderRadius.md, paddingHorizontal: spacing.base, paddingVertical: spacing.md, fontSize: fontSize.base, color: '#0F0F0F', backgroundColor: '#FAFAFA' },
  textarea: { minHeight: 80, textAlignVertical: 'top', paddingTop: spacing.md },
  charCount: { fontSize: 10, color: '#A3A3A3', textAlign: 'right', marginTop: 4 },

  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1.5, borderColor: '#E8E8E8', backgroundColor: '#FAFAFA' },
  catChipText: { fontSize: fontSize.small, color: '#737373' },

  ftRow: { flexDirection: 'row', gap: spacing.md },
  ftChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.md, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: '#E8E8E8', backgroundColor: '#FAFAFA' },
  ftChipText: { fontSize: fontSize.body, color: '#737373' },

  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  tagChip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs + 1, borderRadius: borderRadius.full, borderWidth: 1, borderColor: '#E8E8E8', backgroundColor: '#FAFAFA' },
  tagChipActive: { backgroundColor: '#FFFBEB', borderColor: '#FCD34D' },
  tagChipText: { fontSize: fontSize.small, color: '#737373' },
  tagChipTextActive: { color: '#CA8A04', fontWeight: fontWeight.semibold },
  tagInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tagInput: { flex: 1, borderWidth: 1, borderColor: '#E8E8E8', borderRadius: borderRadius.md, paddingHorizontal: spacing.base, paddingVertical: spacing.md, fontSize: fontSize.base, color: '#0F0F0F', backgroundColor: '#FAFAFA' },
  tagAddBtn: { width: 40, height: 40, borderRadius: borderRadius.md, backgroundColor: '#EAAB00', alignItems: 'center', justifyContent: 'center' },
  selectedTags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  selectedTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFBEB', borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs + 1, borderWidth: 1, borderColor: '#FDE68A' },
  selectedTagText: { fontSize: fontSize.small, color: '#CA8A04', fontWeight: fontWeight.medium },

  uploadBtn: { borderWidth: 1.5, borderColor: '#FDE68A', borderStyle: 'dashed', borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl, gap: spacing.sm, backgroundColor: '#FFFBEB' },
  uploadTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: '#CA8A04' },
  uploadSub: { fontSize: fontSize.small, color: '#FBBF24' },
  filePreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#FDE68A', borderRadius: borderRadius.md, padding: spacing.base, backgroundColor: '#FFFBEB' },
  filePreviewLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  fileTypeBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm },
  fileTypeBadgeText: { fontSize: 11, fontWeight: fontWeight.bold },
  fileName: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: '#CA8A04', flex: 1 },
});