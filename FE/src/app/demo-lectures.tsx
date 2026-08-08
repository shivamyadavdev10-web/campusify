import React, { useState, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, FlatList, TouchableOpacity, Platform, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/core/api/client';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Stack } from 'expo-router';
import { PlayCircle, Clock, Video, BookOpen } from 'lucide-react-native';
import VideoPlayer from '@/src/features/video/components/VideoPlayer';
import { useUIStore } from '@/src/core/stores/ui.store';

// Crash-safe ErrorBoundary for VideoPlayer
class VideoErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.warn('VideoPlayer error:', error, info); this.props.onError(); }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

const cardShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  android: { elevation: 2 },
  default: {},
});

export default function DemoLecturesScreen() {
  const [activeVideo, setActiveVideo] = useState<{ bunnyVideoId: string; title: string } | null>(null);
  const { showToast } = useUIStore();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['free-contents'],
    queryFn: () => apiClient.get('/curriculum/contents/free').then(res => res.data),
  });

  const freeContents = (data?.contents || []).filter((c: any) => c.type === 'video');

  const handlePlayVideo = useCallback((content: any) => {
    if (content.bunnyVideoId) {
      setActiveVideo({ bunnyVideoId: content.bunnyVideoId, title: content.title });
    } else {
      showToast('This video is not available yet', 'info');
    }
  }, [showToast]);

  if (isError) return <ErrorState message="Failed to load demo lectures" onRetry={refetch} />;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Demo Lectures' }} />

      {/* Header banner */}
      <View className="bg-[#22c55e] mx-4 mt-4 mb-2 rounded-2xl px-5 py-4" style={{ elevation: 4 }}>
        <View className="flex-row items-center mb-1">
          <PlayCircle color="#ffffff" size={20} />
          <Text className="text-white text-lg font-bold ml-2">Free Demo Lectures</Text>
        </View>
        <Text className="text-white/80 text-[13px]">
          Watch free video lectures before you buy
        </Text>
      </View>

      {isLoading ? (
        <View className="px-4 pt-4" style={{ gap: 12 }}>
          <Skeleton width="100%" height={80} borderRadius={16} />
          <Skeleton width="100%" height={80} borderRadius={16} />
          <Skeleton width="100%" height={80} borderRadius={16} />
        </View>
      ) : (
        <FlatList
          data={freeContents}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          ListEmptyComponent={<EmptyState message="No free demo lectures available right now" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-surface-container-lowest border border-outline-variant rounded-[16px] overflow-hidden active:scale-[0.98]"
              style={cardShadow}
              onPress={() => handlePlayVideo(item)}
            >
              <View className="flex-row items-center p-4">
                <View className="w-[48px] h-[48px] rounded-[14px] bg-[#f0fdf4] border border-[#dcfce7] items-center justify-center mr-3">
                  <Video color="#22c55e" size={22} strokeWidth={2} />
                </View>
                <View className="flex-1 mr-2">
                  <Text className="text-on-surface font-semibold text-[15px] mb-1" numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View className="flex-row items-center flex-wrap" style={{ gap: 8 }}>
                    {item.subjectId?.name && (
                      <View className="flex-row items-center">
                        <BookOpen color="#737686" size={11} />
                        <Text className="text-on-surface-variant text-[11px] ml-1">{item.subjectId.name}</Text>
                      </View>
                    )}
                    {item.duration && (
                      <View className="flex-row items-center">
                        <Clock color="#737686" size={11} />
                        <Text className="text-on-surface-variant text-[11px] ml-1">{item.duration}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View className="bg-[#22c55e] w-[40px] h-[40px] rounded-full items-center justify-center">
                  <PlayCircle color="#ffffff" size={20} fill="#22c55e" />
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Video Player Modal */}
      <Modal
        visible={!!activeVideo}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setActiveVideo(null)}
      >
        <View style={modalStyles.bg}>
          {activeVideo && activeVideo.bunnyVideoId && (
            <VideoErrorBoundary onError={() => setActiveVideo(null)}>
              <VideoPlayer
                bunnyVideoId={activeVideo.bunnyVideoId}
                isActive={true}
                onClose={() => setActiveVideo(null)}
              />
              <View style={modalStyles.titleBar}>
                <Text style={modalStyles.title}>{activeVideo.title}</Text>
                <View style={modalStyles.freeBadge}>
                  <Text style={modalStyles.freeText}>FREE DEMO</Text>
                </View>
              </View>
            </VideoErrorBoundary>
          )}
        </View>
      </Modal>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  titleBar: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { color: '#f3f4f6', fontWeight: 'bold', fontSize: 16 },
  freeBadge: { backgroundColor: 'rgba(34, 197, 94, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 8 },
  freeText: { color: '#22c55e', fontSize: 11, fontWeight: 'bold' },
});
