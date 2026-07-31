import React, { useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { LogOut, User, BookOpen, Phone, Mail } from 'lucide-react-native';
import { getInitials } from '../../utils/helpers.utils';

export default function ProfileScreen() {
  const { user, logout, fetchProfile } = useAuthStore();

  // Refresh profile data when screen mounts
  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <View className="flex-1 bg-background justify-center items-center px-6">
      {/* Avatar */}
      <View className="items-center mb-8">
        <View className="bg-secondary w-24 h-24 rounded-full justify-center items-center mb-4">
          {user ? (
            <Text className="text-white text-2xl font-bold">
              {getInitials(user.firstName, user.lastName)}
            </Text>
          ) : (
            <User color="#f3f4f6" size={40} />
          )}
        </View>
        
        {/* Name */}
        <Text className="text-text text-2xl font-bold">
          {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
        </Text>

        {/* Email */}
        {user?.email && (
          <View className="flex-row items-center mt-1">
            <Mail color="#9ca3af" size={14} />
            <Text className="text-textMuted text-base ml-1">{user.email}</Text>
          </View>
        )}
      </View>

      {/* Stats Card */}
      {user && (
        <View className="bg-secondary rounded-xl p-4 w-full mb-8">
          <View className="flex-row items-center mb-3">
            <BookOpen color="#6366f1" size={18} />
            <Text className="text-textMuted ml-2">
              Purchased Courses: <Text className="text-text font-bold">{user.totalPurchased}</Text>
            </Text>
          </View>

          {user.phoneNo && (
            <View className="flex-row items-center">
              <Phone color="#6366f1" size={18} />
              <Text className="text-textMuted ml-2">{user.phoneNo}</Text>
            </View>
          )}
        </View>
      )}

      {/* Logout Button */}
      <Pressable 
        onPress={logout}
        className="bg-red-500/10 border border-red-500 rounded-xl py-4 px-8 items-center flex-row active:opacity-80"
      >
        <LogOut color="#ef4444" size={20} className="mr-2" />
        <Text className="text-red-500 font-bold text-lg">Logout</Text>
      </Pressable>
    </View>
  );
}
