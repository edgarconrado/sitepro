/**
 * SitePro — Store de Autenticación con Supabase
 */

import { supabase } from '@lib/supabase';
import { create } from 'zustand';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  job_title: string | null;
  avatar_url: string | null;
}

interface AuthStore {
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  loadSession: () => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  loadSession: async () => {
    const timer = setTimeout(() => {
      set({ isLoading: false, isAuthenticated: false });
    }, 5000);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, job_title, avatar_url')
        .eq('id', session.user.id)
        .single();

      set({
        user: profile ?? null,
        isAuthenticated: !!profile,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false, isAuthenticated: false });
    } finally {
      clearTimeout(timer);
    }
  },

  login: async ({ email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('No se pudo iniciar sesión');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, job_title, avatar_url')
        .eq('id', data.user.id)
        .single();

      set({
        user: profile ?? null,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      const msg = err?.message ?? 'Error desconocido';
      set({
        isLoading: false,
        error: msg.includes('Invalid login credentials')
          ? 'Correo o contraseña incorrectos'
          : msg,
      });
      throw err;
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, error: null });
  },
}));
