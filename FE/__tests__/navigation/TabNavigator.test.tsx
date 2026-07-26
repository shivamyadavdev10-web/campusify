import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import TabNavigator from '../../src/navigation/TabNavigator.navigation';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('@react-navigation/bottom-tabs', () => {
  return {
    createBottomTabNavigator: jest.fn(() => ({
      Navigator: ({ children }: any) => <>{children}</>,
      Screen: ({ component: Component }: any) => <Component />
    })),
  };
});

// Mock screens
jest.mock('../../src/screens/tabs/HomeScreen.tabs', () => {
  const { View } = require('react-native');
  return () => <View testID="HomeScreen" />;
});
jest.mock('../../src/screens/tabs/MyCoursesScreen.tabs', () => () => null);
jest.mock('../../src/screens/tabs/ProfileScreen.tabs', () => () => null);
jest.mock('../../src/screens/tabs/DownloadsScreen.tabs', () => () => null);

// Mock lucide icons
jest.mock('lucide-react-native', () => ({
  Home: () => null,
  BookOpen: () => null,
  User: () => null,
  Download: () => null,
}));

describe('TabNavigator', () => {
  it('renders correctly and defaults to HomeTab screen', async () => {
    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      );
    });

    expect(root!.root.findByProps({ testID: 'HomeScreen' })).toBeTruthy();
  });
});
