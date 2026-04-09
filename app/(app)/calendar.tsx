/**
 * SitePro — Calendar Screen
 * Vista semanal (default), mensual y agenda
 * Eventos: Tareas, Reuniones, Hitos, Permisos
 */

import { colors } from '@/theme';
import { EmptyCalendar } from '@components/ui/EmptyStates';
import { useTheme } from '@hooks/useTheme';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@store/authStore';
import { useProjectsStore } from '@store/projectsStore';
import { borderRadius, fontSize, fontWeight, iconSize, shadows, spacing } from '@theme/tokens';
import { router } from 'expo-router';
import {
  AlignLeft,
  ArrowLeft,
  Calendar as CalIcon,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Key,
  MapPin,
  Plus,
  User,
  Users,
  X
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SW } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────
type EventType = 'Tarea' | 'Reunión' | 'Hito' | 'Permiso';
type CalView = 'Semana' | 'Mes' | 'Agenda';

interface CalEvent {
  id: string;
  title: string;
  type: EventType;
  date: string;       // YYYY-MM-DD
  startTime?: string; // HH:MM
  endTime?: string;
  location?: string;
  assignedTo?: string;
  color: string;
  description: string;
  isAllDay?: boolean;
}

// ─── Event config ─────────────────────────────────────────────
const TYPE_CONFIG: Record<EventType, { icon: React.FC<any>; color: string; bg: string; light: string }> = {
  Tarea: { icon: CheckSquare, color: colors.primary[600], bg: colors.primary[600], light: colors.primary[50] },
  Reunión: { icon: Users, color: colors.purple[600], bg: colors.purple[500], light: colors.purple[50] },
  Hito: { icon: Flag, color: colors.success[600], bg: colors.success[500], light: colors.success[50] },
  Permiso: { icon: Key, color: colors.orange[600], bg: colors.orange[500], light: colors.orange[50] },
};

// ─── Mock Events ──────────────────────────────────────────────
// Centradas en la semana del 16-22 Feb 2026 (fecha actual del proyecto)
const EVENTS: CalEvent[] = [
  // Tareas
  { id: 't1', type: 'Tarea', color: colors.primary[600], date: '2026-02-18', title: 'Revisar instalación eléctrica piso 5', startTime: '09:00', endTime: '11:00', location: 'Piso 5', assignedTo: 'Juan Pérez', description: 'Verificar conexiones NOM-001-SEDE.' },
  { id: 't2', type: 'Tarea', color: colors.primary[600], date: '2026-02-20', title: 'Inspección de plomería zona norte', startTime: '10:00', endTime: '12:00', location: 'Piso 3', assignedTo: 'María García', description: 'Revisar tuberías agua fría y caliente.' },
  { id: 't3', type: 'Tarea', color: colors.primary[600], date: '2026-02-25', title: 'Aplicar primera capa de pintura', startTime: '08:00', endTime: '17:00', location: 'Piso 2', assignedTo: 'Ana López', description: 'Preparar superficies y aplicar primera capa.' },
  { id: 't4', type: 'Tarea', color: colors.primary[600], date: '2026-02-19', title: 'Colado de losa nivel 8', startTime: '07:00', endTime: '15:00', location: 'Nivel 8', assignedTo: 'Carlos Ruiz', description: 'Vaciado de concreto fc=250 kg/cm².' },
  { id: 't5', type: 'Tarea', color: colors.primary[600], date: '2026-02-23', title: 'Instalación de cancelería fachada sur', startTime: '09:00', endTime: '18:00', location: 'Fachada Sur', assignedTo: 'Roberto Díaz', description: 'Colocación de ventanería de aluminio.' },
  { id: 't6', type: 'Tarea', color: colors.primary[600], date: '2026-03-02', title: 'Prueba de presión hidráulica', startTime: '10:00', endTime: '13:00', location: 'Sótano', assignedTo: 'María García', description: 'Prueba hidrostática a 1.5 veces la presión de trabajo.' },
  // Reuniones
  { id: 'r1', type: 'Reunión', color: colors.purple[500], date: '2026-02-19', title: 'Junta semanal de avance', startTime: '08:00', endTime: '09:30', location: 'Sala de Obra', assignedTo: 'Todo el equipo', description: 'Revisión de avances, compromisos y próximos pasos.' },
  { id: 'r2', type: 'Reunión', color: colors.purple[500], date: '2026-02-20', title: 'Revisión con cliente', startTime: '14:00', endTime: '16:00', location: 'Oficinas Cliente', assignedTo: 'Roberto Díaz', description: 'Presentación de avance mensual al propietario.' },
  { id: 'r3', type: 'Reunión', color: colors.purple[500], date: '2026-02-24', title: 'Coordinación BIM', startTime: '10:00', endTime: '11:30', location: 'Virtual', assignedTo: 'Laura Morales', description: 'Revisión de modelo BIM y detección de interferencias.' },
  { id: 'r4', type: 'Reunión', color: colors.purple[500], date: '2026-02-26', title: 'Junta semanal de avance', startTime: '08:00', endTime: '09:30', location: 'Sala de Obra', assignedTo: 'Todo el equipo', description: 'Revisión de avances semana 8.' },
  { id: 'r5', type: 'Reunión', color: colors.purple[500], date: '2026-03-05', title: 'Junta semanal de avance', startTime: '08:00', endTime: '09:30', location: 'Sala de Obra', assignedTo: 'Todo el equipo', description: 'Revisión de avances semana 9.' },
  // Hitos
  { id: 'h1', type: 'Hito', color: colors.success[500], date: '2026-02-28', title: '🏗 Estructura completa al 100%', isAllDay: true, location: 'Proyecto completo', assignedTo: 'Carlos Ruiz', description: 'Hito de término de estructura de concreto de todos los niveles.' },
  { id: 'h2', type: 'Hito', color: colors.success[500], date: '2026-03-15', title: '🔌 Fin de instalaciones MEP', isAllDay: true, location: 'Proyecto completo', assignedTo: 'Juan Pérez', description: 'Término de instalaciones mecánicas, eléctricas e hidráulicas.' },
  { id: 'h3', type: 'Hito', color: colors.success[500], date: '2026-04-01', title: '🎨 Inicio de acabados generales', isAllDay: true, location: 'Proyecto completo', assignedTo: 'Ana López', description: 'Arranque oficial de la etapa de acabados en todos los niveles.' },
  { id: 'h4', type: 'Hito', color: colors.success[500], date: '2026-06-30', title: '🏆 Entrega final del proyecto', isAllDay: true, location: 'Proyecto completo', assignedTo: 'Roberto Díaz', description: 'Entrega formal de la obra al cliente con acta de recepción.' },
  // Permisos
  { id: 'p1', type: 'Permiso', color: colors.orange[500], date: '2026-02-21', title: '⚠️ Vence: Permiso Vía Pública', isAllDay: true, location: 'Delegación', assignedTo: 'Roberto Díaz', description: 'El permiso de ocupación de vía pública vence hoy. Renovar urgente.' },
  { id: 'p2', type: 'Permiso', color: colors.orange[500], date: '2026-03-10', title: 'Renovación permiso vía pública', startTime: '10:00', endTime: '12:00', location: 'Alcaldía Benito Juárez', assignedTo: 'Roberto Díaz', description: 'Trámite de renovación del permiso de banqueta y arroyo vehicular.' },
  { id: 'p3', type: 'Permiso', color: colors.orange[500], date: '2026-05-15', title: '⚠️ Vence: Imp. Ambiental', isAllDay: true, location: 'SEMARNAT', assignedTo: 'Carlos Ruiz', description: 'Vence la Manifestación de Impacto Ambiental. Gestionar renovación.' },
];

// ─── Date utils ───────────────────────────────────────────────
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAYS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function toYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay()); // domingo
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isToday(d: Date) { return sameDay(d, new Date()); }

// ─── Event Detail Modal ───────────────────────────────────────
function EventDetailModal({ event, onClose }: { event: CalEvent | null; onClose: () => void }) {
  if (!event) return null;
  const cfg = TYPE_CONFIG[event.type];
  const Icon = cfg.icon;
  const d = parseYMD(event.date);

  return (
    <Modal visible transparent animationType="slide">
      <View style={eModal.overlay}>
        <View style={eModal.sheet}>
          <View style={eModal.handle} />

          {/* Header */}
          <View style={[eModal.header, { borderLeftColor: cfg.color, borderLeftWidth: 4 }]}>
            <View style={[eModal.typeIcon, { backgroundColor: cfg.light }]}>
              <Icon size={20} color={cfg.color} strokeWidth={2} />
            </View>
            <View style={eModal.headerInfo}>
              <Text style={[eModal.typeLabel, { color: cfg.color }]}>{event.type}</Text>
              <Text style={eModal.title}>{event.title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={eModal.closeBtn}>
              <X size={18} color={colors.gray[500]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={eModal.body} showsVerticalScrollIndicator={false}>
            {/* Date & time */}
            <View style={eModal.infoCard}>
              <View style={eModal.infoRow}>
                <CalIcon size={14} color={colors.gray[400]} />
                <Text style={eModal.infoText}>
                  {DAYS_FULL[d.getDay()]}, {d.getDate()} de {MONTHS_ES[d.getMonth()]} {d.getFullYear()}
                </Text>
              </View>
              {!event.isAllDay && event.startTime && (
                <View style={eModal.infoRow}>
                  <Clock size={14} color={colors.gray[400]} />
                  <Text style={eModal.infoText}>
                    {event.startTime}{event.endTime ? ` — ${event.endTime}` : ''}
                  </Text>
                </View>
              )}
              {event.isAllDay && (
                <View style={eModal.infoRow}>
                  <Clock size={14} color={colors.gray[400]} />
                  <Text style={eModal.infoText}>Todo el día</Text>
                </View>
              )}
              {event.location && (
                <View style={eModal.infoRow}>
                  <MapPin size={14} color={colors.gray[400]} />
                  <Text style={eModal.infoText}>{event.location}</Text>
                </View>
              )}
              {event.assignedTo && (
                <View style={eModal.infoRow}>
                  <User size={14} color={colors.gray[400]} />
                  <Text style={eModal.infoText}>{event.assignedTo}</Text>
                </View>
              )}
            </View>

            {/* Description */}
            <View style={eModal.descCard}>
              <Text style={eModal.descLabel}>Descripción</Text>
              <Text style={eModal.descText}>{event.description}</Text>
            </View>
          </ScrollView>

          <TouchableOpacity style={eModal.closeFullBtn} onPress={onClose}>
            <Text style={eModal.closeFullText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Event Chip ───────────────────────────────────────────────
function EventChip({ event, onPress, compact = false }: { event: CalEvent; onPress: () => void; compact?: boolean }) {
  const cfg = TYPE_CONFIG[event.type];
  return (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: cfg.light, borderLeftColor: cfg.color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, { color: cfg.color }]} numberOfLines={1}>
        {!compact && event.startTime ? `${event.startTime} ` : ''}{event.title}
      </Text>
    </TouchableOpacity>
  );
}

// ─── WEEK VIEW ────────────────────────────────────────────────
function WeekView({
  weekStart,
  events,
  selectedDate,
  onSelectDate,
  onEventPress,
}: {
  weekStart: Date;
  events: CalEvent[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onEventPress: (e: CalEvent) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
      {/* Day headers */}
      <View style={styles.weekHeader}>
        {days.map(day => {
          const isSelected = sameDay(day, selectedDate);
          const isTod = isToday(day);
          return (
            <TouchableOpacity
              key={toYMD(day)}
              style={styles.weekDayCol}
              onPress={() => onSelectDate(day)}
              activeOpacity={0.7}
            >
              <Text style={[styles.weekDayName, isTod && { color: colors.primary[600] }]}>
                {DAYS_ES[day.getDay()]}
              </Text>
              <View style={[
                styles.weekDayNum,
                isTod && styles.weekDayNumToday,
                isSelected && !isTod && styles.weekDayNumSelected,
              ]}>
                <Text style={[
                  styles.weekDayNumText,
                  isTod && styles.weekDayNumTextToday,
                  isSelected && !isTod && { color: colors.primary[600], fontWeight: fontWeight.bold },
                ]}>
                  {day.getDate()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* All-day events */}
      {(() => {
        const allDay = days.flatMap(day =>
          events.filter(e => e.date === toYMD(day) && e.isAllDay)
            .map(e => ({ ...e, _day: day }))
        );
        if (!allDay.length) return null;
        return (
          <View style={styles.allDayRow}>
            <Text style={styles.allDayLabel}>Todo el día</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {allDay.map(e => (
                <EventChip key={e.id} event={e} onPress={() => onEventPress(e)} compact />
              ))}
            </ScrollView>
          </View>
        );
      })()}

      {/* Events per day */}
      <View style={styles.weekGrid}>
        {days.map(day => {
          const dayEvents = events.filter(e => e.date === toYMD(day) && !e.isAllDay);
          return (
            <View key={toYMD(day)} style={styles.weekDayEventsCol}>
              {dayEvents.length === 0 ? (
                <View style={styles.weekEmpty} />
              ) : (
                dayEvents.map(e => (
                  <EventChip key={e.id} event={e} onPress={() => onEventPress(e)} compact />
                ))
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─── MONTH VIEW ───────────────────────────────────────────────
function MonthView({
  monthStart,
  events,
  selectedDate,
  onSelectDate,
  onEventPress,
}: {
  monthStart: Date;
  events: CalEvent[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onEventPress: (e: CalEvent) => void;
}) {
  const today = new Date();
  // Build calendar grid
  const firstDay = new Date(monthStart);
  const gridStart = addDays(firstDay, -firstDay.getDay());
  const weeks: Date[][] = [];
  let cur = new Date(gridStart);
  while (cur.getMonth() <= monthStart.getMonth() || weeks.length < 4) {
    if (weeks.length >= 6) break;
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) { week.push(new Date(cur)); cur = addDays(cur, 1); }
    weeks.push(week);
    if (cur.getMonth() > monthStart.getMonth() && cur.getDate() > 7) break;
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Day names */}
      <View style={styles.monthDayNames}>
        {DAYS_ES.map(d => (
          <Text key={d} style={styles.monthDayName}>{d}</Text>
        ))}
      </View>

      {/* Grid */}
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.monthWeekRow}>
          {week.map(day => {
            const inMonth = day.getMonth() === monthStart.getMonth();
            const isTod = isToday(day);
            const isSelected = sameDay(day, selectedDate);
            const dayEvents = events.filter(e => e.date === toYMD(day));
            const dots = dayEvents.slice(0, 3);

            return (
              <TouchableOpacity
                key={toYMD(day)}
                style={styles.monthCell}
                onPress={() => onSelectDate(day)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.monthCellNum,
                  isTod && styles.monthCellToday,
                  isSelected && !isTod && styles.monthCellSelected,
                ]}>
                  <Text style={[
                    styles.monthCellText,
                    !inMonth && styles.monthCellTextOut,
                    isTod && styles.monthCellTextToday,
                    isSelected && !isTod && { color: colors.primary[600] },
                  ]}>
                    {day.getDate()}
                  </Text>
                </View>
                <View style={styles.monthDots}>
                  {dots.map(e => (
                    <View key={e.id} style={[styles.monthDot, { backgroundColor: TYPE_CONFIG[e.type].color }]} />
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* Selected day events */}
      {(() => {
        const dayEvs = events.filter(e => e.date === toYMD(selectedDate));
        if (!dayEvs.length) return (
          <View style={styles.monthSelectedEmpty}>
            <Text style={styles.monthSelectedEmptyText}>Sin eventos el {selectedDate.getDate()} de {MONTHS_ES[selectedDate.getMonth()]}</Text>
          </View>
        );
        return (
          <View style={styles.monthSelectedEvents}>
            <Text style={styles.monthSelectedTitle}>
              {DAYS_FULL[selectedDate.getDay()]} {selectedDate.getDate()} de {MONTHS_ES[selectedDate.getMonth()]}
            </Text>
            {dayEvs.map(e => (
              <EventChip key={e.id} event={e} onPress={() => onEventPress(e)} />
            ))}
          </View>
        );
      })()}
    </ScrollView>
  );
}

// ─── AGENDA VIEW ──────────────────────────────────────────────
function AgendaView({ events, onEventPress }: { events: CalEvent[]; onEventPress: (e: CalEvent) => void }) {
  // Group events by date, sorted
  const grouped = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    events.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .filter(([date]) => date >= toYMD(new Date()));
  }, [events]);

  if (!grouped.length) return (
    <EmptyCalendar
      title="Sin próximos eventos"
      subtitle="No hay eventos agendados. Crea reuniones, inspecciones y entregas para organizar el proyecto."
      cta={{ label: '+ Crear evento', onPress: () => { } }}
    />
  );

  return (
    <FlatList
      data={grouped}
      keyExtractor={([date]) => date}
      contentContainerStyle={styles.agendaContent}
      showsVerticalScrollIndicator={false}
      renderItem={({ item: [date, evs] }) => {
        const d = parseYMD(date);
        const isTod = isToday(d);
        return (
          <View style={styles.agendaGroup}>
            <View style={styles.agendaDateRow}>
              <View style={[styles.agendaDateBubble, isTod && styles.agendaDateBubbleToday]}>
                <Text style={[styles.agendaDateDay, isTod && { color: colors.white }]}>{d.getDate()}</Text>
              </View>
              <View>
                <Text style={[styles.agendaDateLabel, isTod && { color: colors.primary[600], fontWeight: fontWeight.bold }]}>
                  {isTod ? 'Hoy' : DAYS_FULL[d.getDay()]}
                </Text>
                <Text style={styles.agendaDateSub}>{MONTHS_ES[d.getMonth()]} {d.getFullYear()}</Text>
              </View>
            </View>
            <View style={styles.agendaEvents}>
              {evs.map(e => {
                const cfg = TYPE_CONFIG[e.type];
                const Icon = cfg.icon;
                return (
                  <TouchableOpacity
                    key={e.id}
                    style={[styles.agendaEvent, { borderLeftColor: cfg.color }]}
                    onPress={() => onEventPress(e)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.agendaEventIcon, { backgroundColor: cfg.light }]}>
                      <Icon size={14} color={cfg.color} strokeWidth={2} />
                    </View>
                    <View style={styles.agendaEventInfo}>
                      <Text style={styles.agendaEventTitle} numberOfLines={1}>{e.title}</Text>
                      <Text style={styles.agendaEventMeta}>
                        {e.isAllDay ? 'Todo el día' : `${e.startTime}${e.endTime ? ` — ${e.endTime}` : ''}`}
                        {e.location ? `  ·  ${e.location}` : ''}
                      </Text>
                    </View>
                    <View style={[styles.agendaTypeBadge, { backgroundColor: cfg.light }]}>
                      <Text style={[styles.agendaTypeText, { color: cfg.color }]}>{e.type}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      }}
    />
  );
}


// ─── New Event Modal ──────────────────────────────────────────
const EVENT_TYPES: EventType[] = ['Tarea', 'Reunión', 'Hito', 'Permiso'];

function NewEventModal({
  visible,
  selectedDate,
  onClose,
  onSave,
}: {
  visible: boolean;
  selectedDate: Date;
  onClose: () => void;
  onSave: (e: CalEvent) => void;
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('Reunión');
  const [isAllDay, setIsAllDay] = useState(false);
  const [date, setDate] = useState(toYMD(selectedDate));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [description, setDescription] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);

  // Reset when opens
  React.useEffect(() => {
    if (visible) {
      setTitle(''); setType('Reunión'); setIsAllDay(false);
      setDate(toYMD(selectedDate)); setStartTime('09:00'); setEndTime('10:00');
      setLocation(''); setAssignedTo(''); setDescription('');
    }
  }, [visible, selectedDate]);

  const formatTimeInput = (text: string, setter: (v: string) => void) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) setter(digits);
    else setter(digits.slice(0, 2) + ':' + digits.slice(2));
  };

  const formatDateInput = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    let f = digits;
    if (digits.length > 4) f = digits.slice(0, 4) + '-' + digits.slice(4);
    if (digits.length > 6) f = f.slice(0, 7) + '-' + digits.slice(6);
    setDate(f);
  };

  const handleSave = () => {
    if (!title.trim()) { Alert.alert('Error', 'El título es requerido'); return; }
    if (!date || date.length < 10) { Alert.alert('Error', 'Ingresa una fecha válida (aaaa-mm-dd)'); return; }

    const cfg = TYPE_CONFIG[type];
    const newEvent: CalEvent = {
      id: `custom-${Date.now()}`,
      title: title.trim(),
      type,
      date,
      color: cfg.color,
      description: description.trim() || 'Sin descripción.',
      isAllDay,
      startTime: !isAllDay ? startTime : undefined,
      endTime: !isAllDay && endTime ? endTime : undefined,
      location: location.trim() || undefined,
      assignedTo: assignedTo.trim() || undefined,
    };

    onSave(newEvent);
    onClose();
  };

  const cfg = TYPE_CONFIG[type];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={nModal.overlay}>
          <View style={nModal.sheet}>
            {/* Header */}
            <View style={nModal.header}>
              <TouchableOpacity onPress={onClose}>
                <Text style={nModal.cancel}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={nModal.title}>Nuevo Evento</Text>
              <TouchableOpacity onPress={handleSave} style={nModal.saveBtn}>
                <Text style={nModal.saveText}>Guardar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={nModal.body}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Tipo de evento */}
              <Text style={nModal.label}>Tipo de evento</Text>
              <TouchableOpacity
                style={[nModal.typeSelector, { borderColor: cfg.color }]}
                onPress={() => setShowTypePicker(true)}
                activeOpacity={0.8}
              >
                <View style={[nModal.typeDot, { backgroundColor: cfg.color }]} />
                <Text style={[nModal.typeSelectorText, { color: cfg.color }]}>{type}</Text>
                <ChevronDown size={16} color={cfg.color} />
              </TouchableOpacity>

              {/* Título */}
              <Text style={nModal.label}>Título *</Text>
              <TextInput
                style={nModal.input}
                placeholder={
                  type === 'Reunión' ? 'Ej: Junta de avance semanal' :
                    type === 'Tarea' ? 'Ej: Revisión estructural piso 5' :
                      type === 'Hito' ? 'Ej: Estructura completa al 100%' :
                        'Ej: Vence permiso vía pública'
                }
                placeholderTextColor={colors.gray[400]}
                value={title}
                onChangeText={setTitle}
                maxLength={80}
              />
              <Text style={nModal.charCount}>{title.length}/80</Text>

              {/* Fecha */}
              <Text style={nModal.label}>Fecha * (aaaa-mm-dd)</Text>
              <TextInput
                style={nModal.input}
                placeholder="2026-02-19"
                placeholderTextColor={colors.gray[400]}
                value={date}
                onChangeText={formatDateInput}
                keyboardType="numeric"
                maxLength={10}
              />

              {/* Todo el día */}
              <View style={nModal.toggleRow}>
                <AlignLeft size={16} color={colors.gray[500]} />
                <Text style={nModal.toggleLabel}>Todo el día</Text>
                <Switch
                  value={isAllDay}
                  onValueChange={setIsAllDay}
                  trackColor={{ false: colors.gray[200], true: colors.primary[200] }}
                  thumbColor={isAllDay ? colors.primary[600] : colors.gray[400]}
                />
              </View>

              {/* Horario (solo si no es todo el día) */}
              {!isAllDay && (
                <View style={nModal.timeRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={nModal.label}>Inicio</Text>
                    <TextInput
                      style={nModal.input}
                      placeholder="09:00"
                      placeholderTextColor={colors.gray[400]}
                      value={startTime}
                      onChangeText={t => formatTimeInput(t, setStartTime)}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={nModal.label}>Fin</Text>
                    <TextInput
                      style={nModal.input}
                      placeholder="10:00"
                      placeholderTextColor={colors.gray[400]}
                      value={endTime}
                      onChangeText={t => formatTimeInput(t, setEndTime)}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                </View>
              )}

              {/* Ubicación */}
              <Text style={nModal.label}>Ubicación</Text>
              <TextInput
                style={nModal.input}
                placeholder="Ej: Sala de juntas, Piso 3, Virtual..."
                placeholderTextColor={colors.gray[400]}
                value={location}
                onChangeText={setLocation}
              />

              {/* Responsable */}
              <Text style={nModal.label}>Responsable / Asistentes</Text>
              <TextInput
                style={nModal.input}
                placeholder="Ej: Juan Pérez, Todo el equipo..."
                placeholderTextColor={colors.gray[400]}
                value={assignedTo}
                onChangeText={setAssignedTo}
              />

              {/* Descripción */}
              <Text style={nModal.label}>Descripción</Text>
              <TextInput
                style={[nModal.input, nModal.textArea]}
                placeholder="Agrega notas o detalles del evento..."
                placeholderTextColor={colors.gray[400]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={300}
              />
              <Text style={nModal.charCount}>{description.length}/300</Text>

              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Type Picker Sheet */}
      <Modal visible={showTypePicker} transparent animationType="slide">
        <View style={picker.overlay}>
          <View style={picker.sheet}>
            <View style={picker.header}>
              <Text style={picker.title}>Tipo de evento</Text>
              <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                <X size={iconSize.md} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>
            {EVENT_TYPES.map(t => {
              const c = TYPE_CONFIG[t];
              const Icon = c.icon;
              const selected = type === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[picker.option, selected && { backgroundColor: c.light }]}
                  onPress={() => { setType(t); setShowTypePicker(false); }}
                  activeOpacity={0.8}
                >
                  <View style={[picker.optionIcon, { backgroundColor: c.light }]}>
                    <Icon size={18} color={c.color} strokeWidth={2} />
                  </View>
                  <Text style={[picker.optionText, selected && { color: c.color, fontWeight: fontWeight.bold }]}>{t}</Text>
                  {selected && (
                    <View style={[picker.check, { backgroundColor: c.color }]}>
                      <Text style={picker.checkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 32 }} />
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function CalendarScreen() {
  const { colors, isDark } = useTheme();
  const today = new Date(); // Fecha real actual
  const [view, setView] = useState<CalView>('Semana');
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [currentRef, setCurrentRef] = useState<Date>(today); // week/month navigation anchor
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const { currentProjectId, loadProjects } = useProjectsStore();
  const { user } = useAuthStore();

  // Cargar tareas reales como eventos del calendario
  const loadEvents = useCallback(async () => {
    const projectId = useProjectsStore.getState().currentProjectId;
    if (!projectId) return;
    setDbLoading(true);
    try {
      // Traer tareas con due_date
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, status, priority, due_date, assigned_to, location, description, profiles!tasks_assigned_to_fkey(full_name)')
        .eq('project_id', projectId)
        .not('due_date', 'is', null);

      const taskEvents: CalEvent[] = (tasks ?? []).map((t: any) => ({
        id: t.id,
        title: t.title,
        type: 'Tarea' as EventType,
        date: t.due_date,
        color: colors.primary[600],
        description: t.description ?? '',
        location: t.location ?? undefined,
        assignedTo: t.profiles?.full_name ?? undefined,
        isAllDay: true,
      }));

      // Traer eventos personalizados guardados en activity_log con resource_type='event'
      const { data: customEvents } = await supabase
        .from('activity_log')
        .select('id, description, metadata, created_at')
        .eq('project_id', projectId)
        .eq('resource_type', 'event');

      const customCalEvents: CalEvent[] = (customEvents ?? [])
        .filter((e: any) => e.metadata?.date)
        .map((e: any) => ({
          id: e.id,
          title: e.description ?? 'Evento',
          type: (e.metadata?.type ?? 'Reunión') as EventType,
          date: e.metadata.date,
          color: TYPE_CONFIG[(e.metadata?.type ?? 'Reunión') as EventType]?.color ?? colors.purple[500],
          description: e.metadata?.description ?? '',
          isAllDay: e.metadata?.isAllDay ?? false,
          startTime: e.metadata?.startTime,
          endTime: e.metadata?.endTime,
          location: e.metadata?.location,
          assignedTo: e.metadata?.assignedTo,
        }));

      setEvents([...taskEvents, ...customCalEvents]);
    } finally {
      setDbLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects().then(loadEvents);
  }, []);

  useEffect(() => {
    if (currentProjectId) loadEvents();
  }, [currentProjectId]);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [activeTypes, setActiveTypes] = useState<Set<EventType>>(new Set(['Tarea', 'Reunión', 'Hito', 'Permiso']));

  const toggleType = (t: EventType) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  };

  const filteredEvents = useMemo(() =>
    events.filter(e => activeTypes.has(e.type)),
    [events, activeTypes]
  );

  const handleAddEvent = async (newEvent: CalEvent) => {
    // Guardar en activity_log como evento personalizado
    const projectId = useProjectsStore.getState().currentProjectId;
    if (projectId && user?.id) {
      await supabase.from('activity_log').insert({
        project_id: projectId,
        user_id: user.id,
        action: 'created',
        resource_type: 'event',
        description: newEvent.title,
        metadata: {
          type: newEvent.type,
          date: newEvent.date,
          isAllDay: newEvent.isAllDay,
          startTime: newEvent.startTime,
          endTime: newEvent.endTime,
          location: newEvent.location,
          assignedTo: newEvent.assignedTo,
          description: newEvent.description,
          color: newEvent.color,
        },
      });
    }
    setEvents(prev => [...prev, newEvent]);
  };

  // Navigation
  const weekStart = startOfWeek(currentRef);
  const monthStart = startOfMonth(currentRef);

  const navPrev = () => {
    if (view === 'Semana') setCurrentRef(d => addDays(d, -7));
    else if (view === 'Mes') setCurrentRef(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };
  const navNext = () => {
    if (view === 'Semana') setCurrentRef(d => addDays(d, 7));
    else if (view === 'Mes') setCurrentRef(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };
  const goToday = () => { setCurrentRef(today); setSelectedDate(today); };

  // Header title
  const headerTitle = useMemo(() => {
    if (view === 'Semana') {
      const ws = startOfWeek(currentRef);
      const we = addDays(ws, 6);
      if (ws.getMonth() === we.getMonth())
        return `${ws.getDate()} — ${we.getDate()} ${MONTHS_ES[ws.getMonth()]} ${ws.getFullYear()}`;
      return `${ws.getDate()} ${MONTHS_ES[ws.getMonth()]} — ${we.getDate()} ${MONTHS_ES[we.getMonth()]} ${we.getFullYear()}`;
    }
    if (view === 'Mes') return `${MONTHS_ES[currentRef.getMonth()]} ${currentRef.getFullYear()}`;
    return 'Agenda';
  }, [view, currentRef]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Top header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={iconSize.md} color={colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendario</Text>
        <TouchableOpacity onPress={goToday} style={styles.todayBtn}>
          <Text style={styles.todayText}>Hoy</Text>
        </TouchableOpacity>
      </View>

      {/* View tabs */}
      <View style={styles.viewTabs}>
        {(['Semana', 'Mes', 'Agenda'] as CalView[]).map(v => (
          <TouchableOpacity
            key={v}
            style={[styles.viewTab, view === v && styles.viewTabActive]}
            onPress={() => setView(v)}
            activeOpacity={0.75}
          >
            <Text style={[styles.viewTabText, view === v && styles.viewTabTextActive]}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Type filters */}
      <View style={styles.typeFilters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeFiltersContent}>
          {(Object.entries(TYPE_CONFIG) as [EventType, typeof TYPE_CONFIG[EventType]][]).map(([type, cfg]) => {
            const active = activeTypes.has(type);
            const Icon = cfg.icon;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.typeChip, active && { backgroundColor: cfg.bg }]}
                onPress={() => toggleType(type)}
                activeOpacity={0.8}
              >
                <Icon size={12} color={active ? colors.white : colors.gray[400]} strokeWidth={2} />
                <Text style={[styles.typeChipText, active && { color: colors.white }]}>{type}s</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Navigation bar (only Semana & Mes) */}
      {view !== 'Agenda' && (
        <View style={styles.navBar}>
          <TouchableOpacity onPress={navPrev} style={styles.navBtn}>
            <ChevronLeft size={iconSize.md} color={colors.gray[600]} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{headerTitle}</Text>
          <TouchableOpacity onPress={navNext} style={styles.navBtn}>
            <ChevronRight size={iconSize.md} color={colors.gray[600]} />
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {view === 'Semana' && (
          <WeekView
            weekStart={weekStart}
            events={filteredEvents}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onEventPress={setSelectedEvent}
          />
        )}
        {view === 'Mes' && (
          <MonthView
            monthStart={monthStart}
            events={filteredEvents}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onEventPress={setSelectedEvent}
          />
        )}
        {view === 'Agenda' && (
          <AgendaView events={filteredEvents} onEventPress={setSelectedEvent} />
        )}

        {/* FAB — agregar evento */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowNewEvent(true)}
          activeOpacity={0.88}
        >
          <Plus size={24} color={colors.white} strokeWidth={2.5} />
        </TouchableOpacity>

        {/* New Event Modal */}
        <NewEventModal
          visible={showNewEvent}
          selectedDate={selectedDate}
          onClose={() => setShowNewEvent(false)}
          onSave={handleAddEvent}
        />
      </View>

      {/* Event detail modal */}
      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
    gap: spacing.md, ...shadows.sm,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: borderRadius.full,
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: '#0F0F0F' },
  todayBtn: {
    backgroundColor: '#FFFBEB', borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  todayText: { fontSize: fontSize.small, fontWeight: fontWeight.semibold, color: '#EAAB00' },

  // View tabs
  viewTabs: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    margin: spacing.base,
    borderRadius: borderRadius.md,
    padding: 3,
  },
  viewTab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.sm - 2 },
  viewTabActive: { backgroundColor: '#FFFFFF', ...shadows.sm },
  viewTabText: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: '#737373' },
  viewTabTextActive: { color: '#EAAB00', fontWeight: fontWeight.bold },

  // Type filters
  typeFilters: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5', paddingBottom: spacing.sm },
  typeFiltersContent: { paddingHorizontal: spacing.base, gap: spacing.sm },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 1,
    borderRadius: borderRadius.full, backgroundColor: '#F5F5F5',
  },
  typeChipText: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: '#737373' },

  // Nav bar
  navBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  navBtn: { padding: spacing.sm },
  navTitle: { flex: 1, textAlign: 'center', fontSize: fontSize.body, fontWeight: fontWeight.semibold, color: '#0F0F0F' },

  content: { flex: 1 },

  // Week view
  weekHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  weekDayCol: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  weekDayName: { fontSize: 9, fontWeight: fontWeight.medium, color: '#A3A3A3', marginBottom: 4 },
  weekDayNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  weekDayNumToday: { backgroundColor: '#EAAB00' },
  weekDayNumSelected: { borderWidth: 2, borderColor: '#FCD34D' },
  weekDayNumText: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: '#0F0F0F' },
  weekDayNumTextToday: { color: '#FFFFFF', fontWeight: fontWeight.bold },
  allDayRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    backgroundColor: '#FAFAFA', borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
    gap: spacing.sm,
  },
  allDayLabel: { fontSize: 9, color: '#A3A3A3', width: 44 },
  weekGrid: { flexDirection: 'row', padding: spacing.xs, gap: spacing.xs, paddingBottom: spacing.xl },
  weekDayEventsCol: { flex: 1, gap: spacing.xs },
  weekEmpty: { height: 8 },

  // Event chip
  chip: {
    borderRadius: 4, borderLeftWidth: 3, paddingHorizontal: 5, paddingVertical: 3, marginBottom: 2,
  },
  chipText: { fontSize: 9, fontWeight: fontWeight.semibold, lineHeight: 13 },

  // Month view
  monthDayNames: { flexDirection: 'row', paddingHorizontal: spacing.xs, paddingVertical: spacing.sm },
  monthDayName: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: fontWeight.medium, color: '#A3A3A3' },
  monthWeekRow: { flexDirection: 'row', paddingHorizontal: spacing.xs },
  monthCell: { flex: 1, alignItems: 'center', paddingVertical: spacing.xs },
  monthCellNum: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  monthCellToday: { backgroundColor: '#EAAB00' },
  monthCellSelected: { borderWidth: 2, borderColor: '#FCD34D' },
  monthCellText: { fontSize: fontSize.body, color: '#0F0F0F' },
  monthCellTextOut: { color: '#D4D4D4' },
  monthCellTextToday: { color: '#FFFFFF', fontWeight: fontWeight.bold },
  monthDots: { flexDirection: 'row', gap: 2, marginTop: 2, height: 6 },
  monthDot: { width: 5, height: 5, borderRadius: 3 },
  monthSelectedEvents: { padding: spacing.base, borderTopWidth: 1, borderTopColor: '#F5F5F5', gap: spacing.sm },
  monthSelectedTitle: { fontSize: fontSize.body, fontWeight: fontWeight.semibold, color: '#333333', marginBottom: spacing.xs },
  monthSelectedEmpty: { padding: spacing.lg, alignItems: 'center' },
  monthSelectedEmptyText: { fontSize: fontSize.body, color: '#737373' },

  // Agenda view
  agendaContent: { padding: spacing.base, gap: spacing.lg, paddingBottom: 40 },
  agendaEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingTop: 80 },
  agendaEmptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#737373' },
  agendaGroup: { gap: spacing.sm },
  agendaDateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  agendaDateBubble: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
  },
  agendaDateBubbleToday: { backgroundColor: '#EAAB00' },
  agendaDateDay: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#0F0F0F' },
  agendaDateLabel: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: '#0F0F0F' },
  agendaDateSub: { fontSize: fontSize.small, color: '#737373' },
  agendaEvents: { paddingLeft: 52, gap: spacing.sm },
  agendaEvent: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: borderRadius.md,
    borderLeftWidth: 4, padding: spacing.md, gap: spacing.md,
    ...shadows.sm,
  },
  agendaEventIcon: { width: 30, height: 30, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  agendaEventInfo: { flex: 1 },
  agendaEventTitle: { fontSize: fontSize.body, fontWeight: fontWeight.semibold, color: '#0F0F0F' },
  agendaEventMeta: { fontSize: fontSize.small, color: '#737373', marginTop: 2 },
  agendaTypeBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  agendaTypeText: { fontSize: 9, fontWeight: fontWeight.bold },

  // FAB
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56, height: 56,
    borderRadius: 28,
    backgroundColor: '#EAAB00',
    alignItems: 'center', justifyContent: 'center',
    ...shadows.xl,
  },
});

// ─── Event Modal Styles ───────────────────────────────────────
const eModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl,
    maxHeight: '75%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E8E8E8', alignSelf: 'center', marginTop: spacing.sm },
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: spacing.base, gap: spacing.md,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
    marginTop: spacing.sm,
  },
  typeIcon: { width: 40, height: 40, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerInfo: { flex: 1 },
  typeLabel: { fontSize: fontSize.small, fontWeight: fontWeight.bold, marginBottom: 4 },
  title: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: '#0F0F0F', lineHeight: 20 },
  closeBtn: { padding: spacing.xs, backgroundColor: '#F5F5F5', borderRadius: borderRadius.full },
  body: { padding: spacing.base },
  infoCard: {
    backgroundColor: '#FAFAFA', borderRadius: borderRadius.md,
    padding: spacing.base, gap: spacing.sm, marginBottom: spacing.base,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoText: { fontSize: fontSize.body, color: '#333333' },
  descCard: { backgroundColor: '#FAFAFA', borderRadius: borderRadius.md, padding: spacing.base, marginBottom: spacing.base },
  descLabel: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: '#737373', marginBottom: spacing.xs },
  descText: { fontSize: fontSize.body, color: '#333333', lineHeight: 20 },
  closeFullBtn: {
    margin: spacing.base, backgroundColor: '#F5F5F5',
    borderRadius: borderRadius.md, paddingVertical: spacing.md, alignItems: 'center',
    marginBottom: 32,
  },
  closeFullText: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: '#333333' },
});

// ─── New Event Modal Styles ───────────────────────────────────
const nModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  title: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: '#0F0F0F' },
  cancel: { fontSize: fontSize.base, color: '#737373' },
  saveBtn: { backgroundColor: '#EAAB00', paddingHorizontal: spacing.base, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.sm },
  saveText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: '#FFFFFF' },
  body: { padding: spacing.base },
  label: { fontSize: fontSize.body, fontWeight: fontWeight.medium, color: '#333333', marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    borderWidth: 1, borderColor: '#D4D4D4', borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    fontSize: fontSize.base, color: '#0F0F0F',
    backgroundColor: '#FFFFFF', minHeight: 48,
  },
  textArea: { minHeight: 90, paddingTop: spacing.md },
  charCount: { fontSize: fontSize.small, color: '#A3A3A3', textAlign: 'right', marginTop: 4 },
  typeSelector: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderWidth: 2, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF', minHeight: 48,
  },
  typeDot: { width: 10, height: 10, borderRadius: 5 },
  typeSelectorText: { flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: '#FFFFFF', borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderWidth: 1, borderColor: '#E8E8E8', marginTop: spacing.md,
  },
  toggleLabel: { flex: 1, fontSize: fontSize.base, color: '#0F0F0F', fontWeight: fontWeight.medium },
  timeRow: { flexDirection: 'row', gap: spacing.md },
});

// ─── Type Picker Styles ───────────────────────────────────────
const picker = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.base, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#0F0F0F' },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, paddingHorizontal: spacing.base,
    borderBottomWidth: 1, borderBottomColor: '#FAFAFA',
  },
  optionIcon: { width: 36, height: 36, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1, fontSize: fontSize.base, color: '#0F0F0F', fontWeight: fontWeight.medium },
  check: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: '#FFFFFF', fontSize: 11, fontWeight: fontWeight.bold },
});