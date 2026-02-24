/**
 * SitePro — Store Principal de la App (Zustand)
 * Maneja proyectos, tareas y actividad reciente
 */

import type { ActivityItem, Notification, Project, Task } from '@types/index';
import { create } from 'zustand';

// ─── Mock Data ────────────────────────────────────────────────
const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Torre Residencial Norte',
    status: 'En Progreso',
    progress: 67,
    startDate: '2025-09-01',
    deadline: '2026-03-15',
    totalTasks: 24,
    completedTasks: 16,
    pendingTasks: 3,
    urgentTasks: 5,
    teamCount: 8,
  },
  {
    id: '2',
    name: 'Centro Comercial Plaza',
    status: 'En Progreso',
    progress: 45,
    startDate: '2025-11-01',
    deadline: '2026-06-30',
    totalTasks: 18,
    completedTasks: 8,
    pendingTasks: 6,
    urgentTasks: 4,
    teamCount: 6,
  },
  {
    id: '3',
    name: 'Complejo Industrial',
    status: 'En Revisión',
    progress: 89,
    startDate: '2025-06-01',
    deadline: '2026-02-10',
    totalTasks: 8,
    completedTasks: 7,
    pendingTasks: 1,
    urgentTasks: 0,
    teamCount: 4,
  },
];

const MOCK_TASKS: Task[] = [
  {
    id: '1',
    projectId: '1',
    title: 'Revisar instalación eléctrica piso 5',
    description: 'Verificar que todas las conexiones del piso 5 cumplan con la normativa NOM-001-SEDE.',
    status: 'Urgente',
    priority: 'Alta',
    assignedTo: {
      id: '2',
      name: 'Juan Pérez',
      email: 'juan@sitepro.com',
      role: 'Electricista',
      initials: 'JP',
      isOnline: true,
      activeTasks: 3,
    },
    location: 'Piso 5',
    createdAt: '2026-02-15T10:00:00Z',
    deadline: '2026-02-18',
  },
  {
    id: '2',
    projectId: '1',
    title: 'Inspección de plomería zona norte',
    description: 'Revisar tuberías de agua fría y caliente en la zona norte del edificio.',
    status: 'En Progreso',
    priority: 'Media',
    assignedTo: {
      id: '3',
      name: 'María García',
      email: 'maria@sitepro.com',
      role: 'Plomero',
      initials: 'MG',
      isOnline: true,
      activeTasks: 2,
    },
    location: 'Piso 3 - Baños',
    createdAt: '2026-02-14T09:00:00Z',
    deadline: '2026-02-20',
  },
  {
    id: '3',
    projectId: '1',
    title: 'Aplicar primera capa de pintura',
    description: 'Preparar superficies y aplicar primera capa en departamentos del piso 2.',
    status: 'Pendiente',
    priority: 'Baja',
    assignedTo: {
      id: '5',
      name: 'Ana López',
      email: 'ana@sitepro.com',
      role: 'Acabados',
      initials: 'AL',
      isOnline: true,
      activeTasks: 4,
    },
    location: 'Piso 2',
    createdAt: '2026-02-16T08:00:00Z',
    deadline: '2026-02-25',
  },
  {
    id: '4',
    projectId: '1',
    title: 'Revisión estructural columnas',
    description: 'Inspección de columnas de concreto en niveles 6-10.',
    status: 'Completada',
    priority: 'Alta',
    assignedTo: {
      id: '4',
      name: 'Carlos Ruiz',
      email: 'carlos@sitepro.com',
      role: 'Inspector',
      initials: 'CR',
      isOnline: false,
      activeTasks: 5,
    },
    location: 'Pisos 6-10',
    createdAt: '2026-02-10T07:00:00Z',
    deadline: '2026-02-15',
    completedAt: '2026-02-14T16:30:00Z',
  },
];

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: '1',
    type: 'task_completed',
    title: 'Tarea completada',
    description: 'Ana López completó "Revisión de acabados piso 4"',
    timestamp: '2026-02-18T08:00:00Z',
    actor: {
      id: '5',
      name: 'Ana López',
      email: 'ana@sitepro.com',
      role: 'Acabados',
      initials: 'AL',
      isOnline: true,
      activeTasks: 4,
    },
  },
  {
    id: '2',
    type: 'photo_uploaded',
    title: 'Nueva foto subida',
    description: 'Juan Pérez agregó 3 fotos al piso 5',
    timestamp: '2026-02-18T06:00:00Z',
    actor: {
      id: '2',
      name: 'Juan Pérez',
      email: 'juan@sitepro.com',
      role: 'Electricista',
      initials: 'JP',
      isOnline: true,
      activeTasks: 3,
    },
  },
];


const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'task',
    title: 'Tarea urgente asignada',
    description: 'Juan Pérez te asignó "Revisar instalación eléctrica piso 5"',
    createdAt: '2026-02-20T08:30:00Z',
    isRead: false,
    resourceId: '1',
    resourceType: 'task',
  },
  {
    id: 'n2',
    type: 'message',
    title: 'Nuevo mensaje',
    description: 'Ana López: "Los planos del piso 3 están listos para revisión"',
    createdAt: '2026-02-20T07:15:00Z',
    isRead: false,
    resourceType: 'message',
  },
  {
    id: 'n3',
    type: 'photo',
    title: 'Fotos agregadas',
    description: 'Carlos Ruiz subió 4 fotos al proyecto Torre Residencial Norte',
    createdAt: '2026-02-19T16:45:00Z',
    isRead: false,
    resourceType: 'photo',
  },
  {
    id: 'n4',
    type: 'system',
    title: 'Permiso por vencer',
    description: 'El permiso de vía pública vence en 5 días (25 Feb 2026)',
    createdAt: '2026-02-19T09:00:00Z',
    isRead: true,
    resourceType: 'project',
  },
  {
    id: 'n5',
    type: 'task',
    title: 'Tarea completada',
    description: 'María García completó "Inspección de plomería zona norte"',
    createdAt: '2026-02-18T14:20:00Z',
    isRead: true,
    resourceId: '2',
    resourceType: 'task',
  },
  {
    id: 'n6',
    type: 'system',
    title: 'Nuevo proyecto asignado',
    description: 'Fuiste agregado al proyecto Centro Comercial Plaza como Inspector',
    createdAt: '2026-02-17T10:00:00Z',
    isRead: true,
    resourceType: 'project',
  },
];

// ─── Store ────────────────────────────────────────────────────
interface AppStore {
  // Estado
  projects: Project[];
  currentProjectId: string;
  tasks: Task[];
  activity: ActivityItem[];
  notifications: Notification[];
  unreadNotifications: number;
  isLoading: boolean;

  // Getters computados
  currentProject: () => Project | undefined;
  tasksByProject: (projectId: string) => Task[];
  urgentTasks: () => Task[];

  // Acciones
  setCurrentProject: (projectId: string) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  addTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  addProject: (project: Project) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Estado inicial
  projects: MOCK_PROJECTS,
  currentProjectId: '1',
  tasks: MOCK_TASKS,
  activity: MOCK_ACTIVITY,
  notifications: MOCK_NOTIFICATIONS,
  unreadNotifications: MOCK_NOTIFICATIONS.filter(n => !n.isRead).length,
  isLoading: false,

  // Getters
  currentProject: () => {
    return get().projects.find((p) => p.id === get().currentProjectId);
  },

  tasksByProject: (projectId: string) => {
    return get().tasks.filter((t) => t.projectId === projectId);
  },

  urgentTasks: () => {
    const { tasks, currentProjectId } = get();
    return tasks.filter(
      (t) => t.projectId === currentProjectId && t.status === 'Urgente'
    );
  },

  // Acciones
  setCurrentProject: (projectId: string) => {
    set({ currentProjectId: projectId });
  },

  updateTaskStatus: (taskId: string, status: Task['status']) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
            ...t,
            status,
            completedAt:
              status === 'Completada' ? new Date().toISOString() : t.completedAt,
          }
          : t
      ),
    }));
  },

  deleteTask: (taskId) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== taskId) })),

  addTask: (task: Task) => {
    set((state) => ({ tasks: [task, ...state.tasks] }));
  },

  addProject: (project: Project) => {
    set((state) => ({
      projects: [...state.projects, project],
      currentProjectId: project.id,
    }));
  },

  markNotificationRead: (id: string) => {
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      return {
        notifications,
        unreadNotifications: notifications.filter((n) => !n.isRead).length,
      };
    });
  },

  markAllNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadNotifications: 0,
    }));
  },
}));