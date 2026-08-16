import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/core/api/client';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { useRouter } from 'expo-router';
import { Search as SearchIcon, Filter, ChevronRight, GraduationCap, ArrowLeft } from 'lucide-react-native';

// Helper hook
function useDebounceHook(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounceHook(query, 300);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => apiClient.get(`/curriculum/search?q=${encodeURIComponent(debouncedQuery)}`).then(res => res.data),
    enabled: debouncedQuery.length > 2
  });

  return (
    <View className="flex-1 bg-[#f8f9ff] pt-12 px-5">
      {/* Search Header — back button + search bar */}
      <View className="flex-row items-center gap-3 mb-6">
        {/* Back Button */}
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 rounded-full bg-white border border-[#e5e7eb] items-center justify-center"
          style={{ elevation: 2 }}
        >
          <ArrowLeft color="#0b1c30" size={20} />
        </TouchableOpacity>
        <View className="flex-1 flex-row items-center bg-white border border-[#e5e7eb] rounded-full px-4 h-12" style={{ elevation: 2 }}>
          <SearchIcon color="#737686" size={20} />
          <TextInput
            className="flex-1 text-[#0b1c30] ml-3 text-[15px]"
            placeholder="Semester"
            placeholderTextColor="#737686"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
        </View>
      </View>

      <Text className="text-[19px] text-[#0b1c30] font-bold mb-4">Search Results</Text>

      {debouncedQuery.length <= 2 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-[#434655] text-center text-[15px]">Type at least 3 characters to search</Text>
        </View>
      ) : isLoading ? (
        <View className="flex-col gap-4">
          <Skeleton width="100%" height={80} borderRadius={16} />
          <Skeleton width="100%" height={80} borderRadius={16} />
        </View>
      ) : isError ? (
        <ErrorState message="Search failed. Please check your connection." onRetry={refetch} />
      ) : (
        <FlatList
          data={data?.semesters || []}
          keyExtractor={item => item._id}
          contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
          ListEmptyComponent={<EmptyState message="No results found" />}
          renderItem={({ item }) => {
            // Display branch name if available, otherwise fallback
            const branchName = item.branchId?.name || 'Unknown Branch';
            const branchShort = item.branchId?.shortName || '';
            const initials = branchShort ? ` (${branchShort})` : '';

            return (
              <TouchableOpacity 
                onPress={() => router.push(`/subjects/${item._id}`)}
                className="flex-row items-center p-4 bg-white rounded-[14px] border border-[#e5e7eb] active:scale-95"
                style={{ elevation: 2 }}
              >
                <View className="w-[46px] h-[46px] rounded-full bg-[#f0f5ff] flex items-center justify-center mr-4">
                  <GraduationCap color="#2563eb" size={22} strokeWidth={2} />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] text-[#0b1c30] font-medium mb-0.5">
                    {item.title || `Semester ${item.semNumber}`}
                  </Text>
                  <Text className="text-[13px] text-[#434655]">
                    {branchName}{initials}
                  </Text>
                </View>
                <ChevronRight color="#c1c3ce" size={20} />
              </TouchableOpacity>
            )
          }}
        />
      )}
    </View>
  );
}
