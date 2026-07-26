import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import { useAuthStore } from '../src/store/useAuthStore';
import { QueryClientProvider } from '@tanstack/react-query';

// Mock navigation
jest.mock('@react-navigation/native', () => {
  return {
    ...jest.requireActual('@react-navigation/native'),
    NavigationContainer: ({ children }: any) => <>{children}</>,
  };
});

jest.mock('../src/navigation/AppNavigator.navigation', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return () => <View testID="AppNavigator"><Text>AppNavigator</Text></View>;
});

describe('App Initialization & Setup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('boots up without crashing and wraps with Providers', async () => {
    const bootstrapAsyncSpy = jest.spyOn(useAuthStore.getState(), 'bootstrapAsync');
    
    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(<App />);
    });
    
    // App renders correctly without crashing
    expect(root!.root.findByProps({ testID: 'AppNavigator' })).toBeTruthy();
    
    // Zustand store bootstrapAsync is called
    expect(bootstrapAsyncSpy).toHaveBeenCalledTimes(1);

    // Check if QueryClientProvider is present
    const queryClientProvider = root!.root.findByType(QueryClientProvider);
    expect(queryClientProvider).toBeTruthy();
    
    // Check if QueryClient is configured properly
    const queryClient = queryClientProvider.props.client;
    const defaultOptions = queryClient.getDefaultOptions();
    expect(defaultOptions?.queries?.staleTime).toBe(1000 * 60 * 5); // 5 minutes
    expect(defaultOptions?.queries?.retry).toBe(2);
  });
});

