/**
 * SitePro — Theme Store
 * Persiste la preferencia de tema con AsyncStorage
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeStore {
  mode:     ThemeMode;
  ready:    boolean;
  setMode:  (mode: ThemeMode) => Promise<void>;
  loadSaved: () => Promise<void>;
}

const STORAGE_KEY = 'sitepro_theme';

export const useThemeStore = create<ThemeStore>((set) => ({
  mode:  'system',
  ready: false,

  loadSaved: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        set({ mode: saved, ready: true });
      } else {
        set({ ready: true });
      }
    } catch {
      set({ ready: true });
    }
  },

  setMode: async (mode) => {
    set({ mode });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch {}
  },
}));
