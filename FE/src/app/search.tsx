import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, SectionList, Linking, Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/core/api/client';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { useRouter } from 'expo-router';
import { Search as SearchIcon, ChevronRight, GraduationCap, ArrowLeft, BookOpen, Sparkles } from 'lucide-react-native';

const cardShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  android: { elevation: 2 },
  default: {},
});

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

  // Search results (when user types)
  const { data: searchData, isLoading: searchLoading, isError: searchError, refetch: searchRefetch } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => apiClient.get(`/curriculum/search?q=${encodeURIComponent(debouncedQuery)}`).then(res => res.data),
    enabled: debouncedQuery.length > 2
  });

  // Featured/default categories (shown when no query)
  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['search-featured'],
    queryFn: () => apiClient.get('/curriculum/search/featured').then(res => res.data),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const isSearchActive = debouncedQuery.length > 2;
  const categories = featuredData?.categories || [];

  // Branch color coding
  const getBranchColor = (shortName: string) => {
    switch (shortName?.toUpperCase()) {
      case 'CO': return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
      case 'IT': return { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' };
      case 'AN': return { bg: '#fefce8', text: '#ca8a04', border: '#fef08a' };
      default: return { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' };
    }
  };

  return (
    <View className="flex-1 bg-[#f8f9ff] pt-12 px-5">
      {/* Search Header — back button + search bar */}
      <View className="flex-row items-center gap-3 mb-6">
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
            placeholder="Search semesters, branches..."
            placeholderTextColor="#737686"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Content Area */}
      {isSearchActive ? (
        /* ═══ Active Search Results ═══ */
        <>
          <Text className="text-[19px] text-[#0b1c30] font-bold mb-4">Search Results</Text>
          {searchLoading ? (
            <View className="flex-col gap-4">
              <Skeleton width="100%" height={80} borderRadius={16} />
              <Skeleton width="100%" height={80} borderRadius={16} />
            </View>
          ) : searchError ? (
            <ErrorState message="Search failed. Please check your connection." onRetry={searchRefetch} />
          ) : (
            <FlatList
              data={searchData?.semesters || []}
              keyExtractor={item => item._id}
              contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
              ListEmptyComponent={<EmptyState message="No results found" />}
              renderItem={({ item }) => {
                const branchName = item.branchId?.name || 'Unknown Branch';
                const branchShort = item.branchId?.shortName || '';
                const colors = getBranchColor(branchShort);

                return (
                  <TouchableOpacity 
                    onPress={() => router.push(`/subjects/${item._id}`)}
                    className="flex-row items-center p-4 bg-white rounded-[14px] border border-[#e5e7eb] active:scale-95"
                    style={cardShadow}
                  >
                    <View className="w-[46px] h-[46px] rounded-full bg-[#f0f5ff] flex items-center justify-center mr-4">
                      <GraduationCap color="#2563eb" size={22} strokeWidth={2} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] text-[#0b1c30] font-medium mb-0.5">
                        {item.title || `Semester ${item.semNumber}`}
                      </Text>
                      <Text className="text-[13px] text-[#434655]">
                        {branchName}{branchShort ? ` (${branchShort})` : ''}
                      </Text>
                    </View>
                    <ChevronRight color="#c1c3ce" size={20} />
                  </TouchableOpacity>
                )
              }}
            />
          )}
        </>
      ) : (
        /* ═══ Default Featured Categories ═══ */
        <>
          <View className="flex-row items-center gap-2 mb-5">
            <Sparkles color="#f59e0b" size={20} />
            <Text className="text-[19px] text-[#0b1c30] font-bold">Available Courses</Text>
          </View>

          {featuredLoading ? (
            <View style={{ gap: 16 }}>
              <Skeleton width="40%" height={24} borderRadius={8} />
              <Skeleton width="100%" height={80} borderRadius={16} />
              <Skeleton width="100%" height={80} borderRadius={16} />
              <View style={{ height: 20 }} />
              <Skeleton width="40%" height={24} borderRadius={8} />
              <Skeleton width="100%" height={80} borderRadius={16} />
              <Skeleton width="100%" height={80} borderRadius={16} />
            </View>
          ) : categories.length > 0 ? (
            <FlatList
              data={categories}
              keyExtractor={item => `cat_${item.semNumber}`}
              contentContainerStyle={{ gap: 20, paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: category }) => (
                <View>
                  {/* Category Header */}
                  <View className="flex-row items-center mb-3">
                    <View className="w-7 h-7 rounded-lg bg-[#2563eb] items-center justify-center mr-2">
                      <BookOpen color="#ffffff" size={14} />
                    </View>
                    <Text className="text-[16px] font-bold text-[#0b1c30]">{category.title}</Text>
                    <View className="ml-2 bg-[#eff6ff] px-2 py-0.5 rounded-full">
                      <Text className="text-[11px] text-[#2563eb] font-bold">{category.courses?.length || 0}</Text>
                    </View>
                  </View>

                  {/* Course Cards */}
                  <View style={{ gap: 10 }}>
                    {(category.courses || []).map((course: any) => {
                      const colors = getBranchColor(course.branchShortName);
                      return (
                        <TouchableOpacity
                          key={course._id}
                          onPress={() => Linking.openURL(course.detailsUrl || 'https://campusifyplus.in/online-classes/')}
                          className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 flex-row items-center active:scale-[0.97]"
                          style={cardShadow}
                        >
                          <View 
                            className="w-[44px] h-[44px] rounded-[12px] items-center justify-center mr-3"
                            style={{ backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}
                          >
                            <GraduationCap color={colors.text} size={20} strokeWidth={2} />
                          </View>
                          <View className="flex-1 mr-2">
                            <Text className="text-[14px] text-[#0b1c30] font-semibold mb-0.5" numberOfLines={1}>
                              {course.title}
                            </Text>
                            <View className="flex-row items-center gap-2">
                              <View 
                                className="px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}
                              >
                                <Text style={{ color: colors.text, fontSize: 10, fontWeight: '700' }}>
                                  {course.branchShortName || course.branchName}
                                </Text>
                              </View>
                              {course.price && (
                                <Text className="text-[12px] text-[#434655]">₹{course.price}</Text>
                              )}
                            </View>
                          </View>
                          <ChevronRight color="#c1c3ce" size={18} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-[#434655] text-center text-[15px]">No courses available yet</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}
