/**
 * SitePro — useMenu hook
 * Maneja el estado del menú lateral de forma compartida
 */

import { create } from 'zustand';

interface MenuStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useMenu = create<MenuStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}));
