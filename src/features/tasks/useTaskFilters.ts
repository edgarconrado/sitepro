/**
 * tasks — useTaskFilters hook
 * Encapsula el filtrado y búsqueda de tareas
 */
import { useAppStore } from '@store/appStore';
import type { TaskStatus } from '@types/index';
import { useMemo, useState } from 'react';
import { FILTERS, type FilterType } from './constants';

export function useTaskFilters() {
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('Todas');
    const { tasks, currentProjectId } = useAppStore();

    const projectTasks = useMemo(
        () => tasks.filter(t => t.projectId === currentProjectId),
        [tasks, currentProjectId],
    );

    const counts = useMemo(() => ({
        Todas: projectTasks.length,
        Urgente: projectTasks.filter(t => t.status === 'Urgente').length,
        'En Progreso': projectTasks.filter(t => t.status === 'En Progreso').length,
        Pendiente: projectTasks.filter(t => t.status === 'Pendiente').length,
        Completada: projectTasks.filter(t => t.status === 'Completada').length,
    }), [projectTasks]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return projectTasks
            .filter(t => activeFilter === 'Todas' || t.status === activeFilter)
            .filter(t =>
                q === '' ||
                t.title.toLowerCase().includes(q) ||
                t.assignedTo.name.toLowerCase().includes(q) ||
                t.location.toLowerCase().includes(q)
            );
    }, [projectTasks, activeFilter, search]);

    const filterOptions = FILTERS.map(f => ({
        label: f.label,
        value: f.value,
        count: f.value === 'Todas' ? counts.Todas : counts[f.value as TaskStatus] ?? 0,
    }));

    return { search, setSearch, activeFilter, setActiveFilter, filtered, filterOptions };
}