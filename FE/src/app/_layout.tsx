import { useEffect } from 'react';
import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { Audio } from 'expo-av';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '@/src/core/api/queryClient';
import { useAuthStore } from '@/src/core/stores/auth.store';
import { View, ActivityIndicator, BackHandler, Alert, Platform } from 'react-native';
import ToastRenderer from '@/src/components/ui/ToastRenderer';
import { useNetInfo } from '@react-native-community/netinfo';
import * as Sentry from '@sentry/react-native';
import '../../global.css';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  tracesSampleRate: 1.0,
});

// Export ErrorBoundary to catch rendering errors globally
export { ErrorBoundary } from 'expo-router';

// Prevent the splash screen from auto-hiding until we've determined auth state.
SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const { token, isLoading, checkAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const netInfo = useNetInfo();
  const isOffline = netInfo.type !== 'unknown' && netInfo.isInternetReachable === false;

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    }).catch(() => {});
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

  // Android back button — show exit confirmation on home screen
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      // Only show exit popup when on the main tabs (home screen)
      const inTabs = segments[0] === '(tabs)';
      if (inTabs) {
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
          ]
        );
        return true; // Prevent default back behavior
      }
      return false; // Let default back behavior happen (go back)
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [segments]);

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
        {isOffline && (
          <View style={{ backgroundColor: '#ef4444', padding: 10, alignItems: 'center', justifyContent: 'center', position: 'absolute', bottom: 80, left: 20, right: 20, borderRadius: 12, zIndex: 9999, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>⚠️ No Internet Connection</Text>
          </View>
        )}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);
