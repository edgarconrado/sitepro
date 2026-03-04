/**
 * tasks — Constantes y datos mock
 */
import type { TaskPriority, TaskStatus } from '@types/index';

export type FilterType = 'Todas' | TaskStatus;

export const FILTERS: { label: string; value: FilterType }[] = [
    { label: 'Todas', value: 'Todas' },
    { label: 'Urgentes', value: 'Urgente' },
    { label: 'En Progreso', value: 'En Progreso' },
    { label: 'Pendientes', value: 'Pendiente' },
    { label: 'Completadas', value: 'Completada' },
];

export const TEAM_OPTIONS = [
    { id: '2', name: 'Juan Pérez', initials: 'JP', role: 'Electricista' },
    { id: '3', name: 'María García', initials: 'MG', role: 'Plomero' },
    { id: '4', name: 'Carlos Ruiz', initials: 'CR', role: 'Inspector' },
    { id: '5', name: 'Ana López', initials: 'AL', role: 'Acabados' },
    { id: '6', name: 'Roberto Díaz', initials: 'RD', role: 'Arquitecto' },
    { id: '7', name: 'Laura Morales', initials: 'LM', role: 'Ingeniero' },
];

export const PRIORITY_OPTIONS: { label: string; value: TaskPriority }[] = [
    { label: 'Alta', value: 'Alta' },
    { label: 'Media', value: 'Media' },
    { label: 'Baja', value: 'Baja' },
];

export const STATUS_OPTIONS: { label: string; value: TaskStatus }[] = [
    { label: 'Urgente', value: 'Urgente' },
    { label: 'En Progreso', value: 'En Progreso' },
    { label: 'Pendiente', value: 'Pendiente' },
];

export const LOCATION_OPTIONS = [
    'Piso 1', 'Piso 2', 'Piso 3', 'Piso 4', 'Piso 5',
    'Piso 6', 'Piso 7', 'Piso 8', 'Piso 9', 'Piso 10',
    'Sótano', 'Planta Baja', 'Azotea', 'Fachada Norte',
    'Fachada Sur', 'Cuarto de Máquinas', 'Lobby',
];

export interface TaskFormValues {
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    assignedTo: typeof TEAM_OPTIONS[0] | null;
    location: string;
    deadline: string;
}

export interface TaskFormErrors {
    title?: string;
    description?: string;
    assignedTo?: string;
    location?: string;
    deadline?: string;
}

export const EMPTY_FORM: TaskFormValues = {
    title: '',
    description: '',
    priority: 'Media',
    status: 'Pendiente',
    assignedTo: null,
    location: '',
    deadline: '',
};