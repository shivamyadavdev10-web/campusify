import React, { useState, useMemo, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { View, FlatList, Modal, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/core/api/client';
import { useUIStore } from '@/src/core/stores/ui.store';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import UnitSection from '@/src/features/curriculum/components/UnitSection';
import VideoPlayer from '@/src/features/video/components/VideoPlayer';
import PdfViewer from '@/src/features/pdf/components/PdfViewer';
import DetailsBottomBar from '@/src/components/ui/DetailsBottomBar';
import { Lock, BookOpen, X, ShieldCheck, FileText, ChevronLeft } from 'lucide-react-native';
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
  const { subjectId, detailsUrl } = useLocalSearchParams<{ subjectId: string; detailsUrl?: string }>();
  const { showToast } = useUIStore();
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState<'lectures' | 'materials'>('lectures');
  const [selectedMaterialCategory, setSelectedMaterialCategory] = useState<string | null>(null);

  const [activeVideo, setActiveVideo] = useState<{ contentId?: string; bunnyVideoId?: string; bunnyLibraryId?: string; hlsUrl?: string; title: string } | null>(null);
  const [activePdf, setActivePdf] = useState<{ url: string; title: string } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['contents', subjectId],
    queryFn: () => apiClient.get(`/curriculum/contents/${subjectId}`).then(res => res.data),
    enabled: !!subjectId,
  });

  const { contents = [], isSemesterPurchased = false } = data || {};

  const lectureContents = useMemo(() => {
    return (contents as Content[]).filter(c => c.type === 'video');
  }, [contents]);

  const materialContents = useMemo(() => {
    return (contents as Content[]).filter(c => c.type === 'pdf' || c.type === 'notes');
  }, [contents]);

  // Group lectures by unit
  const lectureUnits = useMemo(() => {
    const unitMap = new Map<string, Content[]>();
    lectureContents.forEach((item) => {
      const unitKey = item.unit || 'Other';
      if (!unitMap.has(unitKey)) unitMap.set(unitKey, []);
      unitMap.get(unitKey)!.push(item);
    });
    return Array.from(unitMap.entries()).map(([unitName, items]) => ({ unitName, contents: items }));
  }, [lectureContents]);

  // Group materials by selected category and unit
  const materialUnits = useMemo(() => {
    if (!selectedMaterialCategory) return [];
    
    const filteredMaterials = materialContents.filter(c => c.category === selectedMaterialCategory);
    const unitMap = new Map<string, Content[]>();
    filteredMaterials.forEach((item) => {
      const unitKey = item.unit || 'Other';
      if (!unitMap.has(unitKey)) unitMap.set(unitKey, []);
      unitMap.get(unitKey)!.push(item);
    });
    return Array.from(unitMap.entries()).map(([unitName, items]) => ({ unitName, contents: items }));
  }, [materialContents, selectedMaterialCategory]);

  const materialCategories = [
    { id: 'PYQ', label: 'PYQ', icon: <FileText color="#4f46e5" size={24} /> },
    { id: 'VVIMP', label: 'VVIMP', icon: <ShieldCheck color="#e11d48" size={24} /> },
    { id: 'PPT Notes', label: 'PPT Notes', icon: <BookOpen color="#059669" size={24} /> },
    { id: 'Notes', label: 'Notes', icon: <FileText color="#d97706" size={24} /> },
  ];

  const handleContentPress = useCallback(async (content: Content) => {
    // Gate: locked content that isn't free and semester isn't purchased
    if (content.isLocked && !content.isFree && !isSemesterPurchased) {
      showToast('🔒 Purchase this semester to unlock all content', 'warning');
      return;
    }

    if (content.type === 'pdf' || content.type === 'notes') {
      if (content.fileUrl) {
        setActivePdf({ url: content.fileUrl, title: content.title });
      } else {
        showToast('File not available yet', 'info');
      }
      return;
    }

    if (content.type === 'video') {
      if (content.bunnyVideoId) {
        setActiveVideo({ contentId: content._id, bunnyVideoId: content.bunnyVideoId, bunnyLibraryId: content.bunnyLibraryId ?? undefined, hlsUrl: content.hlsUrl ?? undefined, title: content.title });
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

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'lectures' && styles.tabButtonActive]}
          onPress={() => { setActiveTab('lectures'); setSelectedMaterialCategory(null); }}
        >
          <Text style={[styles.tabText, activeTab === 'lectures' && styles.tabTextActive]}>Lectures</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'materials' && styles.tabButtonActive]}
          onPress={() => setActiveTab('materials')}
        >
          <Text style={[styles.tabText, activeTab === 'materials' && styles.tabTextActive]}>Materials</Text>
        </TouchableOpacity>
      </View>

      {/* Purchase banner for non-purchased semesters */}
      {!isSemesterPurchased && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.purchaseBanner}
          onPress={() => showToast('Contact us to purchase: +91 7977675291', 'info')}
        >
          <View style={styles.purchaseIconWrap}>
            <ShieldCheck color="#4f46e5" size={18} />
          </View>
          <Text style={styles.purchaseText}>
            Purchase this semester to unlock all videos & notes
          </Text>
        </TouchableOpacity>
      )}

      {/* Content Area */}
      {activeTab === 'lectures' ? (
        <FlatList
          data={lectureUnits}
          keyExtractor={item => item.unitName}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon={<BookOpen color="#4f46e5" size={48} />}
              title="No Lectures Yet"
              description="Lectures for this subject will appear here once uploaded"
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
      ) : (
        /* Materials View */
        <View style={{ flex: 1 }}>
          {!selectedMaterialCategory ? (
            <ScrollView contentContainerStyle={styles.materialsGrid}>
              {materialCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.categoryCard}
                  onPress={() => setSelectedMaterialCategory(cat.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.categoryIconWrap}>
                    {cat.icon}
                  </View>
                  <Text style={styles.categoryTitle}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={{ flex: 1 }}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => setSelectedMaterialCategory(null)}
              >
                <ChevronLeft color="#4f46e5" size={20} />
                <Text style={styles.backButtonText}>Back to Materials</Text>
              </TouchableOpacity>

              <FlatList
                data={materialUnits}
                keyExtractor={item => item.unitName}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <EmptyState
                    icon={<FileText color="#4f46e5" size={48} />}
                    title={`No ${selectedMaterialCategory} Yet`}
                    description={`Content for ${selectedMaterialCategory} will appear here`}
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
            </View>
          )}
        </View>
      )}

      {/* Sticky Bottom CTA — Get More Details + WhatsApp */}
      <DetailsBottomBar detailsUrl={detailsUrl || 'https://campusifyplus.in/online-classes/'} />

      {/* Full-screen video modal */}
      <Modal
        visible={!!activeVideo}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeVideo}
      >
        <View style={styles.modalBg}>
          {activeVideo && (
            <VideoErrorBoundary onError={closeVideo}>
              <VideoPlayer
                bunnyVideoId={activeVideo.bunnyVideoId}
                hlsUrl={activeVideo.hlsUrl}
                isActive={true}
                onClose={closeVideo}
              />
              {/* Premium video title bar below player */}
              <View style={styles.videoTitleBar}>
                <View style={styles.videoTitleRow}>
                  <View style={styles.videoTitleIcon}>
                    <BookOpen color="#818cf8" size={14} />
                  </View>
                  <View style={styles.videoTitleContent}>
                    <Text style={styles.videoTitle} numberOfLines={2}>{activeVideo.title}</Text>
                    <View style={styles.nowPlayingBadge}>
                      <View style={styles.nowPlayingDot} />
                      <Text style={styles.nowPlayingText}>Now Playing</Text>
                    </View>
                  </View>
                </View>
              </View>
            </VideoErrorBoundary>
          )}
        </View>
      </Modal>

      {/* Full-screen PDF viewer modal */}
      <PdfViewer
        url={activePdf?.url || ''}
        title={activePdf?.title || 'Document'}
        visible={!!activePdf}
        onClose={() => setActivePdf(null)}
      />
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e7ff',
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#4f46e5',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4f46e5',
  },
  tabTextActive: {
    color: '#ffffff',
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
    paddingBottom: 80,
    gap: 12,
  },
  materialsGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingBottom: 80,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 4,
  },
  backButtonText: {
    color: '#4f46e5',
    fontSize: 15,
    fontWeight: '600',
  },
  // ── Video Modal ──
  modalBg: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
  },
  videoTitleBar: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  videoTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  videoTitleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(129, 140, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  videoTitleContent: {
    flex: 1,
  },
  videoTitle: {
    color: '#f3f4f6',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  nowPlayingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  nowPlayingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#818cf8',
  },
  nowPlayingText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
