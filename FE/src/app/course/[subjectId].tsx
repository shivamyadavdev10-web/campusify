import React, { useState, useMemo, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { View, FlatList, Modal, Linking, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/core/api/client';
import { useUIStore } from '@/src/core/stores/ui.store';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import UnitSection from '@/src/features/curriculum/components/UnitSection';
import VideoPlayer from '@/src/features/video/components/VideoPlayer';
import { Lock, BookOpen, X, ShieldCheck } from 'lucide-react-native';
import { Content } from '@/src/types/curriculum.types';

// ErrorBoundary to prevent video player crashes from taking down the app
class VideoErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('VideoPlayer crashed:', error, errorInfo);
    this.props.onError();
  }
  reset() { this.setState({ hasError: false }); }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ color: '#f87171', fontSize: 36, marginBottom: 12 }}>⚠️</Text>
          <Text style={{ color: '#f87171', fontSize: 17, fontWeight: 'bold', marginBottom: 6 }}>Player Crashed</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', marginBottom: 20 }}>Something went wrong. Please close and try again.</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#6366f1', paddingHorizontal: 28, paddingVertical: 11, borderRadius: 10 }}
            onPress={this.props.onError}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Close</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function CourseContentScreen() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const { showToast } = useUIStore();
  const navigation = useNavigation();

  const [activeVideo, setActiveVideo] = useState<{ contentId?: string; bunnyVideoId?: string; bunnyLibraryId?: string; title: string } | null>(null);

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
        try {
          const canOpen = await Linking.canOpenURL(content.fileUrl);
          if (canOpen) {
            await Linking.openURL(content.fileUrl);
          } else {
            showToast('Cannot open this file type on your device', 'error');
          }
        } catch {
          showToast('Could not open the file. Try again.', 'error');
        }
      } else {
        showToast('File not available yet', 'info');
      }
      return;
    }

    if (content.type === 'video') {
      if (content.bunnyVideoId) {
        setActiveVideo({ contentId: content._id, bunnyVideoId: content.bunnyVideoId, bunnyLibraryId: content.bunnyLibraryId ?? undefined, title: content.title });
      } else if (content.isLocked) {
        showToast('🔒 Purchase this semester to watch this video', 'warning');
      } else {
        showToast('Video not available yet. Please try again later.', 'info');
      }
    }
  }, [isSemesterPurchased, showToast]);

  const closeVideo = useCallback(() => {
    setActiveVideo(null);
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Skeleton width="100%" height={56} borderRadius={16} />
        <Skeleton width="100%" height={56} borderRadius={16} />
        <Skeleton width="100%" height={56} borderRadius={16} />
        <Skeleton width="80%" height={56} borderRadius={16} />
      </View>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load course content" onRetry={refetch} />;
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      {/* Purchase banner for non-purchased semesters */}
      {!isSemesterPurchased && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.purchaseBanner}
          onPress={() => showToast('Contact us to purchase: +91 8104131420', 'info')}
        >
          <View style={styles.purchaseIconWrap}>
            <ShieldCheck color="#4f46e5" size={18} />
          </View>
          <Text style={styles.purchaseText}>
            Purchase this semester to unlock all videos & notes
          </Text>
        </TouchableOpacity>
      )}

      {/* Unit list */}
      <FlatList
        data={units}
        keyExtractor={item => item.unitName}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={<BookOpen color="#4f46e5" size={48} />}
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
        visible={!!activeVideo}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeVideo}
      >
        <View style={styles.modalBg}>
          {activeVideo && (
            <VideoErrorBoundary onError={closeVideo}>
              <VideoPlayer
                bunnyVideoId={activeVideo.bunnyVideoId}
                bunnyLibraryId={activeVideo.bunnyLibraryId}
                isActive={true}
                onClose={closeVideo}
              />
              {/* Video title bar below player */}
              <View style={styles.videoTitleBar}>
                <Text style={styles.videoTitle} numberOfLines={2}>{activeVideo.title}</Text>
              </View>
            </VideoErrorBoundary>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8f9ff',
    padding: 16,
    gap: 12,
  },
  purchaseBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  purchaseIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  purchaseText: {
    color: '#4f46e5',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  modalBg: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  videoTitleBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  videoTitle: {
    color: '#f3f4f6',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
