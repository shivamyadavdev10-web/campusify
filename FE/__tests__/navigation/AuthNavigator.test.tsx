import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AuthNavigator from '../../src/navigation/AuthNavigator.navigation';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('@react-navigation/native-stack', () => {
  return {
    createNativeStackNavigator: jest.fn(() => ({
      Navigator: ({ children }: any) => <>{children}</>,
      Screen: ({ component: Component }: any) => <Component />
    })),
  };
});

// Mock screens
jest.mock('../../src/screens/auth/LoginScreen.auth', () => {
  const { View } = require('react-native');
  return () => <View testID="LoginScreen" />;
});
jest.mock('../../src/screens/auth/RegisterScreen.auth', () => () => null);
jest.mock('../../src/screens/auth/OtpScreen.auth', () => () => null);
jest.mock('../../src/screens/auth/ForgotPasswordScreen.auth', () => () => null);
jest.mock('../../src/screens/auth/ResetPasswordScreen.auth', () => () => null);

describe('AuthNavigator', () => {
  it('renders correctly and defaults to Login screen', async () => {
    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(
        <NavigationContainer>
          <AuthNavigator />
        </NavigationContainer>
      );
    });

    expect(root!.root.findByProps({ testID: 'LoginScreen' })).toBeTruthy();
  });
});
