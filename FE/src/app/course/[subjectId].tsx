import React, { useState, useMemo, useCallback } from 'react';
import { View, FlatList, Modal, Linking, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/core/api/client';
import { useUIStore } from '@/src/core/stores/ui.store';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import UnitSection from '@/src/features/curriculum/components/UnitSection';
import VideoPlayer from '@/src/features/video/components/VideoPlayer';
import { Lock, BookOpen, X } from 'lucide-react-native';
import { Content } from '@/src/types/curriculum.types';

export default function CourseContentScreen() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const { showToast } = useUIStore();
  const navigation = useNavigation();

  const [activeVideo, setActiveVideo] = useState<{ url: string; directUrl?: string } | null>(null);
  const [fetchingVideo, setFetchingVideo] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['contents', subjectId],
    queryFn: () => apiClient.get(`/curriculum/contents/${subjectId}`).then(res => res.data),
    enabled: !!subjectId,
  });

  const { contents = [], isSemesterPurchased = false } = data || {};

  // Group contents by unit, preserving natural order
  const units = useMemo(() => {
    const unitMap = new Map<string, Content[]>();
    (contents as Content[]).forEach((item) => {
      const unitKey = item.unit || 'Other';
      if (!unitMap.has(unitKey)) unitMap.set(unitKey, []);
      unitMap.get(unitKey)!.push(item);
    });
    return Array.from(unitMap.entries()).map(([unitName, items]) => ({ unitName, contents: items }));
  }, [contents]);

  const handleContentPress = useCallback(async (content: Content) => {
    // Gate: locked content that isn't free and semester isn't purchased
    if (content.isLocked && !content.isFree && !isSemesterPurchased) {
      showToast('🔒 Purchase this semester to unlock all content', 'warning');
      return;
    }

    if (content.type === 'pdf' || content.type === 'notes') {
      if (content.fileUrl) {
        Linking.openURL(content.fileUrl).catch(() =>
          showToast('Could not open the file. Try again.', 'error')
        );
      } else {
        showToast('File not available yet', 'info');
      }
      return;
    }

    if (content.type === 'video') {
      setFetchingVideo(true);
      try {
        // Free content uses the public free-stream-url endpoint
        // Paid (purchased) content uses the authenticated stream-url endpoint
        const endpoint = content.isFree
          ? `/curriculum/free-stream-url/${content._id}`
          : `/curriculum/stream-url/${content._id}`;

        const res = await apiClient.get(endpoint);

        if (res.data?.videoUrl) {
          setActiveVideo({ url: res.data.videoUrl, directUrl: res.data.videoDirectUrl });
        } else {
          showToast('Stream URL not available', 'error');
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Failed to load video';
        showToast(msg, 'error');
      } finally {
        setFetchingVideo(false);
      }
    }
  }, [isSemesterPurchased, showToast]);

  const closeVideo = useCallback(() => {
    setActiveVideo(null);
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View className="flex-1 bg-[#121212] p-4" style={{ gap: 12 }}>
        <Skeleton width="100%" height={56} borderRadius={12} />
        <Skeleton width="100%" height={56} borderRadius={12} />
        <Skeleton width="100%" height={56} borderRadius={12} />
        <Skeleton width="80%" height={56} borderRadius={12} />
      </View>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load course content" onRetry={refetch} />;
  }

  return (
    <View className="flex-1 bg-[#121212]">

      {/* Purchase banner for non-purchased semesters */}
      {!isSemesterPurchased && (
        <TouchableOpacity
          activeOpacity={0.85}
          className="mx-4 mt-3 mb-1 bg-[#6366f1]/10 border border-[#6366f1]/30 rounded-xl px-4 py-3 flex-row items-center"
        >
          <Lock color="#6366f1" size={16} />
          <Text className="text-[#a5b4fc] text-sm font-medium ml-2 flex-1">
            Purchase this semester to unlock all videos & notes
          </Text>
        </TouchableOpacity>
      )}

      {/* Unit list */}
      <FlatList
        data={units}
        keyExtractor={item => item.unitName}
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 10 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={<BookOpen color="#6366f1" size={48} />}
            title="No Content Yet"
            description="Content for this subject will appear here once uploaded"
          />
        }
        renderItem={({ item, index }) => (
          <UnitSection
            unitName={item.unitName}
            contents={item.contents}
            isSemesterPurchased={isSemesterPurchased}
            onContentPress={handleContentPress}
            initialExpanded={index === 0}
          />
        )}
      />

      {/* Full-screen video modal */}
      <Modal
        visible={!!activeVideo || fetchingVideo}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeVideo}
      >
        <View className="flex-1 bg-black justify-center">
          {fetchingVideo ? (
            <View className="items-center">
              <Text className="text-white mb-3">Loading stream…</Text>
              <View className="w-8 h-8 rounded-full border-2 border-[#6366f1] border-t-transparent animate-spin" />
            </View>
          ) : activeVideo ? (
            <VideoPlayer
              streamUrl={activeVideo.url}
              directUrl={activeVideo.directUrl}
              isActive={true}
              onClose={closeVideo}
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}
