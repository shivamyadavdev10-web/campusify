import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import { Bell, X, CheckCheck, Clock } from 'lucide-react-native';
import { useNotifications, markNotificationsRead } from '@/src/hooks/useNotifications';
import { useQueryClient } from '@tanstack/react-query';

export function NotificationBell() {
  const [modalVisible, setModalVisible] = useState(false);
  const { data, isLoading } = useNotifications();
  const queryClient = useQueryClient();

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const handleOpen = () => {
    setModalVisible(true);
    if (unreadCount > 0) {
      // Mark as read in background
      markNotificationsRead().then(() => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }).catch(console.error);
    }
  };

  const getIconColor = (type: string) => {
    switch(type) {
      case 'alert': return '#ef4444'; // red
      case 'course_update': return '#22c55e'; // green
      default: return '#4182f9'; // blue
    }
  };

  const getBgColor = (type: string) => {
    switch(type) {
      case 'alert': return 'bg-red-50';
      case 'course_update': return 'bg-green-50';
      default: return 'bg-blue-50';
    }
  };

  // Format date nicely (e.g. "2 hours ago")
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <TouchableOpacity 
        onPress={handleOpen}
        className="w-10 h-10 rounded-full bg-surface-container-lowest border border-outline-variant items-center justify-center relative active:scale-95"
        style={Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
            android: { elevation: 2 },
        })}
      >
        <Bell color="#0b1c30" size={20} />
        {unreadCount > 0 && (
          <View className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full items-center justify-center border-2 border-white">
            <Text className="text-white text-[9px] font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <TouchableOpacity 
            className="absolute inset-0" 
            activeOpacity={1} 
            onPress={() => setModalVisible(false)} 
          />
          
          <View className="bg-white rounded-t-3xl w-full h-[70%] shadow-2xl">
            <View className="flex-row items-center justify-between px-6 py-5 border-b border-gray-100">
              <View className="flex-row items-center">
                <Bell color="#0b1c30" size={22} className="mr-2" />
                <Text className="text-xl font-bold text-slate-900">Notifications</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
              >
                <X color="#64748b" size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
              {isLoading ? (
                <View className="items-center justify-center py-10">
                  <Text className="text-slate-500">Loading notifications...</Text>
                </View>
              ) : notifications.length === 0 ? (
                <View className="items-center justify-center py-16">
                  <View className="w-16 h-16 bg-gray-50 rounded-full items-center justify-center mb-4">
                    <CheckCheck color="#94a3b8" size={32} />
                  </View>
                  <Text className="text-slate-600 font-medium text-lg">You're all caught up!</Text>
                  <Text className="text-slate-400 text-sm mt-1">No new notifications</Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {notifications.slice(0, 5).map((notif: any) => (
                    <View 
                      key={notif._id} 
                      className="bg-white border border-slate-100 rounded-2xl p-4 flex-row items-start"
                      style={Platform.select({
                        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
                        android: { elevation: 1 },
                      })}
                    >
                      <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 mt-1 ${getBgColor(notif.type)}`}>
                        <Bell color={getIconColor(notif.type)} size={18} />
                      </View>
                      
                      <View className="flex-1">
                        <Text className="text-slate-900 font-bold text-[15px] mb-1">{notif.title}</Text>
                        <Text className="text-slate-600 text-[13.5px] leading-snug mb-2">{notif.message}</Text>
                        
                        <View className="flex-row items-center">
                          <Clock color="#94a3b8" size={12} />
                          <Text className="text-slate-400 text-[11px] font-medium ml-1">
                            {formatTime(notif.createdAt)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                  
                  {notifications.length > 5 && (
                     <View className="py-4 items-center">
                         <Text className="text-slate-400 text-xs font-medium uppercase tracking-wider">Only showing latest 5</Text>
                     </View>
                  )}
                </View>
              )}
              <View className="h-8" />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
