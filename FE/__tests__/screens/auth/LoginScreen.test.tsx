import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import LoginScreen from '../../../src/screens/auth/LoginScreen.auth';
import axiosClient from '../../../src/api/axiosClient.api';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { Alert, TextInput } from 'react-native';
import PrimaryButton from '../../../src/components/common/PrimaryButton.common';

jest.mock('../../../src/api/axiosClient.api', () => ({
  post: jest.fn(),
}));

jest.spyOn(Alert, 'alert');

const mockNavigation = {
  navigate: jest.fn(),
};

describe('LoginScreen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await ReactTestRenderer.act(async () => {
      useAuthStore.setState({ userToken: null, isLoading: false });
    });
  });

  it('renders correctly', async () => {
    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(<LoginScreen navigation={mockNavigation} />);
    });
    
    expect(root!.root.findByProps({ placeholder: 'Email Address' })).toBeTruthy();
    expect(root!.root.findByProps({ placeholder: 'Password' })).toBeTruthy();
  });

  it('shows alert if fields are empty', async () => {
    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(<LoginScreen navigation={mockNavigation} />);
    });
    
    await ReactTestRenderer.act(async () => {
      root!.root.findByProps({ title: 'Login' }).props.onPress();
    });
    
    expect(Alert.alert).toHaveBeenCalledWith('Validation Error', 'Please fill in all fields.');
  });

  it('calls login API on valid submit', async () => {
    (axiosClient.post as jest.Mock).mockResolvedValueOnce({
      data: { status: true, accessToken: 'access', refreshToken: 'refresh' },
    });

    const loginSpy = jest.spyOn(useAuthStore.getState(), 'login').mockResolvedValueOnce(undefined);

    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(<LoginScreen navigation={mockNavigation} />);
    });
    
    await ReactTestRenderer.act(async () => {
      root!.root.findByProps({ placeholder: 'Email Address' }).props.onChangeText('test@example.com');
      root!.root.findByProps({ placeholder: 'Password' }).props.onChangeText('password123');
    });

    await ReactTestRenderer.act(async () => {
      await root!.root.findByProps({ title: 'Login' }).props.onPress();
    });

    expect(axiosClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password123',
      deviceId: 'unique-id',
    });
    expect(loginSpy).toHaveBeenCalledWith('access', 'refresh');
  });

  it('handles 403 not verified error and redirects to OTP', async () => {
    (axiosClient.post as jest.Mock).mockRejectedValueOnce({
      response: { status: 403, data: { isVerified: false, message: 'Not verified' } },
    });

    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(<LoginScreen navigation={mockNavigation} />);
    });
    
    await ReactTestRenderer.act(async () => {
      root!.root.findByProps({ placeholder: 'Email Address' }).props.onChangeText('test@example.com');
      root!.root.findByProps({ placeholder: 'Password' }).props.onChangeText('password123');
    });

    await ReactTestRenderer.act(async () => {
      await root!.root.findByProps({ title: 'Login' }).props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith('Not Verified', 'Not verified');
    expect(mockNavigation.navigate).toHaveBeenCalledWith('OtpVerification', { email: 'test@example.com' });
  });
});
