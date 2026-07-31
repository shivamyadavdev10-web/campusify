import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import '../../global.css';

// Prevent the splash screen from auto-hiding until we've determined auth state.
// FIX: This eliminates the brief flash of the wrong route group during app startup.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { token, isLoading, checkAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    // Auth check complete — safe to hide splash
    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      // Redirect to tabs if authenticated and inside auth group
      router.replace('/(tabs)');
    }
  }, [token, isLoading, segments]);

  // FIX: Show a proper loading screen while auth is being checked
  // instead of briefly rendering the wrong route group
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
