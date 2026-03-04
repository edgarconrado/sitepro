/**
 * tasks — useTaskForm hook
 * Encapsula toda la lógica de estado y validación del formulario
 */
import { useAppStore } from '@store/appStore';
import type { Task } from '@types/index';
import { useCallback, useState } from 'react';
import {
    EMPTY_FORM,
    type TaskFormErrors,
    type TaskFormValues
} from './constants';

export function useTaskForm(onSuccess: () => void) {
    const { addTask, currentProjectId } = useAppStore();
    const [values, setValues] = useState<TaskFormValues>(EMPTY_FORM);
    const [errors, setErrors] = useState<TaskFormErrors>({});

    const setField = useCallback(<K extends keyof TaskFormValues>(
        key: K,
        value: TaskFormValues[K],
    ) => {
        setValues(prev => ({ ...prev, [key]: value }));
        if (errors[key as keyof TaskFormErrors]) {
            setErrors(prev => ({ ...prev, [key]: undefined }));
        }
    }, [errors]);

    const formatDeadline = useCallback((text: string) => {
        const digits = text.replace(/\D/g, '').slice(0, 8);
        let formatted = digits;
        if (digits.length > 2) formatted = digits.slice(0, 2) + '/' + digits.slice(2);
        if (digits.length > 4) formatted = formatted.slice(0, 5) + '/' + digits.slice(4);
        setField('deadline', formatted);
    }, [setField]);

    const validate = (): boolean => {
        const e: TaskFormErrors = {};
        if (!values.title.trim()) e.title = 'El título es requerido';
        if (!values.description.trim()) e.description = 'La descripción es requerida';
        if (!values.assignedTo) e.assignedTo = 'Selecciona un responsable';
        if (!values.location) e.location = 'Selecciona una ubicación';
        if (!values.deadline.trim()) {
            e.deadline = 'Ingresa una fecha límite (dd/mm/aaaa)';
        } else {
            const parts = values.deadline.split('/');
            if (parts.length !== 3 || parts.some(p => isNaN(Number(p)))) {
                e.deadline = 'Formato inválido. Usa dd/mm/aaaa';
            }
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const submit = useCallback(() => {
        if (!validate() || !values.assignedTo) return;

        const [day, month, year] = values.deadline.split('/');
        const isoDeadline = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        const newTask: Task = {
            id: Date.now().toString(),
            projectId: currentProjectId,
            title: values.title.trim(),
            description: values.description.trim(),
            status: values.status,
            priority: values.priority,
            location: values.location,
            createdAt: new Date().toISOString(),
            deadline: isoDeadline,
            assignedTo: {
                id: values.assignedTo.id,
                name: values.assignedTo.name,
                email: `${values.assignedTo.name.split(' ')[0].toLowerCase()}@sitepro.com`,
                role: values.assignedTo.role as any,
                initials: values.assignedTo.initials,
                isOnline: true,
                activeTasks: 1,
            },
        };

        addTask(newTask);
        reset();
        onSuccess();
    }, [values, currentProjectId, addTask, onSuccess]);

    const reset = useCallback(() => {
        setValues(EMPTY_FORM);
        setErrors({});
    }, []);

    return { values, errors, setField, formatDeadline, submit, reset };
}