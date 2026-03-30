/**
 * SitePro — Root Layout
 */

import { ConfirmDialogContainer } from '@components/ui/ConfirmDialog';
import { SyncBar } from '@components/ui/SyncManager';
import { ToastContainer } from '@components/ui/Toast';
import { useAuthStore } from '@store/authStore';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { loadSession } = useAuthStore();

  useEffect(() => {
    loadSession().finally(() => SplashScreen.hideAsync());
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="(modals)" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
        <ToastContainer />
        <ConfirmDialogContainer />
        <SyncBar />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
