/**
 * SitePro — Store de Tareas con Supabase
 */

import { supabase } from '@lib/supabase';
import { create } from 'zustand';

// ─── Tipos DB ─────────────────────────────────────────────────
export type DbTaskStatus   = 'pending' | 'in_progress' | 'urgent' | 'completed' | 'cancelled';
export type DbTaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface DbTask {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: DbTaskStatus;
  priority: DbTaskPriority;
  assigned_to: string | null;
  created_by: string | null;
  location: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // JOIN desde profiles
  assignee?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    job_title: string | null;
  } | null;
}

export interface CreateTaskInput {
  project_id: string;
  title: string;
  description?: string | null;
  status?: DbTaskStatus;
  priority?: DbTaskPriority;
  assigned_to?: string | null;
  location?: string | null;
  due_date?: string | null;
}

// ─── Mapas UI ↔ DB ────────────────────────────────────────────
export const STATUS_UI_TO_DB: Record<string, DbTaskStatus> = {
  'Urgente':     'urgent',
  'En Progreso': 'in_progress',
  'Pendiente':   'pending',
  'Completada':  'completed',
  'Cancelada':   'cancelled',
};

export const STATUS_DB_TO_UI: Record<DbTaskStatus, string> = {
  urgent:      'Urgente',
  in_progress: 'En Progreso',
  pending:     'Pendiente',
  completed:   'Completada',
  cancelled:   'Cancelada',
};

export const PRIORITY_UI_TO_DB: Record<string, DbTaskPriority> = {
  'Alta':     'high',
  'Media':    'medium',
  'Baja':     'low',
  'Crítica':  'critical',
};

export const PRIORITY_DB_TO_UI: Record<DbTaskPriority, string> = {
  high:     'Alta',
  medium:   'Media',
  low:      'Baja',
  critical: 'Crítica',
};

// ─── Helper ───────────────────────────────────────────────────
async function loadTasksFromDB(projectId: string): Promise<DbTask[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url, job_title)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[tasksStore] fetch error:', error.message);
    return [];
  }
  return data ?? [];
}

// ─── Store ────────────────────────────────────────────────────
interface TasksStore {
  tasks: DbTask[];
  currentProjectId: string | null;
  isLoading: boolean;
  error: string | null;

  loadTasks: (projectId: string) => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<void>;
  updateStatus: (taskId: string, status: DbTaskStatus) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  clearError: () => void;
}

export const useTasksStore = create<TasksStore>((set, get) => ({
  tasks: [],
  currentProjectId: null,
  isLoading: false,
  error: null,

  loadTasks: async (projectId) => {
    set({ isLoading: true, error: null, currentProjectId: projectId });
    const tasks = await loadTasksFromDB(projectId);
    set({ tasks, isLoading: false });
  },

  createTask: async (input) => {
    set({ isLoading: true, error: null });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ isLoading: false, error: 'No autenticado' });
      throw new Error('No autenticado');
    }

    const { error } = await supabase.from('tasks').insert({
      ...input,
      created_by: user.id,
      status: input.status ?? 'pending',
      priority: input.priority ?? 'medium',
    });

    if (error) {
      set({ isLoading: false, error: error.message });
      throw new Error(error.message);
    }

    // Recargar tareas del proyecto actual
    const tasks = await loadTasksFromDB(input.project_id);
    set({ tasks, isLoading: false });
  },

  updateStatus: async (taskId, status) => {
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (status === 'completed') updates.completed_at = new Date().toISOString();

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId);

    if (error) throw new Error(error.message);

    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, status, ...(status === 'completed' ? { completed_at: updates.completed_at } : {}) } : t
      ),
    }));
  },

  deleteTask: async (taskId) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) throw new Error(error.message);
    set(state => ({ tasks: state.tasks.filter(t => t.id !== taskId) }));
  },

  clearError: () => set({ error: null }),
}));
