/**
 * tasks — TaskStatusIcon
 * Ícono por estado de tarea
 */
import { useTheme } from '@hooks/useTheme';
import { iconSize } from '@theme/tokens';
import type { TaskStatus } from '@types/index';
import { getTaskStatusColors } from '@utils/index';
import { AlertCircle, CheckCircle2, Circle, Clock } from 'lucide-react-native';
import React from 'react';

interface Props {
    status: TaskStatus;
    size?: number;
}

export function TaskStatusIcon({ status, size = iconSize.md }: Props) {
    const { colors } = useTheme();
    const sc = getTaskStatusColors(status, colors);

    switch (status) {
        case 'Urgente': return <AlertCircle size={size} color={sc.icon} />;
        case 'En Progreso': return <Clock size={size} color={sc.icon} />;
        case 'Pendiente': return <Circle size={size} color={sc.icon} />;
        case 'Completada': return <CheckCircle2 size={size} color={sc.icon} />;
    }
}