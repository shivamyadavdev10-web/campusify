import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/src/core/stores/auth.store';
import { useUIStore } from '@/src/core/stores/ui.store';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { isValidPassword } from '@/src/utils/validators.utils';

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();
  const { resetPassword } = useAuthStore();
  const { showToast } = useUIStore();

  const handleReset = async () => {
    if (otp.length < 6) {
      showToast('Please enter a valid 6-digit OTP', 'error'); return;
    }
    if (!isValidPassword(newPassword)) {
      showToast('Password must be at least 6 characters', 'error'); return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('Passwords do not match', 'error'); return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({ email: email || '', otp, newPassword, confirmNewPassword });
      showToast('Password reset successfully. You can now login.', 'success');
      router.replace('/(auth)/login');
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to reset password', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-background px-6 pt-12">
      <View className="mb-10 mt-10">
        <Text className="text-3xl font-bold text-on-surface mb-2">Reset Password</Text>
        <Text className="text-on-surface-variant">Create a new password for your account</Text>
      </View>

      <View className="space-y-4 mb-8">
        <Input
          placeholder="6-digit OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />
        <Input
          placeholder="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <Input
          placeholder="Confirm New Password"
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
          secureTextEntry
        />
      </View>

      <Button title="Reset Password" onPress={handleReset} isLoading={isSubmitting} />
    </View>
  );
}
