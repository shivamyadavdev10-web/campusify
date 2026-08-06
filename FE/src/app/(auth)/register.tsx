import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/core/stores/auth.store';
import { useUIStore } from '@/src/core/stores/ui.store';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { isValidEmail, isValidPassword, isValidName, isValidPhone } from '@/src/utils/validators.utils';
import { User, Phone, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNo: '',
    email: '',
    createPassword: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { register } = useAuthStore();
  const { showToast } = useUIStore();

  const handleRegister = async () => {
    if (!isValidName(formData.firstName) || !isValidName(formData.lastName)) {
      showToast('Please enter valid names', 'error'); return;
    }
    if (!isValidPhone(formData.phoneNo)) {
      showToast('Please enter a valid phone number', 'error'); return;
    }
    if (!isValidEmail(formData.email)) {
      showToast('Please enter a valid email', 'error'); return;
    }
    if (!isValidPassword(formData.createPassword)) {
      showToast('Password must be at least 6 characters', 'error'); return;
    }
    if (formData.createPassword !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error'); return;
    }

    setIsSubmitting(true);
    try {
      await register(formData);
      showToast('Registration successful! Please verify OTP.', 'success');
      router.push({ pathname: '/(auth)/verify-otp', params: { email: formData.email } });
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-12">
      <View className="mb-8 mt-10">
        <Text className="text-[28px] font-bold text-[#0b1c30] mb-2">Create Account</Text>
        <Text className="text-[15px] text-[#737686]">Sign up to start learning today.</Text>
      </View>

      <View className="space-y-4 mb-8">
        <Input 
          placeholder="First Name" 
          value={formData.firstName} 
          onChangeText={(t) => setFormData({...formData, firstName: t})}
          leftIcon={<User color="#9ca3af" size={20} strokeWidth={2} />}
        />
        <Input 
          placeholder="Last Name" 
          value={formData.lastName} 
          onChangeText={(t) => setFormData({...formData, lastName: t})}
          leftIcon={<User color="#9ca3af" size={20} strokeWidth={2} />}
        />
        <Input 
          placeholder="Phone Number" 
          keyboardType="phone-pad" 
          value={formData.phoneNo} 
          onChangeText={(t) => setFormData({...formData, phoneNo: t})}
          leftIcon={<Phone color="#9ca3af" size={20} strokeWidth={2} />}
        />
        <Input 
          placeholder="Email address" 
          keyboardType="email-address" 
          autoCapitalize="none" 
          value={formData.email} 
          onChangeText={(t) => setFormData({...formData, email: t})}
          leftIcon={<Mail color="#9ca3af" size={20} strokeWidth={2} />}
        />
        <Input 
          placeholder="Create Password" 
          secureTextEntry={!showPassword} 
          value={formData.createPassword} 
          onChangeText={(t) => setFormData({...formData, createPassword: t})}
          leftIcon={<Lock color="#9ca3af" size={20} strokeWidth={2} />}
          rightIcon={
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff color="#3b82f6" size={20} strokeWidth={2} /> : <Eye color="#3b82f6" size={20} strokeWidth={2} />}
            </TouchableOpacity>
          }
        />
        <Input 
          placeholder="Confirm Password" 
          secureTextEntry={!showConfirmPassword} 
          value={formData.confirmPassword} 
          onChangeText={(t) => setFormData({...formData, confirmPassword: t})}
          leftIcon={<Lock color="#9ca3af" size={20} strokeWidth={2} />}
          rightIcon={
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <EyeOff color="#3b82f6" size={20} strokeWidth={2} /> : <Eye color="#3b82f6" size={20} strokeWidth={2} />}
            </TouchableOpacity>
          }
        />
      </View>

      <TouchableOpacity 
        className="bg-[#3b82f6] rounded-xl py-4 flex-row justify-center items-center active:bg-[#2563eb]"
        onPress={handleRegister}
        disabled={isSubmitting}
      >
        <Text className="text-white font-medium text-[16px]">Sign Up</Text>
      </TouchableOpacity>

      <View className="flex-row justify-center mt-8 mb-12">
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text className="text-[#3b82f6] text-[15px]">Back to Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
