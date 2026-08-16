import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/core/stores/auth.store';
import { useUIStore } from '@/src/core/stores/ui.store';
import { Input } from '@/src/components/ui/Input';
import { isValidEmail } from '@/src/utils/validators.utils';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { login } = useAuthStore();
  const { showToast } = useUIStore();

  const handleLogin = async () => {
    if (!isValidEmail(email)) {
      showToast('Please enter a valid email', 'error');
      return;
    }
    if (!password) {
      showToast('Please enter your password', 'error');
      return;
    }

    setIsSubmitting(true);
    const wakeTimer = setTimeout(() => {
      showToast('⏳ Server is waking up, please wait…', 'info');
    }, 4000);

    try {
      await login(email.trim().toLowerCase(), password);
    } catch (error: any) {
      if (error?.response?.status === 403 && error?.response?.data?.isVerified === false) {
        showToast('Please verify your email first', 'warning');
        router.push({ pathname: '/(auth)/verify-otp', params: { email: email.trim().toLowerCase() } });
      } else {
        const msg = error?.response?.data?.message || error?.message || 'Login failed';
        if (msg.includes('Network Error') || msg.includes('timeout')) {
          showToast('Cannot reach server. Check your internet or try again.', 'error');
        } else {
          showToast(msg, 'error');
        }
      }
    } finally {
      clearTimeout(wakeTimer);
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-12">
      <View className="mb-8 mt-10">
        <Text className="text-[28px] font-bold text-[#0b1c30] mb-2">Welcome Back</Text>
        <Text className="text-[15px] text-[#737686]">Log in to your account to continue.</Text>
      </View>

      <View className="space-y-4">
        <Input
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon={<Mail color="#9ca3af" size={20} strokeWidth={2} />}
        />
        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          leftIcon={<Lock color="#9ca3af" size={20} strokeWidth={2} />}
          rightIcon={
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff color="#3b82f6" size={20} strokeWidth={2} /> : <Eye color="#3b82f6" size={20} strokeWidth={2} />}
            </TouchableOpacity>
          }
        />
      </View>

      <TouchableOpacity 
        className="self-end mt-4 mb-8 active:opacity-70"
        onPress={() => router.push('/(auth)/forgot-password')}
      >
        <Text className="text-[#3b82f6] text-[14px]">Forgot Password?</Text>
      </TouchableOpacity>

      {/* Login Button — shows loading spinner during authentication */}
      <TouchableOpacity 
        className={`bg-[#3b82f6] rounded-xl py-4 flex-row justify-center items-center active:bg-[#2563eb] ${isSubmitting ? 'opacity-70' : ''}`}
        onPress={handleLogin}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text className="text-white font-medium text-[16px]">Sign In</Text>
        )}
      </TouchableOpacity>

      <View className="flex-row justify-center mt-8 mb-12">
        <Text className="text-[#737686] text-[15px]">Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')} className="active:opacity-70">
          <Text className="text-[#3b82f6] text-[15px] font-medium">Create Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
