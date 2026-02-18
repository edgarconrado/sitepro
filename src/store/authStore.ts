/**
 * SitePro — Store de Autenticación (Zustand)
 */

import { create } from 'zustand';
import type { AuthState, LoginCredentials, User } from '@types/index';

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

// Mock user para desarrollo
const MOCK_USER: User = {
  id: '1',
  name: 'Admin',
  email: 'admin@sitepro.com',
  role: 'Gerente de Proyecto',
  initials: 'AM',
  isOnline: true,
  activeTasks: 8,
};

export const useAuthStore = create<AuthStore>((set) => ({
  // Estado inicial
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  // Acciones
  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true });

    // TODO: Reemplazar con llamada real a la API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (credentials.email && credentials.password) {
      set({
        user: MOCK_USER,
        token: 'mock-jwt-token',
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
      throw new Error('Credenciales inválidas');
    }
  },

  logout: () => {
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  setUser: (user: User) => {
    set({ user });
  },
}));
