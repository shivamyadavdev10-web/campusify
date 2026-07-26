import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import RegisterScreen from '../../../src/screens/auth/RegisterScreen.auth';
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

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', async () => {
    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(<RegisterScreen navigation={mockNavigation} />);
    });
    
    expect(root!.root.findByProps({ placeholder: 'First Name' })).toBeTruthy();
    expect(root!.root.findByProps({ placeholder: 'Last Name' })).toBeTruthy();
    expect(root!.root.findByProps({ placeholder: 'Email Address' })).toBeTruthy();
  });

  it('shows validation error if fields are empty or invalid', async () => {
    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(<RegisterScreen navigation={mockNavigation} />);
    });
    
    await ReactTestRenderer.act(async () => {
      root!.root.findByProps({ title: 'Sign Up' }).props.onPress();
    });
    
    expect(Alert.alert).toHaveBeenCalledWith('Validation Error', 'Please fix the errors in the form.');
  });

  it('calls register API on valid submit and navigates to OTP', async () => {
    (axiosClient.post as jest.Mock).mockResolvedValueOnce({
      data: { status: true },
    });

    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(<RegisterScreen navigation={mockNavigation} />);
    });
    
    await ReactTestRenderer.act(async () => {
      root!.root.findByProps({ placeholder: 'First Name' }).props.onChangeText('John');
      root!.root.findByProps({ placeholder: 'Last Name' }).props.onChangeText('Doe');
      root!.root.findByProps({ placeholder: 'Phone Number' }).props.onChangeText('1234567890');
      root!.root.findByProps({ placeholder: 'Email Address' }).props.onChangeText('test@example.com');
      root!.root.findByProps({ placeholder: 'Password' }).props.onChangeText('Password@123');
      root!.root.findByProps({ placeholder: 'Confirm Password' }).props.onChangeText('Password@123');
    });

    await ReactTestRenderer.act(async () => {
      await root!.root.findByProps({ title: 'Sign Up' }).props.onPress();
    });

    expect(axiosClient.post).toHaveBeenCalledWith('/auth/register', expect.objectContaining({
      email: 'test@example.com',
      firstName: 'John',
    }));
    expect(Alert.alert).toHaveBeenCalledWith('Success', 'Registration successful. Please verify your OTP.');
    expect(mockNavigation.navigate).toHaveBeenCalledWith('OtpVerification', { email: 'test@example.com' });
  });
});
