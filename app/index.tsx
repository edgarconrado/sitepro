/**
 * SitePro — Ruta Raíz
 * Redirige según estado de autenticación
 */

import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@store/authStore';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Redirige automáticamente:
  // - Si autenticado → app principal (tabs)
  // - Si no → flujo de auth (splash → onboarding → login)
  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)/home" />;
  }

  return <Redirect href="/(auth)/splash" />;
}
