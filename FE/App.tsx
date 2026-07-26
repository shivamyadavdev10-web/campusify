import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthStore } from './src/store/useAuthStore'; 
import AppNavigator from './src/navigation/AppNavigator.navigation';

// React Query imports
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 2. QueryClient banaiye (Caching rules ke sath)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes tak API ka data RAM me cache rahega (Instant load)
      retry: 2, // Agar thoda network issue hua toh 2 baar auto-retry karega
    },
  },
});

export default function App() {
  useEffect(() => {
    useAuthStore.getState().bootstrapAsync();
  }, []);

  return (
    <SafeAreaProvider>
      {/* 3. React Query Provider se poore app ko wrap kijiye */}
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}