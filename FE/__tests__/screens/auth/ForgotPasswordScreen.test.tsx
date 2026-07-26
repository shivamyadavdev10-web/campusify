import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import ForgotPasswordScreen from '../../../src/screens/auth/ForgotPasswordScreen.auth';
import axiosClient from '../../../src/api/axiosClient.api';
import { Alert } from 'react-native';
import PrimaryButton from '../../../src/components/common/PrimaryButton.common';

jest.mock('../../../src/api/axiosClient.api', () => ({
  post: jest.fn(),
}));

jest.spyOn(Alert, 'alert');

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', async () => {
    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(<ForgotPasswordScreen navigation={mockNavigation} />);
    });
    
    expect(root!.root.findByProps({ placeholder: 'Enter your email' })).toBeTruthy();
  });

  it('shows error if email is empty', async () => {
    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(<ForgotPasswordScreen navigation={mockNavigation} />);
    });
    
    await ReactTestRenderer.act(async () => {
      root!.root.findByProps({ title: 'Send OTP' }).props.onPress();
    });
    
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter your email address.');
  });

  it('calls forgot password API and navigates', async () => {
    (axiosClient.post as jest.Mock).mockResolvedValueOnce({
      data: { status: true },
    });

    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(<ForgotPasswordScreen navigation={mockNavigation} />);
    });
    
    await ReactTestRenderer.act(async () => {
      root!.root.findByProps({ placeholder: 'Enter your email' }).props.onChangeText('test@example.com');
    });

    await ReactTestRenderer.act(async () => {
      await root!.root.findByProps({ title: 'Send OTP' }).props.onPress();
    });

    expect(axiosClient.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'test@example.com' });
    expect(mockNavigation.navigate).toHaveBeenCalledWith('ResetPassword', { email: 'test@example.com' });
  });
});
