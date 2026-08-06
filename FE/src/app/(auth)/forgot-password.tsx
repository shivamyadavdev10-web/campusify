import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/core/stores/auth.store';
import { useUIStore } from '@/src/core/stores/ui.store';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { isValidEmail } from '@/src/utils/validators.utils';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { forgotPassword } = useAuthStore();
  const { showToast } = useUIStore();

  const handleRequestOTP = async () => {
    if (!isValidEmail(email)) {
      showToast('Please enter a valid email', 'error'); return;
    }
    setIsSubmitting(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      showToast('OTP sent to your email', 'success');
      router.push({ pathname: '/(auth)/reset-password', params: { email } });
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to send OTP', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-background px-6 pt-12">
      <View className="mb-10 mt-10">
        <Text className="text-3xl font-bold text-on-surface mb-2">Forgot Password</Text>
        <Text className="text-on-surface-variant">Enter your email to receive a reset code</Text>
      </View>

      <View className="mb-8">
        <Input
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <Button title="Send Reset Code" onPress={handleRequestOTP} isLoading={isSubmitting} />

      <TouchableOpacity className="mt-8 self-center" onPress={() => router.back()}>
        <Text className="text-on-surface-variant">Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}
