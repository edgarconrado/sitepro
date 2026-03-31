/**
 * tasks — useTaskForm hook (conectado a Supabase via tasksStore)
 */
import { useProjectsStore } from '@store/projectsStore';
import {
    PRIORITY_UI_TO_DB,
    STATUS_UI_TO_DB,
    useTasksStore,
} from '@store/tasksStore';
import { useCallback, useState } from 'react';
import { EMPTY_FORM, type TaskFormErrors, type TaskFormValues } from './constants';

export function useTaskForm(onSuccess: () => void) {
    // Leer currentProjectId fresco en el momento del submit, no como closure
    const getProjectId = () => useProjectsStore.getState().currentProjectId;
    const { createTask } = useTasksStore();

    const [values, setValues] = useState<TaskFormValues>(EMPTY_FORM);
    const [errors, setErrors] = useState<TaskFormErrors>({});
    const [saving, setSaving] = useState(false);

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
        if (!values.location) e.location = 'Selecciona una ubicación';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const submit = useCallback(async () => {
        if (!validate()) return;
        const currentProjectId = getProjectId();
        if (!currentProjectId) {
            console.error('[useTaskForm] currentProjectId is null - no active project');
            throw new Error('No hay un proyecto activo. Selecciona un proyecto primero.');
        }

        setSaving(true);
        try {
            // Convertir fecha dd/mm/aaaa → aaaa-mm-dd
            let due_date: string | null = null;
            if (values.deadline.length === 10) {
                const [day, month, year] = values.deadline.split('/');
                due_date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }

            await createTask({
                project_id: currentProjectId,
                title: values.title.trim(),
                description: values.description.trim() || null,
                status: STATUS_UI_TO_DB[values.status] ?? 'pending',
                priority: PRIORITY_UI_TO_DB[values.priority] ?? 'medium',
                assigned_to: values.assignedTo?.id || null,
                location: values.location || null,
                due_date,
            });

            onSuccess();
            reset();
        } catch (err: any) {
            throw err;
        } finally {
            setSaving(false);
        }
    }, [values, createTask, onSuccess]);

    const reset = useCallback(() => {
        setValues(EMPTY_FORM);
        setErrors({});
    }, []);

    return { values, errors, setField, formatDeadline, submit, reset, saving };
}