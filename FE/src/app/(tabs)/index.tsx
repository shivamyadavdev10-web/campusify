import React, { useState, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Platform, Modal, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/core/api/client';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { useRouter } from 'expo-router';
import { Search, Filter, Megaphone, Layers, Flame, PlayCircle, GraduationCap, ChevronRight, Star, Clock, Video } from 'lucide-react-native';
import { BranchSelectModal } from '@/src/components/ui/BranchSelectModal';
import VideoPlayer from '@/src/features/video/components/VideoPlayer';
import { useUIStore } from '@/src/core/stores/ui.store';

const cardShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  android: { elevation: 2 },
  default: {},
});

const cardShadowMd = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  android: { elevation: 4 },
  default: {},
});

// Crash-safe wrapper: if VideoPlayer throws, shows error UI instead of crashing app
class VideoErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.warn('VideoPlayer error:', error, info); this.props.onError(); }
  render() {
    if (this.state.hasError) return null; // onError already closes the modal
    return this.props.children;
  }
}

export default function HomeScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'branches' | 'trending' | 'demo'>('branches');

  // Video player state for demo lectures
  const [activeVideo, setActiveVideo] = useState<{ bunnyVideoId: string; title: string } | null>(null);

  const { showToast } = useUIStore();

  // Fetch branches
  const { data: branchesData, isLoading: branchesLoading, isError: branchesError, error: branchesQueryError, refetch: refetchBranches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => apiClient.get('/curriculum/branches').then(res => res.data)
  });

  // Fetch trending courses
  const { data: trendingData, isLoading: trendingLoading, refetch: refetchTrending } = useQuery({
    queryKey: ['trending-courses'],
    queryFn: () => apiClient.get('/curriculum/courses/trending').then(res => res.data)
  });

  // Fetch demo (free) lectures
  const { data: freeData, isLoading: freeLoading, refetch: refetchFree } = useQuery({
    queryKey: ['free-contents'],
    queryFn: () => apiClient.get('/curriculum/contents/free').then(res => res.data)
  });

  // Fetch dynamic banner
  const { data: bannerData, refetch: refetchBanner } = useQuery({
    queryKey: ['home-banner'],
    queryFn: () => apiClient.get('/curriculum/banner').then(res => res.data)
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchBranches(), refetchTrending(), refetchFree(), refetchBanner()]);
    setRefreshing(false);
  }, [refetchBranches, refetchTrending, refetchFree, refetchBanner]);

  // Play free/demo video — use bunnyVideoId directly, no API call needed
  const handlePlayDemoVideo = useCallback((content: any) => {
    if (content.bunnyVideoId) {
      setActiveVideo({ bunnyVideoId: content.bunnyVideoId, title: content.title });
    } else {
      showToast('This video is not available yet', 'info');
    }
  }, [showToast]);

  if (branchesError) {
    const errorMsg = branchesQueryError instanceof Error ? branchesQueryError.message : String(branchesQueryError);
    const apiBase = apiClient.defaults.baseURL;
    return (
      <ErrorState 
        message="Failed to load home feed" 
        details={`${errorMsg}\nAPI URL: ${apiBase}`}
        onRetry={onRefresh} 
      />
    );
  }

  const displayedBranches = selectedBranch 
    ? branchesData?.branches?.filter((b: any) => b._id === selectedBranch._id) 
    : branchesData?.branches;

  const trendingCourses = trendingData?.courses || [];
  const freeContents = (freeData?.contents || []).filter((c: any) => c.type === 'video');

  return (
    <>
      <ScrollView 
        className="flex-1 bg-background"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#004ac6" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header & Search */}
        <View className="pt-16 pb-4 px-5">
          <View className="flex-row items-baseline mb-6">
            <Text className="text-3xl font-bold text-on-surface">Campusify</Text>
            <View className="w-2 h-2 rounded-full bg-[#f97316] ml-1" />
          </View>

          <View className="flex-row mb-6" style={{ gap: 10 }}>
            <TouchableOpacity 
              className="flex-1 flex-row items-center bg-surface-container-lowest rounded-xl px-4 py-3 border border-outline-variant active:scale-95"
              style={cardShadow}
              onPress={() => router.push('/search')}
            >
              <Search color="#737686" size={20} />
              <Text className="text-on-surface-variant flex-1 ml-3">Search Semesters...</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-row items-center bg-surface-container-lowest rounded-xl px-4 py-3 border border-outline-variant active:bg-surface-container-low"
              style={cardShadow}
              onPress={() => setModalVisible(true)}
            >
              <Filter color="#737686" size={18} />
              <Text className="text-on-surface-variant font-medium ml-2">
                {selectedBranch ? (selectedBranch.shortName || selectedBranch.name || 'Filter') : 'All'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hero Banner - Dynamic */}
          {bannerData?.banner ? (
            <View className="bg-[#4182f9] rounded-2xl p-5 mb-6" style={cardShadowMd}>
              {bannerData.banner.subtitle && (
                <View className="bg-[#5c95fa] self-start px-3 py-1.5 rounded-full flex-row items-center mb-3">
                  <Megaphone color="#ffffff" size={14} />
                  <Text className="text-white text-[11px] font-semibold ml-2">{bannerData.banner.subtitle}</Text>
                </View>
              )}
              <Text className="text-white text-[22px] leading-tight font-bold mb-4 pr-6">{bannerData.banner.title || 'Explore Our Courses'}</Text>
              <TouchableOpacity 
                className="bg-white self-start px-5 py-2.5 rounded-xl active:opacity-90"
                onPress={() => router.push('/search')}
              >
                <Text className="text-[#4182f9] font-bold text-sm">Explore Courses</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-[#4182f9] rounded-2xl p-5 mb-6" style={cardShadowMd}>
              <View className="bg-[#5c95fa] self-start px-3 py-1.5 rounded-full flex-row items-center mb-3">
                <Megaphone color="#ffffff" size={14} />
                <Text className="text-white text-[11px] font-semibold ml-2">Welcome to Campusify</Text>
              </View>
              <Text className="text-white text-[22px] leading-tight font-bold mb-4 pr-6">Master your Diploma Exams</Text>
              <TouchableOpacity 
                className="bg-white self-start px-5 py-2.5 rounded-xl active:opacity-90"
                onPress={() => router.push('/search')}
              >
                <Text className="text-[#4182f9] font-bold text-sm">Explore Courses</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ═══════ Quick Links Grid — Tabbed Style ═══════ */}
          <View className="flex-row justify-between mb-6 px-2">
            <TouchableOpacity 
              className="items-center active:scale-95" 
              onPress={() => setActiveTab('branches')}
            >
              <View 
                className={`w-[68px] h-[68px] rounded-[20px] items-center justify-center mb-2 border ${
                  activeTab === 'branches' 
                    ? 'bg-[#4182f9] border-[#4182f9]' 
                    : 'bg-surface-container-lowest border-outline-variant'
                }`}
                style={cardShadow}
              >
                <Layers 
                  color={activeTab === 'branches' ? '#ffffff' : '#4182f9'} 
                  size={28} 
                  strokeWidth={2.5} 
                />
              </View>
              <Text 
                className={`text-[11px] text-center leading-tight ${
                  activeTab === 'branches' ? 'text-[#4182f9] font-bold' : 'text-on-surface-variant font-medium'
                }`}
              >
                Diploma{'\n'}Courses
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="items-center active:scale-95"
              onPress={() => setActiveTab('trending')}
            >
              <View 
                className={`w-[68px] h-[68px] rounded-[20px] items-center justify-center mb-2 border ${
                  activeTab === 'trending' 
                    ? 'bg-[#ef4444] border-[#ef4444]' 
                    : 'bg-[#fff0f0] border-[#ffe4e4]'
                }`}
                style={cardShadow}
              >
                <Flame 
                  color={activeTab === 'trending' ? '#ffffff' : '#ef4444'} 
                  size={28} 
                  strokeWidth={2.5} 
                />
              </View>
              <Text 
                className={`text-[11px] text-center leading-tight ${
                  activeTab === 'trending' ? 'text-[#ef4444] font-bold' : 'text-on-surface-variant font-medium'
                }`}
              >
                Trending{'\n'}Courses
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="items-center active:scale-95"
              onPress={() => setActiveTab('demo')}
            >
              <View 
                className={`w-[68px] h-[68px] rounded-[20px] items-center justify-center mb-2 border ${
                  activeTab === 'demo' 
                    ? 'bg-[#22c55e] border-[#22c55e]' 
                    : 'bg-[#f0fdf4] border-[#dcfce7]'
                }`}
                style={cardShadow}
              >
                <PlayCircle 
                  color={activeTab === 'demo' ? '#ffffff' : '#22c55e'} 
                  size={28} 
                  strokeWidth={2.5} 
                />
              </View>
              <Text 
                className={`text-[11px] text-center leading-tight ${
                  activeTab === 'demo' ? 'text-[#22c55e] font-bold' : 'text-on-surface-variant font-medium'
                }`}
              >
                Demo{'\n'}Lectures
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats Card */}
          <View className="bg-surface-container-lowest rounded-2xl p-4 flex-row border border-outline-variant mb-8 mx-1" style={cardShadow}>
            <View className="flex-1 flex-row items-center justify-center border-r border-outline-variant pr-2">
              <GraduationCap color="#4182f9" size={20} strokeWidth={2.5} />
              <View className="ml-2">
                <Text className="text-on-surface font-bold text-[15px]">2.7 Lakh+</Text>
                <Text className="text-on-surface-variant text-[10px]">Students Helped</Text>
              </View>
            </View>
            <View className="flex-1 flex-row items-center justify-center pl-2">
              <Star color="#f97316" fill="#f97316" size={20} />
              <View className="ml-2">
                <Text className="text-on-surface font-bold text-[15px]">4.8/5.0</Text>
                <Text className="text-on-surface-variant text-[10px]">Average Rating</Text>
              </View>
            </View>
          </View>

          {/* ═══════ Tab Sections (Only render the active one) ═══════ */}
          
          {/* Section 1: Available Branches (Diploma Courses) */}
          {activeTab === 'branches' && (
            <View className="mb-8 px-1">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-lg bg-[#4182f9] items-center justify-center mr-2">
                    <Layers color="#ffffff" size={16} />
                  </View>
                  <Text className="text-[17px] font-bold text-on-surface">Diploma Courses</Text>
                </View>
              </View>
              
              {branchesLoading ? (
                <View style={{ gap: 12 }}>
                  <Skeleton width="100%" height={80} borderRadius={16} />
                  <Skeleton width="100%" height={80} borderRadius={16} />
                </View>
              ) : displayedBranches?.length ? (
                <View style={{ gap: 10 }}>
                  {displayedBranches.map((branch: any) => (
                    <TouchableOpacity 
                      key={branch._id}
                      className="bg-surface-container-lowest border border-outline-variant rounded-[18px] p-4 flex-row items-center justify-between active:scale-[0.97]"
                      style={cardShadow}
                      onPress={() => router.push({ pathname: '/semesters/[branchId]', params: { branchId: branch._id, branchName: branch.name || 'Semesters' } })}
                    >
                      <View className="flex-row items-center">
                        <View className="w-[46px] h-[46px] rounded-[14px] bg-[#f0f5ff] flex items-center justify-center mr-4">
                          <GraduationCap color="#4182f9" size={22} strokeWidth={2} />
                        </View>
                        <View>
                          <Text className="font-semibold text-on-surface text-[15px] mb-0.5">{branch.name || 'Unknown Branch'}</Text>
                          <Text className="text-on-surface-variant text-xs">{branch.shortName || ''}</Text>
                        </View>
                      </View>
                      <ChevronRight color="#c1c3ce" size={20} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View className="py-8 items-center border border-outline-variant rounded-[18px]">
                  <Text className="text-on-surface-variant">No branches available</Text>
                </View>
              )}
            </View>
          )}

          {/* Section 2: Trending Courses */}
          {activeTab === 'trending' && (
            <View className="mb-8 px-1">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-lg bg-[#ef4444] items-center justify-center mr-2">
                    <Flame color="#ffffff" size={16} fill="#fff" />
                  </View>
                  <Text className="text-[17px] font-bold text-on-surface">Trending Courses</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/trending')}>
                  <Text className="text-[#4182f9] text-[12px] font-semibold">See All →</Text>
                </TouchableOpacity>
              </View>

              {trendingLoading ? (
                <View style={{ gap: 10 }}>
                  <Skeleton width="100%" height={80} borderRadius={16} />
                  <Skeleton width="100%" height={80} borderRadius={16} />
                </View>
              ) : trendingCourses.length > 0 ? (
                <View style={{ gap: 10 }}>
                  {trendingCourses.slice(0, 7).map((course: any, index: number) => {
                    const branchName = course.branchId?.name || 'Unknown';
                    const branchShort = course.branchId?.shortName || '';
                    return (
                      <TouchableOpacity
                        key={course._id}
                        className="bg-surface-container-lowest border border-outline-variant rounded-[18px] overflow-hidden active:scale-[0.97]"
                        style={cardShadow}
                        onPress={() => router.push(`/subjects/${course._id}`)}
                      >
                        <View className="flex-row">
                          {/* Rank badge */}
                          <View className="w-[48px] bg-[#ef4444]/5 items-center justify-center border-r border-outline-variant">
                            <Text className="text-[#ef4444] text-[18px] font-bold">#{index + 1}</Text>
                          </View>
                          {/* Content */}
                          <View className="flex-1 p-3.5 flex-row items-center">
                            <View className="w-[40px] h-[40px] rounded-[10px] bg-[#f0f5ff] items-center justify-center mr-3">
                              <GraduationCap color="#4182f9" size={20} strokeWidth={2} />
                            </View>
                            <View className="flex-1 mr-2">
                              <Text className="text-on-surface font-semibold text-[14px] mb-0.5" numberOfLines={1}>
                                {course.title || `Semester ${course.semNumber}`}
                              </Text>
                              <Text className="text-on-surface-variant text-[11px]" numberOfLines={1}>
                                {branchShort ? `${branchShort} • ${branchName}` : branchName}
                              </Text>
                            </View>
                            <View className="items-end">
                              <Text className="text-[#4182f9] font-bold text-[13px]">₹{course.price}</Text>
                              <ChevronRight color="#c1c3ce" size={16} />
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View className="py-6 items-center border border-outline-variant rounded-2xl">
                  <Text className="text-on-surface-variant text-sm">No trending courses yet</Text>
                </View>
              )}
            </View>
          )}

          {/* Section 3: Demo Lectures */}
          {activeTab === 'demo' && (
            <View className="mb-8 px-1">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-lg bg-[#22c55e] items-center justify-center mr-2">
                    <PlayCircle color="#ffffff" size={16} />
                  </View>
                  <Text className="text-[17px] font-bold text-on-surface">Demo Lectures</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/demo-lectures')}>
                  <Text className="text-[#4182f9] text-[12px] font-semibold">See All →</Text>
                </TouchableOpacity>
              </View>

              {freeLoading ? (
                <View style={{ gap: 10 }}>
                  <Skeleton width="100%" height={72} borderRadius={14} />
                  <Skeleton width="100%" height={72} borderRadius={14} />
                </View>
              ) : freeContents.length > 0 ? (
                <View style={{ gap: 10 }}>
                  {freeContents.slice(0, 7).map((content: any) => (
                    <TouchableOpacity
                      key={content._id}
                      className="bg-surface-container-lowest border border-outline-variant rounded-[16px] p-4 flex-row items-center active:scale-[0.98]"
                      style={cardShadow}
                      onPress={() => handlePlayDemoVideo(content)}
                    >
                      <View className="w-[44px] h-[44px] rounded-[12px] bg-[#f0fdf4] border border-[#dcfce7] items-center justify-center mr-3">
                        <Video color="#22c55e" size={20} strokeWidth={2} />
                      </View>
                      <View className="flex-1 mr-2">
                        <Text className="text-on-surface font-semibold text-[14px] mb-0.5" numberOfLines={1}>
                          {content.title}
                        </Text>
                        <View className="flex-row items-center" style={{ gap: 8 }}>
                          {content.subjectId?.name && (
                            <Text className="text-on-surface-variant text-[11px]" numberOfLines={1}>
                              {content.subjectId.name}
                            </Text>
                          )}
                          {content.duration && (
                            <View className="flex-row items-center">
                              <Clock color="#737686" size={10} />
                              <Text className="text-on-surface-variant text-[11px] ml-1">{content.duration}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View className="bg-[#22c55e]/10 px-2.5 py-1 rounded-full flex-row items-center">
                        <PlayCircle color="#22c55e" size={12} />
                        <Text className="text-[#22c55e] text-[10px] font-bold ml-1">PLAY</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View className="py-6 items-center border border-outline-variant rounded-2xl">
                  <Text className="text-on-surface-variant text-sm">No demo lectures available</Text>
                </View>
              )}
            </View>
          )}
        </View>
        
        <BranchSelectModal 
          visible={modalVisible} 
          onClose={() => setModalVisible(false)} 
          branches={branchesData?.branches || []} 
          selectedBranchId={selectedBranch?._id}
          onSelect={(branch) => {
            setSelectedBranch(branch);
            setModalVisible(false);
          }}
        />
      </ScrollView>

      {/* ═══════ Video Player Modal for Demo Lectures ═══════ */}
      <Modal
        visible={!!activeVideo}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setActiveVideo(null)}
      >
        <View className="flex-1 bg-black justify-center">
          {activeVideo && activeVideo.bunnyVideoId ? (
            <VideoErrorBoundary onError={() => setActiveVideo(null)}>
              <VideoPlayer
                bunnyVideoId={activeVideo.bunnyVideoId}
                isActive={true}
                onClose={() => setActiveVideo(null)}
              />
              <View className="px-5 py-4">
                <Text className="text-white font-bold text-base">{activeVideo.title}</Text>
                <View className="flex-row items-center mt-1">
                  <View className="bg-[#22c55e]/20 px-2 py-0.5 rounded-full">
                    <Text className="text-[#22c55e] text-[11px] font-bold">FREE DEMO</Text>
                  </View>
                </View>
              </View>
            </VideoErrorBoundary>
          ) : null}
        </View>
      </Modal>
    </>
  );
}
