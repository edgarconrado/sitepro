/**
 * SitePro — Store de Proyectos con Supabase
 */

import { supabase } from '@lib/supabase';
import { create } from 'zustand';

// ─── Tipos ────────────────────────────────────────────────────
export interface DbProject {
  id: string;
  name: string;
  description: string | null;
  status: 'planning' | 'in_progress' | 'on_hold' | 'in_review' | 'completed' | 'cancelled';
  progress: number;
  start_date: string | null;
  deadline: string | null;
  address: string | null;
  city: string | null;
  budget: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  total_tasks: number;
  completed_tasks: number;
  urgent_tasks: number;
  pending_tasks: number;
  member_count: number;
}

export interface CreateProjectInput {
  name: string;
  description?: string | null;
  status?: DbProject['status'];
  start_date?: string | null;
  deadline?: string | null;
  address?: string | null;
  city?: string | null;
  budget?: number | null;
}

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  planning: 'Planificación',
  in_progress: 'En Progreso',
  on_hold: 'En Pausa',
  in_review: 'En Revisión',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  planning: '#6366F1',
  in_progress: '#F59E0B',
  on_hold: '#9CA3AF',
  in_review: '#3B82F6',
  completed: '#10B981',
  cancelled: '#EF4444',
};

// ─── Helper: carga proyectos del usuario ──────────────────────
async function loadProjectsFromDB(): Promise<DbProject[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // 1. IDs de proyectos donde soy miembro
  const { data: memberRows } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', user.id);

  const memberIds: string[] = (memberRows ?? []).map((r: any) => r.project_id);

  // 2. Query con OR solo si hay IDs de membresía
  let query = supabase
    .from('projects')
    .select('*, project_members(user_id), tasks(status)')
    .order('updated_at', { ascending: false });

  if (memberIds.length > 0) {
    query = query.or(`created_by.eq.${user.id},id.in.(${memberIds.join(',')})`);
  } else {
    query = query.eq('created_by', user.id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[projectsStore] fetch error:', error.message);
    return [];
  }

  return (data ?? []).map((p: any) => {
    const tasks: any[] = p.tasks ?? [];
    return {
      ...p,
      total_tasks: tasks.length,
      completed_tasks: tasks.filter((t: any) => t.status === 'completed').length,
      urgent_tasks: tasks.filter((t: any) => t.status === 'urgent').length,
      pending_tasks: tasks.filter((t: any) => t.status === 'pending').length,
      member_count: (p.project_members ?? []).length,
      tasks: undefined,
      project_members: undefined,
    } as DbProject;
  });
}


// ─── Cargar miembros de un proyecto ──────────────────────────
export async function fetchProjectMembers(projectId: string) {
  const { data, error } = await supabase
    .from('project_members')
    .select('user_id, role, profiles(id, full_name, job_title, avatar_url)')
    .eq('project_id', projectId);

  if (error) {
    console.error('[fetchProjectMembers] error:', error.message);
    return [];
  }
  return (data ?? []).map((m: any) => ({
    id: m.profiles?.id ?? m.user_id,
    full_name: m.profiles?.full_name ?? 'Usuario',
    job_title: m.profiles?.job_title ?? '',
    avatar_url: m.profiles?.avatar_url ?? null,
    role: m.role,
  }));
}

// ─── Store ────────────────────────────────────────────────────
interface ProjectsStore {
  projects: DbProject[];
  currentProjectId: string | null;
  isLoading: boolean;
  error: string | null;

  loadProjects: () => Promise<void>;
  createProject: (input: CreateProjectInput) => Promise<void>;
  updateProject: (id: string, updates: Partial<CreateProjectInput & { status: DbProject['status'] }>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (id: string) => void;
  currentProject: () => DbProject | undefined;
}

export const useProjectsStore = create<ProjectsStore>((set, get) => ({
  projects: [],
  currentProjectId: null,
  isLoading: false,
  error: null,

  currentProject: () => {
    const { projects, currentProjectId } = get();
    return projects.find(p => p.id === currentProjectId);
  },

  loadProjects: async () => {
    set({ isLoading: true, error: null });
    const projects = await loadProjectsFromDB();
    set({
      projects,
      isLoading: false,
      currentProjectId: get().currentProjectId ?? projects[0]?.id ?? null,
    });
  },

  createProject: async (input) => {
    set({ isLoading: true, error: null });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ isLoading: false, error: 'No autenticado' });
      throw new Error('No autenticado');
    }

    const { data: project, error: insertError } = await supabase
      .from('projects')
      .insert({
        name: input.name,
        description: input.description ?? null,
        status: input.status ?? 'planning',
        start_date: input.start_date ?? null,
        deadline: input.deadline ?? null,
        address: input.address ?? null,
        city: input.city ?? null,
        budget: input.budget ?? null,
        progress: 0,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[createProject] insert error:', insertError.code, insertError.message);
      set({ isLoading: false, error: insertError.message });
      throw new Error(`${insertError.code}: ${insertError.message}`);
    }

    // Agregar creador como miembro
    await supabase
      .from('project_members')
      .insert({ project_id: project.id, user_id: user.id, role: 'admin' });

    const projects = await loadProjectsFromDB();
    set({ projects, currentProjectId: project.id, isLoading: false });
  },

  updateProject: async (id, updates) => {
    const { error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
    const projects = await loadProjectsFromDB();
    set({ projects });
  },

  deleteProject: async (id) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw new Error(error.message);
    const projects = await loadProjectsFromDB();
    const current = get().currentProjectId;
    set({
      projects,
      currentProjectId: current === id ? (projects[0]?.id ?? null) : current,
    });
  },

  setCurrentProject: (id) => set({ currentProjectId: id }),
}));