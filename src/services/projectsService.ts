/**
 * SitePro — Servicio de Proyectos
 * CRUD completo con Supabase
 */

import { supabase } from '@lib/supabase';
import type { DbProject, InsertTables, UpdateTables } from '@types/supabase';

// ─── Tipos de respuesta ───────────────────────────────────────
export interface ProjectWithStats extends DbProject {
  total_tasks: number;
  completed_tasks: number;
  urgent_tasks: number;
  pending_tasks: number;
  member_count: number;
}

export type CreateProjectInput = InsertTables<'projects'>;
export type UpdateProjectInput = UpdateTables<'projects'>;

// ─── Obtener todos los proyectos del usuario actual ───────────
export async function fetchUserProjects(): Promise<ProjectWithStats[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('No autenticado');

  // Proyectos donde el usuario es miembro
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_members!inner(user_id),
      tasks(status)
    `)
    .eq('project_members.user_id', user.user.id)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  // Calcular estadísticas de tareas
  return (data ?? []).map((project: any) => {
    const tasks: Array<{ status: string }> = project.tasks ?? [];
    const total_tasks = tasks.length;
    const completed_tasks = tasks.filter((t) => t.status === 'completed').length;
    const urgent_tasks = tasks.filter((t) => t.status === 'urgent').length;
    const pending_tasks = tasks.filter((t) => t.status === 'pending').length;
    const member_count = project.project_members?.length ?? 0;

    const { tasks: _, project_members: __, ...projectData } = project;

    return {
      ...projectData,
      total_tasks,
      completed_tasks,
      urgent_tasks,
      pending_tasks,
      member_count,
    } as ProjectWithStats;
  });
}

// ─── Obtener un proyecto por ID ───────────────────────────────
export async function fetchProjectById(projectId: string): Promise<ProjectWithStats> {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_members(user_id, role),
      tasks(status, priority)
    `)
    .eq('id', projectId)
    .single();

  if (error) throw error;

  const tasks: Array<{ status: string; priority: string }> = data.tasks ?? [];
  const total_tasks = tasks.length;
  const completed_tasks = tasks.filter((t) => t.status === 'completed').length;
  const urgent_tasks = tasks.filter((t) => t.status === 'urgent').length;
  const pending_tasks = tasks.filter((t) => t.status === 'pending').length;
  const member_count = data.project_members?.length ?? 0;

  const { tasks: _, project_members: __, ...projectData } = data as any;

  return {
    ...projectData,
    total_tasks,
    completed_tasks,
    urgent_tasks,
    pending_tasks,
    member_count,
  } as ProjectWithStats;
}

// ─── Crear proyecto ───────────────────────────────────────────
export async function createProject(
  input: Omit<CreateProjectInput, 'created_by'>
): Promise<DbProject> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('No autenticado');

  // Crear el proyecto
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({ ...input, created_by: user.user.id })
    .select()
    .single();

  if (projectError) throw projectError;

  // Agregar al creador como miembro admin
  const { error: memberError } = await supabase.from('project_members').insert({
    project_id: project.id,
    user_id: user.user.id,
    role: 'admin',
  });

  if (memberError) throw memberError;

  return project;
}

// ─── Actualizar proyecto ──────────────────────────────────────
export async function updateProject(
  projectId: string,
  updates: UpdateProjectInput
): Promise<DbProject> {
  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Eliminar proyecto ────────────────────────────────────────
export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) throw error;
}

// ─── Obtener miembros del proyecto ───────────────────────────
export async function fetchProjectMembers(projectId: string) {
  const { data, error } = await supabase
    .from('project_members')
    .select(`
      *,
      profiles(id, full_name, email, avatar_url, role, job_title, is_online)
    `)
    .eq('project_id', projectId);

  if (error) throw error;
  return data ?? [];
}

// ─── Suscripción en tiempo real ───────────────────────────────
export function subscribeToProjects(
  userId: string,
  onUpdate: () => void
) {
  return supabase
    .channel('projects_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'projects',
      },
      onUpdate
    )
    .subscribe();
}

// ─── Mapa de estados (BD → UI) ────────────────────────────────
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
