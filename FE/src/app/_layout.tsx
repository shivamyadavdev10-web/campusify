import { useEffect } from 'react';
import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '@/src/core/api/queryClient';
import { useAuthStore } from '@/src/core/stores/auth.store';
import { View, ActivityIndicator } from 'react-native';
import ToastRenderer from '@/src/components/ui/ToastRenderer';
import '../../global.css';

// Export ErrorBoundary to catch rendering errors globally
export { ErrorBoundary } from 'expo-router';

// Prevent the splash screen from auto-hiding until we've determined auth state.
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
    SplashScreen.hideAsync().catch(() => {});

    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [token, isLoading, segments]);

  // Show a proper loading screen while auth is being checked
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 items-center justify-center bg-background">
          <ActivityIndicator size="large" color="#004ac6" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f8f9ff' } }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="change-password"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="semesters/[branchId]"
            options={{
              headerShown: true,
              title: 'Semesters',
              headerStyle: { backgroundColor: '#f8f9ff' },
              headerTintColor: '#004ac6',
              headerTitleStyle: { color: '#0b1c30' },
            }}
          />
          <Stack.Screen
            name="subjects/[semesterId]"
            options={{
              headerShown: true,
              title: 'Subjects',
              headerStyle: { backgroundColor: '#f8f9ff' },
              headerTintColor: '#004ac6',
              headerTitleStyle: { color: '#0b1c30' },
            }}
          />
          <Stack.Screen
            name="course/[subjectId]"
            options={{
              headerShown: true,
              title: 'Course Content',
              headerStyle: { backgroundColor: '#f8f9ff' },
              headerTintColor: '#004ac6',
              headerTitleStyle: { color: '#0b1c30' },
            }}
          />
          <Stack.Screen
            name="trending"
            options={{
              headerShown: true,
              title: 'Trending Courses',
              headerStyle: { backgroundColor: '#f8f9ff' },
              headerTintColor: '#004ac6',
              headerTitleStyle: { color: '#0b1c30' },
            }}
          />
          <Stack.Screen
            name="demo-lectures"
            options={{
              headerShown: true,
              title: 'Demo Lectures',
              headerStyle: { backgroundColor: '#f8f9ff' },
              headerTintColor: '#004ac6',
              headerTitleStyle: { color: '#0b1c30' },
            }}
          />
        </Stack>

        {/* Global Toast Notification — rendered above everything */}
        <ToastRenderer />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
