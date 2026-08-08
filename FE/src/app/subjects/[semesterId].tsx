import React from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/core/api/client';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import SubjectCard from '@/src/features/curriculum/components/SubjectCard';

export default function SubjectsScreen() {
  const { semesterId } = useLocalSearchParams<{ semesterId: string }>();
  const router = useRouter();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['subjects', semesterId],
    queryFn: () => apiClient.get(`/curriculum/subjects/${semesterId}`).then(res => res.data)
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-background p-4 space-y-4">
        <Skeleton width="100%" height={80} borderRadius={12} />
        <Skeleton width="100%" height={80} borderRadius={12} />
        <Skeleton width="100%" height={80} borderRadius={12} />
      </View>
    );
  }

  if (isError) return <ErrorState message="Failed to load subjects" onRetry={refetch} />;

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={data?.subjects || []}
        keyExtractor={item => item._id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4182f9" />}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={<EmptyState message="No subjects available" />}
        renderItem={({ item }) => (
          <SubjectCard subject={item} onPress={() => router.push(`/course/${item._id}`)} />
        )}
      />
    </View>
  );
}
