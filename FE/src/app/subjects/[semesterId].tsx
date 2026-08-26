import React from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/core/api/client';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import SubjectCard from '@/src/features/curriculum/components/SubjectCard';
import DetailsBottomBar from '@/src/components/ui/DetailsBottomBar';

export default function SubjectsScreen() {
  const { semesterId, detailsUrl: paramDetailsUrl } = useLocalSearchParams<{ semesterId: string; detailsUrl?: string }>();
  const router = useRouter();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['subjects', semesterId],
    queryFn: () => apiClient.get(`/curriculum/subjects/${semesterId}`).then(res => res.data)
  });

  // Dynamic detailsUrl: API response > route param > default
  const detailsUrl = data?.detailsUrl || paramDetailsUrl || 'https://campusifyplus.in/online-classes/';

  // Dynamic header title from API
  const headerTitle = data?.semester 
    ? `${data.semester.branchShortName || ''} - ${data.semester.title || 'Subjects'}`.trim()
    : 'Subjects';

  if (isLoading) {
    return (
      <View className="flex-1 bg-background p-4" style={{ gap: 12 }}>
        <Skeleton width="100%" height={80} borderRadius={16} />
        <Skeleton width="100%" height={80} borderRadius={16} />
        <Skeleton width="100%" height={80} borderRadius={16} />
      </View>
    );
  }

  if (isError) return <ErrorState message="Failed to load subjects" onRetry={refetch} />;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: headerTitle }} />

      <FlatList
        data={data?.subjects || []}
        keyExtractor={item => item._id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4182f9" />}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 80 }}
        ListEmptyComponent={<EmptyState message="No subjects available" />}
        renderItem={({ item }) => (
          <SubjectCard 
            subject={item} 
            onPress={() => router.push({ 
              pathname: '/course/[subjectId]', 
              params: { subjectId: item._id, detailsUrl } 
            })} 
          />
        )}
      />

      {/* Sticky Bottom CTA — Get More Details + WhatsApp */}
      <DetailsBottomBar detailsUrl={detailsUrl} />
    </View>
  );
}
