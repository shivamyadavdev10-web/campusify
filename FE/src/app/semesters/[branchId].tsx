import React from 'react';
import { View, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/core/api/client';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { BookOpen, ChevronRight } from 'lucide-react-native';
import { TouchableOpacity, Text } from 'react-native';

export default function SemestersScreen() {
  const { branchId, branchName } = useLocalSearchParams<{ branchId: string; branchName?: string }>();
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useQuery({
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
    <View className="flex-1 bg-background px-4">
      <Stack.Screen options={{ title: branchName || 'Semesters' }} />
      <FlatList
        data={data?.semesters || []}
        keyExtractor={item => item._id}
        contentContainerStyle={{ gap: 16, paddingTop: 16, paddingBottom: 24 }}
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
  );
}
