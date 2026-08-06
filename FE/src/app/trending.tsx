import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/core/api/client';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { useRouter, Stack } from 'expo-router';
import { Flame, ChevronRight, GraduationCap, IndianRupee } from 'lucide-react-native';

const cardShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  android: { elevation: 2 },
  default: {},
});

export default function TrendingCoursesScreen() {
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['trending-courses'],
    queryFn: () => apiClient.get('/curriculum/courses/trending').then(res => res.data),
  });

  const courses = data?.courses || [];

  if (isError) return <ErrorState message="Failed to load trending courses" onRetry={refetch} />;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Trending Courses' }} />

      {/* Header banner */}
      <View className="bg-[#ef4444] mx-4 mt-4 mb-2 rounded-2xl px-5 py-4" style={{ elevation: 4 }}>
        <View className="flex-row items-center mb-1">
          <Flame color="#ffffff" size={20} fill="#fff" />
          <Text className="text-white text-lg font-bold ml-2">Trending Courses</Text>
        </View>
        <Text className="text-white/80 text-[13px]">
          Top {courses.length || ''} latest courses picked for you
        </Text>
      </View>

      {isLoading ? (
        <View className="px-4 pt-4" style={{ gap: 12 }}>
          <Skeleton width="100%" height={90} borderRadius={16} />
          <Skeleton width="100%" height={90} borderRadius={16} />
          <Skeleton width="100%" height={90} borderRadius={16} />
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          ListEmptyComponent={<EmptyState message="No trending courses available right now" />}
          renderItem={({ item, index }) => {
            const branchName = item.branchId?.name || 'Unknown Branch';
            const branchShort = item.branchId?.shortName || '';

            return (
              <TouchableOpacity
                className="bg-surface-container-lowest border border-outline-variant rounded-[18px] overflow-hidden active:scale-[0.97]"
                style={cardShadow}
                onPress={() => router.push(`/subjects/${item._id}`)}
              >
                <View className="flex-row">
                  {/* Rank badge */}
                  <View className="w-[52px] bg-[#ef4444]/5 items-center justify-center border-r border-outline-variant">
                    <Text className="text-[#ef4444] text-[22px] font-bold">#{index + 1}</Text>
                  </View>

                  {/* Content */}
                  <View className="flex-1 p-4 flex-row items-center">
                    <View className="w-[44px] h-[44px] rounded-[12px] bg-[#f0f5ff] items-center justify-center mr-3">
                      <GraduationCap color="#4182f9" size={22} strokeWidth={2} />
                    </View>
                    <View className="flex-1 mr-2">
                      <Text className="text-on-surface font-semibold text-[15px] mb-0.5" numberOfLines={1}>
                        {item.title || `Semester ${item.semNumber}`}
                      </Text>
                      <Text className="text-on-surface-variant text-[12px]" numberOfLines={1}>
                        {branchShort ? `${branchShort} • ${branchName}` : branchName}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-[#4182f9] font-bold text-[14px]">₹{item.price}</Text>
                      <ChevronRight color="#c1c3ce" size={18} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
