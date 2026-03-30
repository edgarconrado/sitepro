/**
 * SitePro — Ruta Raíz
 */

import { useAuthStore } from '@store/authStore';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#141414' }}>
        <ActivityIndicator size="large" color="#EAAB00" />
      </View>
    );
  }

  if (isAuthenticated) return <Redirect href="/(app)/(tabs)/home" />;
  return <Redirect href="/(auth)/splash" />;
}
