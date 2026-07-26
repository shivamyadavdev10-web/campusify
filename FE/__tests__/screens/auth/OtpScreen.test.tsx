import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import OtpScreen from '../../../src/screens/auth/OtpScreen.auth';
import axiosClient from '../../../src/api/axiosClient.api';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { Alert, TouchableOpacity } from 'react-native';
import PrimaryButton from '../../../src/components/common/PrimaryButton.common';

jest.mock('../../../src/api/axiosClient.api', () => ({
  post: jest.fn(),
}));

jest.spyOn(Alert, 'alert');
jest.useFakeTimers();

const mockNavigation = {
  navigate: jest.fn(),
};

const mockRoute = {
  params: { email: 'test@example.com' },
};

describe('OtpScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', async () => {
    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(<OtpScreen navigation={mockNavigation} route={mockRoute} />);
    });
    
    expect(root!.root.findByProps({ placeholder: '000000' })).toBeTruthy();
  });

  it('shows error if OTP is invalid length', async () => {
    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(<OtpScreen navigation={mockNavigation} route={mockRoute} />);
    });
    
    await ReactTestRenderer.act(async () => {
      root!.root.findByProps({ placeholder: '000000' }).props.onChangeText('123');
    });

    await ReactTestRenderer.act(async () => {
      await root!.root.findByProps({ title: 'Verify OTP' }).props.onPress();
    });
    
    expect(Alert.alert).toHaveBeenCalledWith('Invalid OTP', 'Please enter a 6-digit OTP.');
  });

  it('calls verifyOtpAndLogin on valid submit', async () => {
    const verifySpy = jest.spyOn(useAuthStore.getState(), 'verifyOtpAndLogin').mockResolvedValueOnce({ success: true, message: '' });

    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(<OtpScreen navigation={mockNavigation} route={mockRoute} />);
    });
    
    await ReactTestRenderer.act(async () => {
      root!.root.findByProps({ placeholder: '000000' }).props.onChangeText('123456');
    });

    await ReactTestRenderer.act(async () => {
      await root!.root.findByProps({ title: 'Verify OTP' }).props.onPress();
    });

    expect(verifySpy).toHaveBeenCalledWith('test@example.com', '123456');
    expect(Alert.alert).toHaveBeenCalledWith('Verified', 'Account verified successfully!');
  });

  it('handles resend OTP functionality', async () => {
    (axiosClient.post as jest.Mock).mockResolvedValueOnce({
      data: { status: true },
    });

    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(<OtpScreen navigation={mockNavigation} route={mockRoute} />);
    });
    
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(60000);
    });
    
    await ReactTestRenderer.act(async () => {
      // Find the touchable opacity with handleResend by looking for disabled=false
      const touchables = root!.root.findAllByType(TouchableOpacity as any);
      await touchables[touchables.length - 1].props.onPress(); // Assuming it's the last one
    });

    expect(axiosClient.post).toHaveBeenCalledWith('/auth/resend-otp', { email: 'test@example.com' });
    expect(Alert.alert).toHaveBeenCalledWith('Success', 'A new OTP has been sent.');
  });
});
