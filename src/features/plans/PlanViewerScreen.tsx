/**
 * SitePro — PlanViewer con Medición y Anotaciones
 * Fix: coordenadas correctas + export a PDF real
 */

import { colors } from '@/theme';
import { ConfirmDialogContainer, useConfirm } from '@components/ui/ConfirmDialog';
import { useToast } from '@components/ui/Toast';
import { supabase } from '@lib/supabase';
import NetInfo from '@react-native-community/netinfo';
import type { DbPlan } from '@services/plansService';
import { useAuthStore } from '@store/authStore';
import { useProjectsStore } from '@store/projectsStore';
import { borderRadius, fontSize, fontWeight, iconSize, spacing } from '@theme/tokens';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import {
    ArrowLeft, Download, Hand,
    MapPin,
    Maximize2,
    RotateCcw, Ruler, Trash2, Type,
    ZoomIn, ZoomOut
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator, Alert, Dimensions, Image, Modal,
    Platform, StatusBar, StyleSheet, Text,
    TextInput, TouchableOpacity, View,
} from 'react-native';
import {
    Gesture, GestureDetector, GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
    clamp, useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { WebView } from 'react-native-webview';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── UUID v4 generator (sin dependencias externas) ────────────
function uuidv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

// ─── Normalización de coordenadas ────────────────────────────
// Guarda coords como fracción (0-1) relativa al tamaño de imagen
// para que sean correctas en cualquier dispositivo/pantalla
function normalize(pt: Point, imgW: number, imgH: number): Point {
    return { x: pt.x / imgW, y: pt.y / imgH };
}
function denormalize(pt: Point, imgW: number, imgH: number): Point {
    return { x: pt.x * imgW, y: pt.y * imgH };
}

// ─── Types ────────────────────────────────────────────────────
type Tool = 'pan' | 'measure' | 'pin' | 'text';
interface Point { x: number; y: number; }
interface Annotation {
    id: string;
    type: 'measure' | 'pin' | 'text';
    color: string;
    start?: Point; end?: Point;
    pixelDist?: number; realDist?: string;
    point?: Point; label?: string;
    position?: Point; text?: string;
}

const TOOL_COLORS: Record<Tool, string> = {
    pan: '#EAAB00', measure: '#EF4444', pin: '#3B82F6', text: '#8B5CF6',
};
const ANNOT_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

function dist(a: Point, b: Point) {
    return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

function calcRealDist(pixels: number, scaleStr: string): string {
    const parts = scaleStr.replace(/\s/g, '').split(':');
    if (parts.length !== 2) return `${pixels.toFixed(0)}px`;
    const factor = Number(parts[1]) / Number(parts[0]);
    const realMm = pixels * 0.264583 * factor;
    if (realMm >= 1000) return `${(realMm / 1000).toFixed(2)} m`;
    return `${realMm.toFixed(0)} mm`;
}

// ─── Toolbar ─────────────────────────────────────────────────
function Toolbar({ activeTool, onTool, onUndo, onClear, annotCount }: {
    activeTool: Tool; onTool: (t: Tool) => void;
    onUndo: () => void; onClear: () => void; annotCount: number;
}) {
    const tools: { id: Tool; Icon: any; label: string }[] = [
        { id: 'pan', Icon: Hand, label: 'Mover' },
        { id: 'measure', Icon: Ruler, label: 'Medir' },
        { id: 'pin', Icon: MapPin, label: 'Punto' },
        { id: 'text', Icon: Type, label: 'Texto' },
    ];
    return (
        <View style={tb.container}>
            {tools.map(({ id, Icon, label }) => {
                const active = activeTool === id;
                return (
                    <TouchableOpacity key={id} style={[tb.btn, active && { backgroundColor: TOOL_COLORS[id] }]} onPress={() => onTool(id)}>
                        <Icon size={18} color={active ? '#FFF' : 'rgba(255,255,255,0.45)'} strokeWidth={2} />
                        <Text style={[tb.label, active && { color: '#FFF' }]}>{label}</Text>
                    </TouchableOpacity>
                );
            })}
            <View style={tb.sep} />
            <TouchableOpacity style={tb.btn} onPress={onUndo} disabled={annotCount === 0}>
                <RotateCcw size={18} color={annotCount > 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)'} />
                <Text style={[tb.label, { color: 'rgba(255,255,255,0.4)' }]}>Deshacer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={tb.btn} onPress={onClear} disabled={annotCount === 0}>
                <Trash2 size={18} color={annotCount > 0 ? '#EF4444' : 'rgba(255,255,255,0.2)'} />
                <Text style={[tb.label, { color: annotCount > 0 ? '#EF4444' : 'rgba(255,255,255,0.2)' }]}>Limpiar</Text>
            </TouchableOpacity>
        </View>
    );
}

// ─── Scale Modal ──────────────────────────────────────────────
function ScaleModal({ visible, scale, onSave, onClose }: {
    visible: boolean; scale: string; onSave: (s: string) => void; onClose: () => void;
}) {
    const [val, setVal] = useState(scale);
    const presets = ['1:25', '1:50', '1:75', '1:100', '1:150', '1:200', '1:500'];
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={sm.overlay}>
                <View style={sm.sheet}>
                    <Text style={sm.title}>Escala del plano</Text>
                    <Text style={sm.sub}>Define la escala para mediciones precisas</Text>
                    <TextInput style={sm.input} value={val} onChangeText={setVal} placeholder="Ej: 1:100" placeholderTextColor={colors.gray[400]} />
                    <View style={sm.presets}>
                        {presets.map(p => (
                            <TouchableOpacity key={p} style={[sm.preset, val === p && sm.presetActive]} onPress={() => setVal(p)}>
                                <Text style={[sm.presetText, val === p && { color: colors.primary[700] }]}>{p}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={sm.actions}>
                        <TouchableOpacity style={sm.cancel} onPress={onClose}><Text style={{ color: colors.gray[600], fontWeight: fontWeight.medium }}>Cancelar</Text></TouchableOpacity>
                        <TouchableOpacity style={sm.save} onPress={() => { onSave(val); onClose(); }}><Text style={{ color: '#FFF', fontWeight: fontWeight.bold }}>Guardar</Text></TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// ─── Text Modal ───────────────────────────────────────────────
function TextModal({ visible, onSave, onClose }: {
    visible: boolean; onSave: (text: string, color: string) => void; onClose: () => void;
}) {
    const [val, setVal] = useState('');
    const [color, setColor] = useState(ANNOT_COLORS[1]);
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={sm.overlay}>
                <View style={sm.sheet}>
                    <Text style={sm.title}>Nueva anotación</Text>
                    <TextInput style={sm.input} value={val} onChangeText={setVal} placeholder="Escribe aquí..." placeholderTextColor={colors.gray[400]} autoFocus maxLength={60} />
                    <View style={sm.presets}>
                        {ANNOT_COLORS.map(c => (
                            <TouchableOpacity key={c} style={[sm.colorDot, { backgroundColor: c }, color === c && sm.colorDotActive]} onPress={() => setColor(c)} />
                        ))}
                    </View>
                    <View style={sm.actions}>
                        <TouchableOpacity style={sm.cancel} onPress={() => { setVal(''); onClose(); }}><Text style={{ color: colors.gray[600] }}>Cancelar</Text></TouchableOpacity>
                        <TouchableOpacity style={[sm.save, { opacity: val.trim() ? 1 : 0.5 }]} disabled={!val.trim()}
                            onPress={() => { onSave(val.trim(), color); setVal(''); onClose(); }}>
                            <Text style={{ color: '#FFF', fontWeight: fontWeight.bold }}>Agregar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// ─── Main Viewer ──────────────────────────────────────────────
export default function PlanViewerScreen({ plan, onClose, onDelete }: {
    plan: DbPlan; onClose: () => void; onDelete: () => void;
}) {
    const confirm = useConfirm();
    const toast = useToast();

    // Zoom / pan
    const scaleAnim = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const offsetX = useSharedValue(0);
    const offsetY = useSharedValue(0);
    const savedX = useSharedValue(0);
    const savedY = useSharedValue(0);

    // Tools
    const [activeTool, setActiveTool] = useState<Tool>('pan');
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [drawing, setDrawing] = useState(false);
    const [drawStart, setDrawStart] = useState<Point | null>(null);
    const [drawEnd, setDrawEnd] = useState<Point | null>(null);
    const [planScale, setPlanScale] = useState(plan.scale ?? '1:100');
    const [annotColor, setAnnotColor] = useState(ANNOT_COLORS[0]);
    const [showScale, setShowScale] = useState(false);
    const [showTextModal, setShowTextModal] = useState(false);
    const [pendingPt, setPendingPt] = useState<Point | null>(null);
    const [exporting, setExporting] = useState(false);
    const [loadingAnnots, setLoadingAnnots] = useState(true);
    const [localUri, setLocalUri] = useState<string | null>(null);
    const [cacheLoading, setCacheLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(true);
    const [cacheStatus, setCacheStatus] = useState<'downloading' | 'cached' | 'online' | 'error'>('downloading');
    const { user } = useAuthStore();
    const { currentProjectId } = useProjectsStore();

    // Imagen: dimensiones reales cargadas
    const [imgSize, setImgSize] = useState({ w: SW * 1.5, h: SH });
    const imgSizeRef = useRef({ w: SW * 1.5, h: SH });
    useEffect(() => { imgSizeRef.current = imgSize; }, [imgSize]);

    // Layout del canvasWrap para calcular el centro
    const canvasWrapLayout = useRef({ x: 0, y: 0, width: SW, height: SH * 0.6 });

    // Refs para evitar stale closures en callbacks
    const userRef = useRef(user);
    const projectIdRef = useRef(currentProjectId);
    const planScaleRef = useRef(planScale);
    const annotationsRef = useRef(annotations);
    const annotColorRef = useRef(annotColor);

    // Mantener refs actualizados
    useEffect(() => { userRef.current = user; }, [user]);
    useEffect(() => { projectIdRef.current = currentProjectId; }, [currentProjectId]);
    useEffect(() => { planScaleRef.current = planScale; }, [planScale]);
    useEffect(() => { annotationsRef.current = annotations; }, [annotations]);
    useEffect(() => { annotColorRef.current = annotColor; }, [annotColor]);

    // ── Cache local del plano ────────────────────────────────
    useEffect(() => {
        const loadPlan = async () => {
            setCacheLoading(true);
            try {
                // Verificar conectividad
                const net = await NetInfo.fetch();
                setIsOnline(!!net.isConnected);

                // Nombre de archivo local único por plan
                const ext = plan.file_type;
                const cacheFileName = `sitepro_plan_${plan.id}.${ext}`;
                const cacheUri = (FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '') + cacheFileName;

                // Verificar si ya existe en cache
                const info = await FileSystem.getInfoAsync(cacheUri);

                if (info.exists) {
                    // Ya está cacheado — usar directamente
                    setLocalUri(cacheUri);
                    setCacheStatus('cached');
                    setCacheLoading(false);

                    // Si hay internet, actualizar el cache en background
                    if (net.isConnected) {
                        FileSystem.downloadAsync(plan.file_url, cacheUri)
                            .catch(() => { }); // silencioso, ya tenemos versión local
                    }
                } else if (net.isConnected) {
                    // No está en cache pero hay internet — descargar
                    setCacheStatus('downloading');
                    const result = await FileSystem.downloadAsync(plan.file_url, cacheUri);
                    if (result.status === 200) {
                        setLocalUri(cacheUri);
                        setCacheStatus('cached');
                    } else {
                        // Fallback a URL remota
                        setLocalUri(plan.file_url);
                        setCacheStatus('online');
                    }
                    setCacheLoading(false);
                } else {
                    // Sin internet y sin cache
                    setLocalUri(null);
                    setCacheStatus('error');
                    setCacheLoading(false);
                }
            } catch {
                // Error — intentar con URL remota si hay internet
                const net = await NetInfo.fetch();
                if (net.isConnected) {
                    setLocalUri(plan.file_url);
                    setCacheStatus('online');
                } else {
                    setCacheStatus('error');
                }
                setCacheLoading(false);
            }
        };
        loadPlan();
    }, [plan.id, plan.file_url, plan.file_type]);

    // ── Gestures ─────────────────────────────────────────────
    const pinch = Gesture.Pinch()
        .onUpdate(e => { scaleAnim.value = clamp(savedScale.value * e.scale, 0.3, 8); })
        .onEnd(() => { savedScale.value = scaleAnim.value; });

    const panG = Gesture.Pan()
        .onUpdate(e => { offsetX.value = savedX.value + e.translationX; offsetY.value = savedY.value + e.translationY; })
        .onEnd(() => { savedX.value = offsetX.value; savedY.value = offsetY.value; });

    const doubleTap = Gesture.Tap().numberOfTaps(2).onEnd(() => {
        scaleAnim.value = withSpring(1); savedScale.value = 1;
        offsetX.value = withSpring(0); offsetY.value = withSpring(0);
        savedX.value = 0; savedY.value = 0;
    });

    const panPinch = Gesture.Simultaneous(pinch, panG);
    const allGestures = Gesture.Exclusive(doubleTap, panPinch);

    const animStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: offsetX.value },
            { translateY: offsetY.value },
            { scale: scaleAnim.value },
        ],
    }));

    const zoomIn = () => { scaleAnim.value = withSpring(Math.min(scaleAnim.value + 0.5, 8)); savedScale.value = scaleAnim.value; };
    const zoomOut = () => { scaleAnim.value = withSpring(Math.max(scaleAnim.value - 0.5, 0.3)); savedScale.value = scaleAnim.value; };
    const reset = () => {
        scaleAnim.value = withSpring(1); savedScale.value = 1;
        offsetX.value = withSpring(0); offsetY.value = withSpring(0);
        savedX.value = 0; savedY.value = 0;
    };

    // ── Convertir toque de pantalla → coordenada en imagen ───
    // pageX/pageY son absolutas en pantalla.
    // El centro del canvasWrap es donde está el (0,0) del Animated.View antes de transforms.
    // La imagen está centrada en el Animated.View.
    const screenToImg = useCallback((pageX: number, pageY: number): Point => {
        const wrap = canvasWrapLayout.current;
        // Centro del canvasWrap en pantalla
        const wrapCenterX = wrap.x + wrap.width / 2;
        const wrapCenterY = wrap.y + wrap.height / 2;

        // El Animated.View parte del centro del wrap y se desplaza con offset + scale.
        // Coordenada relativa al centro del Animated.View
        const relX = (pageX - wrapCenterX - offsetX.value) / scaleAnim.value;
        const relY = (pageY - wrapCenterY - offsetY.value) / scaleAnim.value;

        // La imagen también está centrada en el Animated.View
        const imgX = relX + imgSize.w / 2;
        const imgY = relY + imgSize.h / 2;

        return { x: imgX, y: imgY };
    }, [imgSize, offsetX, offsetY, scaleAnim]);

    // ── Touch handlers (refs para evitar stale closures) ───────
    const drawingRef = useRef(drawing);
    const drawStartRef = useRef(drawStart);
    const activeToolRef = useRef(activeTool);
    useEffect(() => { drawingRef.current = drawing; }, [drawing]);
    useEffect(() => { drawStartRef.current = drawStart; }, [drawStart]);
    useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);

    const handleTouch = useCallback((e: any) => {
        const tool = activeToolRef.current;
        if (tool === 'pan') return;
        const { pageX, pageY } = e.nativeEvent;
        const pt = screenToImg(pageX, pageY);
        const color = annotColorRef.current;

        if (tool === 'pin') {
            const pinCount = annotationsRef.current.filter(a => a.type === 'pin').length;
            const { w, h } = imgSizeRef.current;
            const normPt = normalize(pt, w, h);
            const newAnnot: Annotation = {
                id: uuidv4(), type: 'pin', color,
                point: normPt, label: `P${pinCount + 1}`,
            };
            setAnnotations(prev => [...prev, newAnnot]);
            saveAnnotation(newAnnot);
        } else if (tool === 'text') {
            const { w, h } = imgSizeRef.current;
            setPendingPt(normalize(pt, w, h));
            setShowTextModal(true);
        } else if (tool === 'measure') {
            if (!drawingRef.current) {
                const { w, h } = imgSizeRef.current;
                setDrawStart(normalize(pt, w, h)); setDrawEnd(null); setDrawing(true);
            } else if (drawStartRef.current) {
                const { w, h } = imgSizeRef.current;
                // drawStartRef ya está normalizado — denormalizar para calcular dist real
                const startPx = denormalize(drawStartRef.current, w, h);
                const px = dist(startPx, pt);                    // dist en píxeles reales
                const normEnd = normalize(pt, w, h);                   // normalizar el punto final
                const newAnnot: Annotation = {
                    id: uuidv4(), type: 'measure', color,
                    start: drawStartRef.current,  // ya normalizado
                    end: normEnd,
                    pixelDist: px, realDist: calcRealDist(px, planScaleRef.current),
                };
                setAnnotations(prev => [...prev, newAnnot]);
                saveAnnotation(newAnnot);
                setDrawing(false); setDrawStart(null); setDrawEnd(null);
            }
        }
    }, [screenToImg, saveAnnotation]);

    const handleMove = useCallback((e: any) => {
        if (activeToolRef.current !== 'measure' || !drawingRef.current) return;
        const { pageX, pageY } = e.nativeEvent;
        const pt = screenToImg(pageX, pageY);
        const { w, h } = imgSizeRef.current;
        setDrawEnd(normalize(pt, w, h));
    }, [screenToImg]);

    // ── Cargar anotaciones desde Supabase ───────────────────
    useEffect(() => {
        const loadAnnotations = async () => {
            setLoadingAnnots(true);
            const { data, error } = await supabase
                .from('plan_annotations')
                .select('*')
                .eq('plan_id', plan.id)
                .order('created_at', { ascending: true });

            if (!error && data) {
                const loaded: Annotation[] = data.map((r: any) => {
                    if (r.type === 'measure') return {
                        id: r.id, type: 'measure', color: r.color,
                        start: { x: r.start_x, y: r.start_y },
                        end: { x: r.end_x, y: r.end_y },
                        pixelDist: r.pixel_dist, realDist: r.real_dist,
                    };
                    if (r.type === 'pin') return {
                        id: r.id, type: 'pin', color: r.color,
                        point: { x: r.point_x, y: r.point_y }, label: r.label,
                    };
                    return {
                        id: r.id, type: 'text', color: r.color,
                        position: { x: r.position_x, y: r.position_y }, text: r.text,
                    };
                });
                setAnnotations(loaded);
            }
            setLoadingAnnots(false);
        };
        loadAnnotations();
    }, [plan.id]);

    // ── Guardar anotación en Supabase ────────────────────────
    const saveAnnotation = useCallback(async (annot: Annotation) => {
        const uid = userRef.current?.id;
        const pid = projectIdRef.current;
        if (!uid || !pid) {
            console.warn('[PlanViewer] saveAnnotation: missing user or projectId', { uid, pid });
            return;
        }
        const base = {
            id: annot.id,
            plan_id: plan.id,
            project_id: pid,
            created_by: uid,
            type: annot.type,
            color: annot.color,
            plan_scale: planScaleRef.current,
        };
        let row: any = { ...base };
        if (annot.type === 'measure') {
            row = {
                ...row, start_x: annot.start?.x, start_y: annot.start?.y,
                end_x: annot.end?.x, end_y: annot.end?.y,
                pixel_dist: annot.pixelDist, real_dist: annot.realDist
            };
        } else if (annot.type === 'pin') {
            row = { ...row, point_x: annot.point?.x, point_y: annot.point?.y, label: annot.label };
        } else {
            row = { ...row, position_x: annot.position?.x, position_y: annot.position?.y, text: annot.text };
        }
        const { error } = await supabase.from('plan_annotations').upsert(row, { onConflict: 'id' });
        if (error) console.error('[PlanViewer] save error:', error.message);
    }, [plan.id]);

    // ── Eliminar anotación de Supabase ───────────────────────
    const deleteAnnotation = async (id: string) => {
        await supabase.from('plan_annotations').delete().eq('id', id);
    };

    // ── Eliminar todas las anotaciones ───────────────────────
    const clearAnnotations = async () => {
        const ids = annotations.map(a => a.id);
        if (ids.length > 0) {
            await supabase.from('plan_annotations').delete().in('id', ids);
        }
        setAnnotations([]);
    };

    // ── Export como PDF real (via print API) ─────────────────
    const handleExport = async () => {
        setExporting(true);
        try {
            // Construir HTML con el plano + anotaciones SVG
            const svgAnnots = annotations.map(a => {
                if (a.type === 'measure' && a.start && a.end) {
                    const mx = (a.start.x + a.end.x) / 2;
                    const my = (a.start.y + a.end.y) / 2 - 12;
                    const labelW = (a.realDist?.length ?? 5) * 7 + 12;
                    return `
            <line x1="${a.start.x}" y1="${a.start.y}" x2="${a.end.x}" y2="${a.end.y}" stroke="${a.color}" stroke-width="2.5" stroke-dasharray="8,4"/>
            <circle cx="${a.start.x}" cy="${a.start.y}" r="5" fill="${a.color}"/>
            <circle cx="${a.end.x}"   cy="${a.end.y}"   r="5" fill="${a.color}"/>
            <rect x="${mx - labelW / 2}" y="${my - 13}" width="${labelW}" height="18" rx="4" fill="${a.color}"/>
            <text x="${mx}" y="${my + 1}" text-anchor="middle" fill="white" font-size="11" font-family="Arial" font-weight="bold">${a.realDist}</text>`;
                }
                if (a.type === 'pin' && a.point) return `
            <circle cx="${a.point.x}" cy="${a.point.y}" r="10" fill="${a.color}" opacity="0.9"/>
            <text x="${a.point.x}" y="${a.point.y + 4}" text-anchor="middle" fill="white" font-size="10" font-family="Arial" font-weight="bold">${a.label}</text>`;
                if (a.type === 'text' && a.position) return `
            <rect x="${a.position.x - 3}" y="${a.position.y - 15}" width="${(a.text?.length ?? 4) * 8 + 10}" height="20" rx="3" fill="${a.color}" opacity="0.85"/>
            <text x="${a.position.x + 2}" y="${a.position.y + 0}" fill="white" font-size="12" font-family="Arial">${a.text}</text>`;
                return '';
            }).join('\n');

            const legendRows = annotations.map((a, i) => {
                if (a.type === 'measure') return `<tr><td>${i + 1}</td><td>📏 Medición</td><td><b>${a.realDist}</b></td><td style="color:${a.color}">■</td></tr>`;
                if (a.type === 'pin') return `<tr><td>${a.label}</td><td>📍 Punto</td><td>—</td><td style="color:${a.color}">■</td></tr>`;
                if (a.type === 'text') return `<tr><td>${i + 1}</td><td>✏️ Texto</td><td>${a.text}</td><td style="color:${a.color}">■</td></tr>`;
                return '';
            }).join('');

            const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  @page { size: A3 landscape; margin: 15mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; }
  .header { background:#141414; color:white; padding:12px 16px; display:flex; justify-content:space-between; margin-bottom:8px; border-radius:4px; }
  .header h1 { font-size:16px; color:#EAAB00; margin-bottom:3px; }
  .header p  { font-size:11px; opacity:0.6; }
  .meta { display:flex; gap:16px; padding:8px 0; border-bottom:1px solid #eee; margin-bottom:8px; flex-wrap:wrap; }
  .meta span { font-size:10px; color:#555; }
  .meta b { color:#222; }
  .plan-wrap { position:relative; width:100%; page-break-inside:avoid; }
  .plan-wrap img { width:100%; display:block; border:1px solid #ddd; }
  .plan-wrap svg { position:absolute; top:0; left:0; width:100%; height:100%; }
  table { width:100%; border-collapse:collapse; margin-top:12px; font-size:10px; }
  th { background:#141414; color:white; padding:6px 8px; text-align:left; }
  td { padding:5px 8px; border-bottom:1px solid #eee; }
  tr:nth-child(even) td { background:#f9f9f9; }
  .footer { margin-top:12px; text-align:center; font-size:9px; color:#aaa; border-top:1px solid #eee; padding-top:8px; }
</style>
</head><body>
<div class="header">
  <div><h1>${plan.code} — ${plan.title}</h1><p>${plan.discipline} · ${plan.level} · ${plan.revision}</p></div>
  <div style="text-align:right;font-size:10px;opacity:0.6">SitePro<br/>${new Date().toLocaleDateString('es-MX')}</div>
</div>
<div class="meta">
  <span><b>Disciplina:</b> ${plan.discipline}</span>
  <span><b>Nivel:</b> ${plan.level}</span>
  <span><b>Revisión:</b> ${plan.revision}</span>
  <span><b>Escala:</b> ${planScale}</span>
  <span><b>Anotaciones:</b> ${annotations.length}</span>
  <span><b>Fecha:</b> ${new Date().toLocaleString('es-MX')}</span>
</div>
<div class="plan-wrap">
  <img src="${plan.file_url}" />
  <svg viewBox="0 0 ${imgSize.w} ${imgSize.h}">${svgAnnots}</svg>
</div>
${annotations.length > 0 ? `
<table>
  <tr><th>#</th><th>Tipo</th><th>Detalle</th><th>Color</th></tr>
  ${legendRows}
</table>` : ''}
<div class="footer">Generado con SitePro · ${new Date().toLocaleString('es-MX')}</div>
</body></html>`;

            // Guardar como HTML temporal y compartir para imprimir/guardar como PDF
            const fileName = `${plan.code.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.html`;
            const localUri = (FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '') + fileName;
            await FileSystem.writeAsStringAsync(localUri, html, { encoding: FileSystem.EncodingType.UTF8 });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(localUri, {
                    mimeType: 'text/html',
                    dialogTitle: `Exportar ${plan.code} como PDF`,
                    UTI: 'public.html',
                });
                toast.success('Listo', 'Abre el archivo y usa "Imprimir → Guardar como PDF"');
            }
        } catch (err: any) {
            toast.error('Error al exportar', err.message ?? 'Inténtalo de nuevo');
        } finally {
            setExporting(false);
        }
    };

    // ── SVG overlay — denormaliza coords al tamaño real de imagen
    const renderSVG = () => {
        const { w: iw, h: ih } = imgSize;
        // Helper: denormalizar un punto normalizado
        const dn = (pt: Point) => denormalize(pt, iw, ih);

        // En progreso: drawStart y drawEnd ya están normalizados
        const dsD = drawStart ? dn(drawStart) : null;
        const deD = drawEnd ? dn(drawEnd) : null;

        return (
            <Svg style={StyleSheet.absoluteFill} viewBox={`0 0 ${iw} ${ih}`} pointerEvents="none">
                {/* Medición en progreso */}
                {drawing && dsD && deD && (
                    <G>
                        <Line x1={dsD.x} y1={dsD.y} x2={deD.x} y2={deD.y}
                            stroke={annotColor} strokeWidth={2} strokeDasharray="6,3" />
                        <Circle cx={dsD.x} cy={dsD.y} r={5} fill={annotColor} />
                        <Circle cx={deD.x} cy={deD.y} r={5} fill={annotColor} />
                        <SvgText x={(dsD.x + deD.x) / 2} y={(dsD.y + deD.y) / 2 - 10}
                            fill={annotColor} fontSize={12} fontWeight="bold" textAnchor="middle">
                            {calcRealDist(dist(dsD, deD), planScale)}
                        </SvgText>
                    </G>
                )}
                {/* Anotaciones guardadas — denormalizadas al tamaño actual */}
                {annotations.map(a => {
                    if (a.type === 'measure' && a.start && a.end) {
                        const s = dn(a.start); const e = dn(a.end);
                        const mx = (s.x + e.x) / 2; const my = (s.y + e.y) / 2 - 10;
                        return (
                            <G key={a.id}>
                                <Line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke={a.color} strokeWidth={2} strokeDasharray="6,3" />
                                <Circle cx={s.x} cy={s.y} r={5} fill={a.color} />
                                <Circle cx={e.x} cy={e.y} r={5} fill={a.color} />
                                <SvgText x={mx} y={my} fill={a.color} fontSize={11} fontWeight="bold" textAnchor="middle">{a.realDist}</SvgText>
                            </G>
                        );
                    }
                    if (a.type === 'pin' && a.point) {
                        const p = dn(a.point);
                        return (
                            <G key={a.id}>
                                <Circle cx={p.x} cy={p.y} r={10} fill={a.color} opacity={0.9} />
                                <SvgText x={p.x} y={p.y + 4} fill="white" fontSize={9} fontWeight="bold" textAnchor="middle">{a.label}</SvgText>
                            </G>
                        );
                    }
                    if (a.type === 'text' && a.position) {
                        const p = dn(a.position);
                        return (
                            <G key={a.id}>
                                <Rect x={p.x - 3} y={p.y - 15} width={(a.text?.length ?? 4) * 8 + 10} height={20} rx={3} fill={a.color} opacity={0.85} />
                                <SvgText x={p.x + 2} y={p.y + 1} fill="white" fontSize={12}>{a.text}</SvgText>
                            </G>
                        );
                    }
                    return null;
                })}
            </Svg>
        );
    };

    return (
        <Modal visible animationType="slide" statusBarTranslucent>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={s.root}>
                    <StatusBar barStyle="light-content" backgroundColor="#000" />

                    {/* Top Bar */}
                    <View style={s.topBar}>
                        <TouchableOpacity onPress={onClose} style={s.iconBtn}>
                            <ArrowLeft size={iconSize.md} color="white" />
                        </TouchableOpacity>
                        <View style={s.topInfo}>
                            <Text style={s.topCode}>{plan.code}</Text>
                            <Text style={s.topTitle} numberOfLines={1}>{plan.title}</Text>
                        </View>
                        {/* Cache status badge */}
                        <View style={[s.cacheBadge, {
                            backgroundColor: cacheStatus === 'cached' ? 'rgba(16,185,129,0.2)' :
                                cacheStatus === 'error' ? 'rgba(239,68,68,0.2)' :
                                    'rgba(234,171,0,0.15)'
                        }]}>
                            <Text style={[s.cacheBadgeText, {
                                color: cacheStatus === 'cached' ? '#10B981' :
                                    cacheStatus === 'error' ? '#EF4444' : '#EAAB00'
                            }]}>
                                {cacheStatus === 'cached' ? '✓ Local' :
                                    cacheStatus === 'error' ? '✗ Sin red' :
                                        cacheStatus === 'downloading' ? '↓ Descargando' : '☁ Online'}
                            </Text>
                        </View>
                        <TouchableOpacity style={s.scalePill} onPress={() => setShowScale(true)}>
                            <Text style={s.scalePillText}>📐 {planScale}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.exportBtn} onPress={handleExport} disabled={exporting}>
                            {exporting ? <ActivityIndicator size="small" color="white" /> : <Download size={16} color="white" />}
                            <Text style={s.exportText}>{exporting ? '...' : 'PDF'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.iconBtn, { backgroundColor: 'rgba(239,68,68,0.2)' }]}
                            onPress={() => confirm.confirm({
                                title: 'Eliminar plano', message: `¿Eliminar "${plan.title}"?`,
                                confirmLabel: 'Sí, eliminar', icon: 'trash', variant: 'danger',
                                onConfirm: async () => { try { await onDelete(); onClose(); } catch { } },
                            })}>
                            <Trash2 size={iconSize.md} color={colors.error[400]} />
                        </TouchableOpacity>
                    </View>

                    {/* Canvas */}
                    <GestureDetector gesture={plan.file_type !== 'pdf' && activeTool === 'pan' ? allGestures : doubleTap}>
                        <Animated.View
                            style={[s.canvasWrap, plan.file_type === 'pdf' ? {} : animStyle]}
                            onLayout={e => {
                                e.target.measure((_fx, _fy, w, h, px, py) => {
                                    canvasWrapLayout.current = { x: px, y: py, width: w, height: h };
                                });
                            }}
                        >
                            {cacheLoading ? (
                                /* Cargando / descargando */
                                <View style={{ width: SW, height: SH * 0.72, alignItems: 'center', justifyContent: 'center' }}>
                                    <ActivityIndicator color="#EAAB00" size="large" />
                                    <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 12, fontSize: 13 }}>
                                        {cacheStatus === 'downloading' ? 'Descargando plano...' : 'Cargando...'}
                                    </Text>
                                </View>
                            ) : cacheStatus === 'error' ? (
                                /* Sin internet y sin cache */
                                <View style={{ width: SW, height: SH * 0.72, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 40 }}>
                                    <Text style={{ fontSize: 48 }}>📵</Text>
                                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>Sin conexión</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center' }}>
                                        Este plano aún no ha sido descargado. Ábrelo con internet una vez para guardarlo en el dispositivo.
                                    </Text>
                                </View>
                            ) : plan.file_type === 'pdf' ? (
                                /* PDF viewer — local si está cacheado, Google Docs si no */
                                <View style={{ width: SW, height: SH * 0.72 }}>
                                    {cacheStatus === 'cached' && localUri ? (
                                        /* PDF local — usar Google Docs con archivo local o WebView directo */
                                        <WebView
                                            source={{
                                                uri: Platform.OS === 'ios'
                                                    ? localUri   // iOS puede renderizar PDF local directo
                                                    : `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(plan.file_url)}`
                                            }}
                                            style={{ flex: 1, backgroundColor: '#1a1a1a' }}
                                            startInLoadingState
                                            renderLoading={() => (
                                                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a' }}>
                                                    <ActivityIndicator color="#EAAB00" size="large" />
                                                    <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 12, fontSize: 13 }}>Abriendo PDF...</Text>
                                                </View>
                                            )}
                                            onError={() => { if (localUri) WebBrowser.openBrowserAsync(localUri); }}
                                        />
                                    ) : (
                                        <WebView
                                            source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(plan.file_url)}` }}
                                            style={{ flex: 1, backgroundColor: '#1a1a1a' }}
                                            startInLoadingState
                                            renderLoading={() => (
                                                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a' }}>
                                                    <ActivityIndicator color="#EAAB00" size="large" />
                                                    <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 12, fontSize: 13 }}>Cargando PDF...</Text>
                                                </View>
                                            )}
                                            onError={() => { WebBrowser.openBrowserAsync(plan.file_url); }}
                                        />
                                    )}
                                </View>
                            ) : (
                                /* PNG / JPG — usar archivo local cacheado */
                                <View
                                    style={{ width: imgSize.w, height: imgSize.h }}
                                    onTouchStart={activeTool !== 'pan' ? handleTouch : undefined}
                                    onTouchMove={activeTool === 'measure' ? handleMove : undefined}
                                >
                                    <Image
                                        source={{ uri: localUri ?? plan.file_url }}
                                        style={{ width: imgSize.w, height: imgSize.h }}
                                        resizeMode="contain"
                                        onLoad={e => {
                                            const { width, height } = e.nativeEvent.source;
                                            const ratio = height / width;
                                            const w = SW * 1.8;
                                            setImgSize({ w, h: w * ratio });
                                        }}
                                    />
                                    {renderSVG()}
                                </View>
                            )}
                        </Animated.View>
                    </GestureDetector>

                    {/* Loading anotaciones */}
                    {loadingAnnots && (
                        <View style={{ position: 'absolute', top: 20, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color="#EAAB00" />
                            <Text style={{ color: 'white', fontSize: 11 }}>Cargando anotaciones...</Text>
                        </View>
                    )}
                    {/* Hint */}
                    {plan.file_type !== 'pdf' && activeTool !== 'pan' && (
                        <View style={s.hint}>
                            <Text style={s.hintText}>
                                {activeTool === 'measure'
                                    ? (drawing ? '🔴 Toca el punto final de la medición' : '🟢 Toca el punto inicial')
                                    : activeTool === 'pin' ? '📍 Toca para colocar un marcador'
                                        : '✏️ Toca para colocar texto'}
                            </Text>
                        </View>
                    )}

                    {/* Zoom controls */}
                    <View style={s.zoomControls}>
                        <TouchableOpacity style={s.zoomBtn} onPress={zoomIn}><ZoomIn size={16} color="white" /></TouchableOpacity>
                        <TouchableOpacity style={s.zoomBtn} onPress={zoomOut}><ZoomOut size={16} color="white" /></TouchableOpacity>
                        <TouchableOpacity style={s.zoomBtn} onPress={reset}><Maximize2 size={16} color="white" /></TouchableOpacity>
                    </View>

                    {/* Color bar — solo para imágenes */}
                    {plan.file_type !== 'pdf' && activeTool !== 'pan' && (
                        <View style={s.colorBar}>
                            {ANNOT_COLORS.map(c => (
                                <TouchableOpacity key={c} style={[s.colorDot, { backgroundColor: c }, annotColor === c && s.colorDotActive]} onPress={() => setAnnotColor(c)} />
                            ))}
                        </View>
                    )}

                    {/* Toolbar — solo para imágenes */}
                    {plan.file_type !== 'pdf' && <Toolbar
                        activeTool={activeTool}
                        onTool={t => { setActiveTool(t); setDrawing(false); setDrawStart(null); setDrawEnd(null); }}
                        onUndo={() => {
                            const last = annotations[annotations.length - 1];
                            if (last) { deleteAnnotation(last.id); setAnnotations(p => p.slice(0, -1)); }
                        }}
                        onClear={() => Alert.alert('Limpiar', '¿Eliminar todas las anotaciones?', [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Limpiar', style: 'destructive', onPress: clearAnnotations },
                        ])}
                        annotCount={annotations.length}
                    />}
                </View>
            </GestureHandlerRootView>

            <ConfirmDialogContainer />
            <ScaleModal visible={showScale} scale={planScale} onSave={setPlanScale} onClose={() => setShowScale(false)} />
            <TextModal
                visible={showTextModal}
                onSave={(text, color) => {
                    setPendingPt(prev => {
                        if (prev) {
                            // prev ya está normalizado desde handleTouch — usar directo
                            const newAnnot: Annotation = { id: uuidv4(), type: 'text', color, position: prev, text };
                            setAnnotations(p => [...p, newAnnot]);
                            saveAnnotation(newAnnot);
                        }
                        return null;
                    });
                }}
                onClose={() => { setShowTextModal(false); setPendingPt(null); }}
            />
        </Modal>
    );
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0A0A0A' },
    topBar: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
        paddingHorizontal: spacing.base,
        paddingTop: (StatusBar.currentHeight ?? 44) + spacing.sm,
        paddingBottom: spacing.md,
        backgroundColor: 'rgba(0,0,0,0.8)',
        zIndex: 10,
    },
    iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    topInfo: { flex: 1 },
    topCode: { fontSize: fontSize.small, fontWeight: fontWeight.bold, color: '#FBBF24' },
    topTitle: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
    scalePill: { backgroundColor: 'rgba(234,171,0,0.15)', borderWidth: 1, borderColor: 'rgba(234,171,0,0.4)', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
    scalePillText: { fontSize: 11, color: '#EAAB00', fontWeight: fontWeight.bold },
    exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
    exportText: { fontSize: 11, color: 'white', fontWeight: fontWeight.bold },
    cacheBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    cacheBadgeText: { fontSize: 10, fontWeight: fontWeight.bold },
    // Canvas ocupa todo el espacio restante, centrado
    canvasWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    hint: { position: 'absolute', bottom: 170, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.78)', paddingHorizontal: spacing.lg, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.full },
    hintText: { fontSize: 11, color: 'rgba(255,255,255,0.9)' },
    zoomControls: { position: 'absolute', right: spacing.base, top: 110, gap: spacing.sm },
    zoomBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    colorBar: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.sm, backgroundColor: 'rgba(0,0,0,0.6)' },
    colorDot: { width: 26, height: 26, borderRadius: 13 },
    colorDotActive: { borderWidth: 3, borderColor: 'white', transform: [{ scale: 1.15 }] },
});

const tb = StyleSheet.create({
    container: { flexDirection: 'row', backgroundColor: '#141414', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingBottom: Platform.OS === 'ios' ? 28 : 12, paddingTop: 10, paddingHorizontal: spacing.xs },
    btn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xs, borderRadius: borderRadius.sm, gap: 3 },
    label: { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: fontWeight.medium },
    sep: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: spacing.xs },
});

const sm = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: 'white', borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg, paddingBottom: 36, gap: spacing.md },
    title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#0F0F0F' },
    sub: { fontSize: fontSize.body, color: '#737373', marginTop: -spacing.sm },
    input: { borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: borderRadius.md, paddingHorizontal: spacing.base, paddingVertical: spacing.md, fontSize: fontSize.base, color: '#0F0F0F' },
    presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    preset: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.full, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E8E8E8' },
    presetActive: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
    presetText: { fontSize: fontSize.small, fontWeight: fontWeight.medium, color: '#525252' },
    colorDot: { width: 28, height: 28, borderRadius: 14 },
    colorDotActive: { borderWidth: 3, borderColor: '#141414' },
    actions: { flexDirection: 'row', gap: spacing.md },
    cancel: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: borderRadius.md, backgroundColor: '#F5F5F5' },
    save: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: borderRadius.md, backgroundColor: '#EAAB00' },
});