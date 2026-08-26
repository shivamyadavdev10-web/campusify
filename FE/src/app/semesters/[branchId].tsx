import React from 'react';
import { View, FlatList, RefreshControl, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/core/api/client';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { BookOpen, ChevronRight } from 'lucide-react-native';
import { TouchableOpacity, Text } from 'react-native';

const cardShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  android: { elevation: 2 },
  default: {},
});

export default function SemestersScreen() {
  const { branchId, branchName } = useLocalSearchParams<{ branchId: string; branchName?: string }>();
  const router = useRouter();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['semesters', branchId],
    queryFn: () => apiClient.get(`/curriculum/semesters/${branchId}`).then(res => res.data)
  });

  // Get dynamic detailsUrl from API response (branch-level)
  const branchDetailsUrl = data?.branch?.detailsUrl || 'https://campusifyplus.in/online-classes/';

  if (isLoading) {
    return (
      <View className="flex-1 bg-background p-4 flex-col gap-4">
        <Skeleton width="100%" height={80} borderRadius={16} />
        <Skeleton width="100%" height={80} borderRadius={16} />
        <Skeleton width="100%" height={80} borderRadius={16} />
      </View>
    );
  }

  if (isError) return <ErrorState message="Failed to load semesters" onRetry={refetch} />;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: branchName || 'Semesters' }} />
      
      <View className="flex-1 px-4">
        <FlatList
          data={data?.semesters || []}
          keyExtractor={item => item._id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4182f9" />}
          contentContainerStyle={{ gap: 12, paddingTop: 16, paddingBottom: 32 }}
          ListEmptyComponent={<EmptyState message="No semesters available" />}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => router.push({ 
                pathname: '/subjects/[semesterId]', 
                params: { 
                  semesterId: item._id, 
                  detailsUrl: item.detailsUrl || branchDetailsUrl 
                } 
              })}
              className="bg-surface-container-lowest border border-outline-variant rounded-[18px] p-4 flex-row items-center justify-between active:scale-[0.97]"
              style={cardShadow}
            >
              <View className="flex-row items-center gap-4">
                <View className="w-[48px] h-[48px] rounded-[14px] bg-[#f0f5ff] flex items-center justify-center">
                  <BookOpen color="#2563eb" size={22} strokeWidth={2} />
                </View>
                <View>
                  <Text className="font-semibold text-on-surface text-[15px] mb-0.5">
                    {item.title || `Semester ${item.semNumber}`}
                  </Text>
                  {item.price && (
                    <Text className="text-[#4182f9] text-[13px] font-bold">₹{item.price}</Text>
                  )}
                </View>
              </View>
              <ChevronRight color="#c1c3ce" size={20} />
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}
