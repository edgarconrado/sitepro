/**
 * SitePro — Utilidades
 */

import type { Colors } from '@theme/colors';
import { colors as defaultColors } from '@theme/colors';
import type { ProjectStatus, TaskPriority, TaskStatus } from '@types/index';

// ─── Fechas ───────────────────────────────────────────────────
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatShortDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
  });
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(isoString: string): string {
  const now = new Date();
  const past = new Date(isoString);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return formatShortDate(isoString);
}

// ─── Texto ────────────────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

// ─── Colores de estado de tarea ───────────────────────────────
export function getTaskStatusColors(status: TaskStatus, colors: Colors = defaultColors) {
  const map: Record<TaskStatus, { bg: string; text: string; icon: string }> = {
    Urgente: {
      bg: colors.error[100],
      text: colors.error[700],
      icon: colors.error[500],
    },
    'En Progreso': {
      bg: colors.primary[100],
      text: colors.primary[800],
      icon: colors.primary[600],
    },
    Pendiente: {
      bg: colors.warning[100],
      text: colors.warning[700],
      icon: colors.warning[500],
    },
    Completada: {
      bg: colors.success[100],
      text: colors.success[700],
      icon: colors.success[500],
    },
  };
  return map[status];
}

// ─── Colores de prioridad ─────────────────────────────────────
export function getTaskPriorityColors(priority: TaskPriority, colors: Colors = defaultColors) {
  const map: Record<TaskPriority, { bg: string; text: string }> = {
    Alta: { bg: colors.error[100], text: colors.error[700] },
    Media: { bg: colors.warning[100], text: colors.warning[700] },
    Baja: { bg: colors.gray[100], text: colors.gray[700] },
  };
  return map[priority];
}

// ─── Colores de estado de proyecto ───────────────────────────
export function getProjectStatusColors(status: ProjectStatus, colors: Colors = defaultColors) {
  const map: Record<ProjectStatus, { bg: string; text: string }> = {
    'En Progreso': { bg: colors.primary[100], text: colors.primary[800] },
    'En Revisión': { bg: colors.warning[100], text: colors.warning[700] },
    Completado: { bg: colors.success[100], text: colors.success[700] },
    'En Pausa': { bg: colors.gray[100], text: colors.gray[700] },
  };
  return map[status];
}

// ─── Validaciones ─────────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}