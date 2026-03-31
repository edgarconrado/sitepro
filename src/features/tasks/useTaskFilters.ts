/**
 * tasks — useTaskFilters hook (conectado a Supabase via tasksStore)
 */
import { useProjectsStore } from '@store/projectsStore';
import { STATUS_DB_TO_UI, useTasksStore } from '@store/tasksStore';
import { useEffect, useMemo, useState } from 'react';
import { FILTERS, type FilterType } from './constants';

export function useTaskFilters() {
    const [search, setSearch]           = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('Todas');

    const { currentProjectId } = useProjectsStore();
    const { tasks, loadTasks, isLoading } = useTasksStore();

    // Cargar tareas cuando cambia el proyecto activo
    useEffect(() => {
        if (currentProjectId) loadTasks(currentProjectId);
    }, [currentProjectId]);

    const counts = useMemo(() => ({
        Todas:       tasks.length,
        Urgente:     tasks.filter(t => t.status === 'urgent').length,
        'En Progreso': tasks.filter(t => t.status === 'in_progress').length,
        Pendiente:   tasks.filter(t => t.status === 'pending').length,
        Completada:  tasks.filter(t => t.status === 'completed').length,
    }), [tasks]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return tasks
            .filter(t => {
                if (activeFilter === 'Todas') return true;
                return STATUS_DB_TO_UI[t.status] === activeFilter;
            })
            .filter(t =>
                q === '' ||
                t.title.toLowerCase().includes(q) ||
                (t.assignee?.full_name ?? '').toLowerCase().includes(q) ||
                (t.location ?? '').toLowerCase().includes(q)
            );
    }, [tasks, activeFilter, search]);

    const filterOptions = FILTERS.map(f => ({
        label: f.label,
        value: f.value,
        count: counts[f.value] ?? 0,
    }));

    return { search, setSearch, activeFilter, setActiveFilter, filtered, filterOptions, isLoading };
}
