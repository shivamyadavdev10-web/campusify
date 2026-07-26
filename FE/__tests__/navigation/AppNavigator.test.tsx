import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AppNavigator from '../../src/navigation/AppNavigator.navigation';
import { useAuthStore } from '../../src/store/useAuthStore';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('@react-navigation/native-stack', () => {
  return {
    createNativeStackNavigator: jest.fn(() => ({
      Navigator: ({ children }: any) => <>{children}</>,
      Screen: ({ component: Component }: any) => <Component />
    })),
  };
});

jest.mock('../../src/navigation/AuthNavigator.navigation', () => {
  const { View } = require('react-native');
  return () => <View testID="AuthNavigator" />;
});

jest.mock('../../src/navigation/TabNavigator.navigation', () => {
  const { View } = require('react-native');
  return () => <View testID="TabNavigator" />;
});

// Mock players to avoid native dependencies issues in tests
jest.mock('../../src/screens/player/PdfViewerScreen.player', () => () => null);
jest.mock('../../src/screens/player/VideoPlayerScreen.player', () => () => null);
jest.mock('../../src/navigation/CourseStack.navigation', () => () => null);

describe('AppNavigator (Protected Routes)', () => {
  it('renders AuthNavigator when userToken is null', async () => {
    await ReactTestRenderer.act(async () => {
      useAuthStore.setState({ isLoading: false, userToken: null });
    });
    
    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );
    });

    expect(root!.root.findByProps({ testID: 'AuthNavigator' })).toBeTruthy();
    expect(() => root!.root.findByProps({ testID: 'TabNavigator' })).toThrow();
  });

  it('renders MainTabs when userToken is set (Protected Route)', async () => {
    await ReactTestRenderer.act(async () => {
      useAuthStore.setState({ isLoading: false, userToken: 'some-token' });
    });
    
    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );
    });

    expect(root!.root.findByProps({ testID: 'TabNavigator' })).toBeTruthy();
    expect(() => root!.root.findByProps({ testID: 'AuthNavigator' })).toThrow();
  });
});
