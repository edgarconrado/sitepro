/**
 * SitePro — Store de Notificaciones (Supabase + Realtime)
 */

import { supabase } from '@lib/supabase';
import { create } from 'zustand';

export interface DbNotification {
    id: string;
    user_id: string;
    type: 'task_assigned' | 'task_completed' | 'task_updated' | 'message_received'
    | 'deadline_approaching' | 'photo_uploaded' | 'comment_added' | 'system';
    title: string;
    description: string | null;
    is_read: boolean;
    resource_type: string | null;
    resource_id: string | null;
    created_at: string;
}

// Mapeo tipo DB → UI
export const NOTIF_TYPE_UI: Record<string, string> = {
    task_assigned: 'task',
    task_completed: 'task',
    task_updated: 'task',
    message_received: 'message',
    deadline_approaching: 'system',
    photo_uploaded: 'photo',
    comment_added: 'task',
    system: 'system',
};

interface NotificationsStore {
    notifications: DbNotification[];
    unreadCount: number;
    isLoading: boolean;
    _realtimeSub: any;

    loadNotifications: () => Promise<void>;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
    startRealtime: () => void;
    stopRealtime: () => void;
}

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    _realtimeSub: null,

    loadNotifications: async () => {
        set({ isLoading: true });
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { set({ isLoading: false }); return; }

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) { console.error('[notifications] fetch:', error.message); set({ isLoading: false }); return; }

        const notifications = data ?? [];
        set({
            notifications,
            unreadCount: notifications.filter(n => !n.is_read).length,
            isLoading: false,
        });
    },

    markRead: async (id) => {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        set(state => {
            const notifications = state.notifications.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            );
            return { notifications, unreadCount: notifications.filter(n => !n.is_read).length };
        });
    },

    markAllRead: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);
        set(state => ({
            notifications: state.notifications.map(n => ({ ...n, is_read: true })),
            unreadCount: 0,
        }));
    },

    // Suscripción en tiempo real para notificaciones nuevas
    startRealtime: () => {
        const sub = supabase
            .channel('notifications_realtime')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
            }, (payload) => {
                const newNotif = payload.new as DbNotification;
                set(state => ({
                    notifications: [newNotif, ...state.notifications],
                    unreadCount: state.unreadCount + 1,
                }));
            })
            .subscribe();
        set({ _realtimeSub: sub });
    },

    stopRealtime: () => {
        const { _realtimeSub } = get();
        if (_realtimeSub) {
            _realtimeSub.unsubscribe();
            set({ _realtimeSub: null });
        }
    },
}));