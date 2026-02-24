/**
 * SitePro — Root Layout
 * Punto de entrada de Expo Router
 */

import { ConfirmDialogContainer } from '@components/ui/ConfirmDialog';
import { SyncBar } from '@components/ui/SyncManager';
import { ToastContainer } from '@components/ui/Toast';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Mantener splash visible hasta que todo esté listo
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Cuando la app esté lista, ocultar splash nativo
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          {/* Pantalla splash/inicio de la app */}
          <Stack.Screen name="index" />
          {/* Grupo de autenticación */}
          <Stack.Screen name="(auth)" />
          {/* Grupo principal de la app */}
          <Stack.Screen name="(app)" />
          {/* Modales globales */}
          <Stack.Screen name="(modals)" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
        <ToastContainer />
        <ConfirmDialogContainer />
        <SyncBar />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});