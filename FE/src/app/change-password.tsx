import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '@/src/core/api/client';
import { useUIStore } from '@/src/core/stores/ui.store';
import { Input } from '@/src/components/ui/Input';
import { isValidPassword } from '@/src/utils/validators.utils';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';

export default function ChangePasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { showToast } = useUIStore();

  const handleUpdatePassword = async () => {
    if (!isValidPassword(newPassword)) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/user/change-password', {
        newPassword,
        confirmNewPassword,
      });
      showToast('Password updated successfully!', 'success');
      router.back();
    } catch (error: any) {
      showToast(
        error?.response?.data?.message || 'Failed to update password',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-12">
      {/* Header Back Button */}
      <View className="mb-8 mt-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft color="#000000" size={24} />
        </TouchableOpacity>
      </View>

      <View className="mb-10">
        <Text className="text-[28px] font-bold text-[#0b1c30] mb-3 text-center">Reset Password</Text>
        <Text className="text-[15px] text-[#737686] text-center px-4 leading-relaxed">
          Choose a strong password to protect your account
        </Text>
      </View>

      <View className="space-y-5 mb-10">
        <Input
          placeholder="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNewPassword}
          rightIcon={
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
              {showNewPassword ? (
                <EyeOff color="#9ca3af" size={20} strokeWidth={2} />
              ) : (
                <Eye color="#9ca3af" size={20} strokeWidth={2} />
              )}
            </TouchableOpacity>
          }
        />

        <Input
          placeholder="Confirm New Password"
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
          secureTextEntry={!showConfirmNewPassword}
          rightIcon={
            <TouchableOpacity onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>
              {showConfirmNewPassword ? (
                <EyeOff color="#9ca3af" size={20} strokeWidth={2} />
              ) : (
                <Eye color="#9ca3af" size={20} strokeWidth={2} />
              )}
            </TouchableOpacity>
          }
        />
      </View>

      <TouchableOpacity
        className="bg-[#2563eb] rounded-xl py-4 flex-row justify-center items-center active:bg-[#1d4ed8] shadow-sm mb-12"
        onPress={handleUpdatePassword}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text className="text-white font-medium text-[16px]">Update Password</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
