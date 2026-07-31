import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import { View, FlatList, Dimensions, StyleSheet, Text, ActivityIndicator, Image } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { axiosClient } from '../../api/axiosClient';

// Using window dimensions for snapping because FlatList pagingEnabled relies on viewport height
const { height: windowHeight, width: windowWidth } = Dimensions.get('window');

// Number of items adjacent to active index that keep their Video component mounted.
// Items outside this window render a lightweight placeholder instead.
const VIDEO_RENDER_WINDOW = 1; // active ± 1 = at most 3 <Video> components alive

interface ContentItem {
  _id: string;
  title: string;
  type: string;
  fileUrl: string | null;
  bunnyVideoId: string | null;
}

export default function FeedScreen() {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videos, setVideos] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // We'll rely on onLayout of the FlatList container to get the exact usable height for snapToInterval.
  const [containerHeight, setContainerHeight] = useState(windowHeight);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await axiosClient.get('/curriculum/contents/free');
      if (response.data?.status && response.data?.contents) {
        const videoList = response.data.contents.filter((c: any) => c.type === 'video');
        setVideos(videoList);
      }
    } catch (error) {
      console.error('Error fetching videos', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVideos();
  }, []);

  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveVideoIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // FIX: Memoize getItemLayout for fixed-height items to skip measurement passes
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: containerHeight,
    offset: containerHeight * index,
    index,
  }), [containerHeight]);

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (videos.length === 0) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <Text className="text-white text-lg">No videos available.</Text>
      </View>
    );
  }

  return (
    <View 
      className="flex-1 bg-black"
      onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
    >
      <FlatList
        data={videos}
        keyExtractor={(item) => item._id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        snapToInterval={containerHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        // FIX: Performance props to prevent OOM on large lists
        removeClippedSubviews={true}
        windowSize={3}            // Render at most 3 screens worth of items
        maxToRenderPerBatch={2}   // Render 2 items per batch during scroll
        initialNumToRender={1}    // Only render the first visible item on mount
        // Pull-to-refresh
        onRefresh={handleRefresh}
        refreshing={refreshing}
        renderItem={({ item, index }) => (
          <VideoItem 
            item={item} 
            isActive={activeVideoIndex === index}
            // FIX: Only mount the actual <Video> component for items within the render window
            shouldRenderVideo={Math.abs(activeVideoIndex - index) <= VIDEO_RENDER_WINDOW}
            height={containerHeight}
            width={windowWidth}
          />
        )}
      />
    </View>
  );
}

// FIX: Memoize VideoItem to prevent unnecessary re-renders when scrolling
const VideoItem = memo(({ item, isActive, shouldRenderVideo, height, width }: { 
  item: ContentItem; 
  isActive: boolean;
  shouldRenderVideo: boolean;
  height: number; 
  width: number;
}) => {
  const videoRef = useRef<Video>(null);
  const [isBuffering, setIsBuffering] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(item.fileUrl); 
  const [error, setError] = useState(false);

  // Fetch stream URL only when the item enters the render window
  useEffect(() => {
    if (shouldRenderVideo && !streamUrl && item.bunnyVideoId) {
      fetchStreamUrl(item._id);
    }
  }, [shouldRenderVideo, item._id, item.bunnyVideoId, streamUrl]);

  const fetchStreamUrl = async (contentId: string) => {
    try {
      const response = await axiosClient.get(`/curriculum/stream-url/${contentId}`);
      if (response.data?.success && response.data?.videoUrl) {
        setStreamUrl(response.data.videoUrl);
      } else if (response.data?.status && response.data?.fileUrl) {
        setStreamUrl(response.data.fileUrl);
      }
    } catch (err) {
      console.error('Error fetching stream URL', err);
      setError(true);
    }
  };

  // Play/pause lifecycle
  useEffect(() => {
    if (isActive && streamUrl && shouldRenderVideo) {
      videoRef.current?.playAsync();
    } else {
      videoRef.current?.pauseAsync();
    }
  }, [isActive, streamUrl, shouldRenderVideo]);

  // FIX: Unload the video source when it leaves the render window to free native memory
  useEffect(() => {
    if (!shouldRenderVideo && videoRef.current) {
      videoRef.current.unloadAsync();
    }
  }, [shouldRenderVideo]);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) setError(true);
      return;
    }
    setIsBuffering(status.isBuffering);
  }, []);

  return (
    <View style={{ width, height, backgroundColor: 'black' }} className="relative justify-center items-center">
      {/* Buffering indicator */}
      {isBuffering && !error && streamUrl && shouldRenderVideo && (
        <View className="absolute z-10 top-1/2 left-1/2 -mt-4 -ml-4">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      )}

      {/* Error state */}
      {error && (
         <View className="absolute z-10 top-1/2 left-1/2 -mt-4 -ml-16">
           <Text className="text-red-500 text-center">Failed to load video</Text>
         </View>
      )}

      {/* 
        FIX: MEMORY LEAK PREVENTION
        Only mount the <Video> component when the item is within VIDEO_RENDER_WINDOW 
        of the active index. Items outside the window show a lightweight placeholder.
        This prevents expo-av from keeping 10+ native video players in memory,
        which was causing OOM crashes on Android devices.
      */}
      {shouldRenderVideo && streamUrl && !error ? (
        <Video
          ref={videoRef}
          source={{ uri: streamUrl }}
          style={StyleSheet.absoluteFillObject}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay={isActive}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        />
      ) : !error ? (
        // Lightweight placeholder for items outside the render window
        <View className="absolute inset-0 bg-gray-900 justify-center items-center">
          <ActivityIndicator size="small" color="#4b5563" />
        </View>
      ) : null}
      
      {/* Video title overlay */}
      <View className="absolute bottom-10 left-4 right-4 z-20">
        <Text className="text-white text-xl font-bold mb-2">{item.title}</Text>
        <Text className="text-gray-300 text-sm">Scroll up to see more</Text>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if these specific props change
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.shouldRenderVideo === nextProps.shouldRenderVideo &&
    prevProps.item._id === nextProps.item._id &&
    prevProps.height === nextProps.height
  );
});
