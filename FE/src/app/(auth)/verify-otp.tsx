import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/src/core/stores/auth.store';
import { useUIStore } from '@/src/core/stores/ui.store';
import { Input } from '@/src/components/ui/Input';

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  
  const router = useRouter();
  const { verifyOTP, resendOTP } = useAuthStore();
  const { showToast } = useUIStore();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    if (otp.length < 6) {
      showToast('Please enter a valid 6-digit OTP', 'error'); return;
    }
    setIsSubmitting(true);
    try {
      await verifyOTP(email || '', otp);
      // Root layout handles redirect on success
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Verification failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      await resendOTP(email || '');
      showToast('OTP resent successfully', 'success');
      setCooldown(60);
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to resend OTP', 'error');
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-12">
      <View className="mb-10 mt-10">
        <Text className="text-[28px] font-bold text-[#0b1c30] mb-2">Verify Email</Text>
        <Text className="text-[15px] text-[#737686] leading-relaxed">
          Enter the 6-digit code sent to {email || 'your email'}
        </Text>
      </View>

      <View className="space-y-4 mb-4">
        <Input
          placeholder=""
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          style={{ fontSize: 16 }}
        />
      </View>

      <TouchableOpacity 
        className="bg-[#3b82f6] rounded-xl py-4 flex-row justify-center items-center active:bg-[#2563eb] mb-6"
        onPress={handleVerify}
        disabled={isSubmitting}
      >
        <Text className="text-white font-medium text-[16px]">Verify OTP</Text>
      </TouchableOpacity>

      <View className="flex-row justify-center">
        <TouchableOpacity onPress={handleResend} disabled={cooldown > 0}>
          <Text className={`text-[14px] ${cooldown > 0 ? 'text-[#9ca3af]' : 'text-[#3b82f6]'}`}>
            {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
