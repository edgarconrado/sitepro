/**
 * SitePro — Layout del grupo (app)
 */

import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="settings"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="plans"
        options={{ presentation: 'modal', animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="documents"
        options={{ presentation: 'modal', animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="calendar"
        options={{ presentation: 'modal', animation: 'slide_from_right' }}
      />
    </Stack>
  );
}
