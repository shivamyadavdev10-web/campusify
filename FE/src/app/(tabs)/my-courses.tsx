import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, Platform, StyleSheet
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/core/api/client';
import { useRouter } from 'expo-router';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { ErrorState } from '@/src/components/ui/ErrorState';
import {
  GraduationCap, ChevronRight, BookOpen, ShoppingBag, Layers
} from 'lucide-react-native';

const cardShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  android: { elevation: 3 },
  default: {},
});

export default function MyCoursesScreen() {
  const router = useRouter();

  const {
    data: profileData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient.get('/user/me').then(res => res.data.data),
  });

  const purchasedSemesters: any[] = profileData?.purchasedSemesters || [];

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Courses</Text>
        </View>
        <View style={styles.content}>
          {[1,2,3].map(i => (
            <Skeleton key={i} width="100%" height={90} borderRadius={18} />
          ))}
        </View>
      </View>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load your courses" onRetry={refetch} />;
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4182f9" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Courses</Text>
        <Text style={styles.headerSub}>{purchasedSemesters.length} enrolled</Text>
      </View>

      <View style={styles.content}>
        {purchasedSemesters.length === 0 ? (
          // Empty state
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <GraduationCap color="#4182f9" size={44} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>No courses yet</Text>
            <Text style={styles.emptyDesc}>
              Browse our diploma courses and enroll to start learning
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)')}
            >
              <ShoppingBag color="#fff" size={16} />
              <Text style={styles.browseBtnText}>Browse Courses</Text>
            </TouchableOpacity>
          </View>
        ) : (
          purchasedSemesters.map((sem: any, index: number) => {
            // sem may be a populated object or just an ID string
            const semId = typeof sem === 'string' ? sem : sem._id;
            const semTitle = typeof sem === 'object' ? (sem.title || `Semester ${sem.semNumber || (index + 1)}`) : `Semester ${index + 1}`;
            const branchName = typeof sem === 'object' ? (sem.branchId?.name || sem.branchId || '') : '';
            const semNumber = typeof sem === 'object' ? sem.semNumber : null;

            return (
              <TouchableOpacity
                key={semId || index}
                style={[styles.card, cardShadow]}
                activeOpacity={0.85}
                onPress={() => router.push({
                  pathname: '/subjects/[semesterId]',
                  params: { semesterId: semId, semesterName: semTitle }
                })}
              >
                <View style={styles.cardIcon}>
                  <GraduationCap color="#4182f9" size={22} strokeWidth={2} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{semTitle}</Text>
                  {branchName ? (
                    <View style={styles.cardMeta}>
                      <Layers color="#737686" size={11} />
                      <Text style={styles.cardMetaText}>{branchName}</Text>
                    </View>
                  ) : null}
                  {semNumber ? (
                    <View style={styles.semBadge}>
                      <Text style={styles.semBadgeText}>Sem {semNumber}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.cardRight}>
                  <View style={styles.enrolledBadge}>
                    <Text style={styles.enrolledText}>Enrolled</Text>
                  </View>
                  <ChevronRight color="#c1c3ce" size={18} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Footer CTA */}
      {purchasedSemesters.length > 0 && (
        <TouchableOpacity
          style={styles.moreCoursesBtn}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)')}
        >
          <BookOpen color="#4182f9" size={16} />
          <Text style={styles.moreCoursesBtnText}>Browse More Courses</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f5',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0b1c30',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: '#737686',
    marginTop: 2,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eef0f6',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#f0f5ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0b1c30',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    fontSize: 12,
    color: '#737686',
  },
  semBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f5ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  semBadgeText: {
    fontSize: 11,
    color: '#4182f9',
    fontWeight: '600',
  },
  cardRight: {
    alignItems: 'center',
    gap: 4,
  },
  enrolledBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  enrolledText: {
    fontSize: 10,
    color: '#16a34a',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: '#f0f5ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0b1c30',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#737686',
    textAlign: 'center',
    lineHeight: 20,
  },
  browseBtn: {
    marginTop: 8,
    backgroundColor: '#4182f9',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  browseBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  moreCoursesBtn: {
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#4182f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  moreCoursesBtnText: {
    color: '#4182f9',
    fontSize: 14,
    fontWeight: '700',
  },
});
