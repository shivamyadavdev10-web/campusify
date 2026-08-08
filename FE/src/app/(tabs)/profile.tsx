import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/core/api/client';
import { useAuthStore } from '@/src/core/stores/auth.store';
import { useUIStore } from '@/src/core/stores/ui.store';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { getInitials } from '@/src/utils/helpers.utils';
import { LogOut, BookOpen, CreditCard, Mail, Phone, Lock, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

export default function ProfileScreen() {
  const { logout } = useAuthStore();
  const { showToast } = useUIStore();
  const router = useRouter();
  
  const { data: profileData, isLoading: profileLoading, isError: profileError, refetch: refetchProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient.get('/user/me').then(res => res.data.data)
  });

  if (profileLoading) {
    return (
      <View className="flex-1 bg-background pt-12 px-5">
        <Skeleton width={100} height={100} borderRadius={50} className="self-center mb-6" />
        <Skeleton width="60%" height={24} className="self-center mb-2" />
        <Skeleton width="40%" height={16} className="self-center mb-8" />
      </View>
    );
  }

  if (profileError) return <ErrorState message="Failed to load profile" onRetry={refetchProfile} />;

  return (
    <ScrollView className="flex-1 bg-background px-5 pt-10 pb-24">
      {/* Profile Header */}
      <View className="bg-surface-container-lowest rounded-3xl p-5 flex-row items-center shadow-sm mb-6 border border-outline-variant">
        <View className="w-[68px] h-[68px] rounded-full bg-[#f0f5ff] flex items-center justify-center mr-4">
          <Text className="text-[22px] font-semibold text-[#2563eb]">
            {getInitials(profileData?.firstName, profileData?.lastName)}
          </Text>
        </View>
        <View className="flex-1 overflow-hidden">
          <Text className="text-[17px] font-semibold text-on-surface mb-0.5" numberOfLines={1}>
            {profileData?.firstName} {profileData?.lastName}
          </Text>
          <View className="flex-row items-center mb-2">
            <Mail color="#737686" size={14} className="mr-1.5" />
            <Text className="text-on-surface-variant text-[13px] truncate" numberOfLines={1}>
              {profileData?.email}
            </Text>
          </View>
          {profileData?.isVerified ? (
            <View className="self-start bg-[#f0fdf4] px-2 py-1 rounded-md flex-row items-center">
              <CheckCircle2 color="#16a34a" size={12} className="mr-1" />
              <Text className="text-[#16a34a] text-[11px] font-medium">Verified Student</Text>
            </View>
          ) : (
            <View className="self-start bg-[#fefce8] px-2 py-1 rounded-md flex-row items-center">
              <Text className="text-[#eab308] text-[11px] font-medium">Verify Account</Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick Action Cards */}
      <TouchableOpacity 
        className="bg-surface-container-lowest rounded-3xl p-4 flex-row items-center justify-between shadow-sm mb-4 border border-outline-variant active:scale-95 transition-transform"
        onPress={() => router.push('/(tabs)/my-courses')} 
      >
        <View className="flex-row items-center">
          <View className="w-[42px] h-[42px] rounded-full bg-[#f0f5ff] flex items-center justify-center mr-4">
            <BookOpen color="#3b82f6" size={20} />
          </View>
          <View>
            <Text className="text-[15px] font-medium text-on-surface">Courses</Text>
            <Text className="text-[13px] text-on-surface-variant mt-0.5">View your enrolled content</Text>
          </View>
        </View>
        <ChevronRight color="#c1c3ce" size={20} />
      </TouchableOpacity>

      <TouchableOpacity 
        className="bg-surface-container-lowest rounded-3xl p-4 flex-row items-center justify-between shadow-sm mb-8 border border-outline-variant active:scale-95 transition-transform"
        onPress={() => showToast('Payment history coming in next update', 'info')}
      >
        <View className="flex-row items-center">
          <View className="w-[42px] h-[42px] rounded-full bg-[#f0f5ff] flex items-center justify-center mr-4">
            <CreditCard color="#3b82f6" size={20} />
          </View>
          <View>
            <Text className="text-[15px] font-medium text-on-surface">Payments</Text>
            <Text className="text-[13px] text-on-surface-variant mt-0.5">Transactions and billing</Text>
          </View>
        </View>
        <ChevronRight color="#c1c3ce" size={20} />
      </TouchableOpacity>

      {/* Account & Support Section */}
      <View className="mb-8">
        <Text className="text-[15px] text-on-surface font-medium mb-3 px-1">Account & Support</Text>
        <View className="bg-surface-container-lowest rounded-[24px] p-2 shadow-sm border border-outline-variant">
          
          {/* Contact Support */}
          <TouchableOpacity className="flex-row items-center p-3 border-b border-surface-container-highest active:bg-surface-container-lowest rounded-xl">
            <View className="w-10 h-10 rounded-full bg-[#f0fdfa] flex items-center justify-center mr-4">
              <Phone color="#0d9488" size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-medium text-on-surface">Contact Support</Text>
              <Text className="text-[13px] text-on-surface-variant mt-0.5">Call: +91 8104131420</Text>
            </View>
          </TouchableOpacity>
          
          {/* Reset Password */}
          <TouchableOpacity 
            className="flex-row items-center p-3 border-b border-surface-container-highest active:bg-surface-container-lowest rounded-xl"
            onPress={() => router.push('/change-password')}
          >
            <View className="w-10 h-10 rounded-full bg-[#f0f5ff] flex items-center justify-center mr-4">
              <Lock color="#3b82f6" size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-medium text-on-surface">Reset Password</Text>
              <Text className="text-[13px] text-on-surface-variant mt-0.5">Update your security credentials</Text>
            </View>
          </TouchableOpacity>

          {/* Log Out */}
          <TouchableOpacity 
            className="flex-row items-center p-3 active:bg-surface-container-lowest rounded-xl"
            onPress={() => logout()}
          >
            <View className="w-10 h-10 rounded-full bg-[#fef2f2] flex items-center justify-center mr-4">
              <LogOut color="#ef4444" size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-medium text-[#ef4444]">Log Out</Text>
              <Text className="text-[13px] text-on-surface-variant mt-0.5">Securely sign out of this device</Text>
            </View>
          </TouchableOpacity>
          
        </View>
      </View>
      
      <Text className="text-center text-xs text-on-surface-variant mb-6">{`Campusify App v${Constants.expoConfig?.version || '1.0.0'}`}</Text>
    </ScrollView>
  );
}
