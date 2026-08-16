import React from 'react';
import { View, FlatList, RefreshControl, Linking } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/core/api/client';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { BookOpen, ChevronRight, ExternalLink } from 'lucide-react-native';
import { TouchableOpacity, Text } from 'react-native';

export default function SemestersScreen() {
  const { branchId, branchName } = useLocalSearchParams<{ branchId: string; branchName?: string }>();
  const router = useRouter();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['semesters', branchId],
    queryFn: () => apiClient.get(`/curriculum/semesters/${branchId}`).then(res => res.data)
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-background p-4 flex-col gap-4">
        <Skeleton width="100%" height={80} borderRadius={12} />
        <Skeleton width="100%" height={80} borderRadius={12} />
      </View>
    );
  }

  if (isError) return <ErrorState message="Failed to load semesters" onRetry={refetch} />;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: branchName || 'Semesters' }} />
      
      {/* Semester List */}
      <View className="flex-1 px-4">
        <FlatList
          data={data?.semesters || []}
          keyExtractor={item => item._id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4182f9" />}
          contentContainerStyle={{ gap: 16, paddingTop: 16, paddingBottom: 100 }}
          ListEmptyComponent={<EmptyState message="No semesters available" />}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => router.push(`/subjects/${item._id}`)}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex-row items-center justify-between active:scale-95"
              style={{ elevation: 2 }}
            >
              <View className="flex-row items-center gap-4">
                <View className="w-[46px] h-[46px] rounded-full bg-[#f0f5ff] flex items-center justify-center">
                  <BookOpen color="#2563eb" size={22} strokeWidth={2} />
                </View>
                <View>
                  <Text className="font-semibold text-on-surface text-[15px]">
                    {item.title || `Semester ${item.semNumber}`}
                  </Text>
                </View>
              </View>
              <ChevronRight color="#c1c3ce" size={20} />
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Sticky Bottom Bar — website redirect CTA */}
      <View 
        className="bg-white border-t border-[#e5e7eb] px-4 py-3 flex-row items-center justify-between"
        style={{ elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4 }}
      >
        <Text className="text-[#434655] text-[13px] flex-1 mr-3">Visit website for more details</Text>
        <TouchableOpacity 
          className="bg-[#4182f9] px-5 py-2.5 rounded-xl flex-row items-center active:bg-[#2563eb]"
          onPress={() => Linking.openURL('https://campusifyplus.in/online-classes/')}
        >
          <ExternalLink color="#ffffff" size={14} />
          <Text className="text-white font-bold text-[13px] ml-1.5">Get More Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
