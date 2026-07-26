import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Orientation from 'react-native-orientation-locker';
import axiosClient from '../../api/axiosClient.api';
import { AdvancedCustomVideoPlayer } from '../../components/player/AdvancedCustomVideoPlayer';

export default function VideoPlayerScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  
  console.log("🔥 ROUTE PARAMS RECEIVED:", route.params);
  const { contentId, title } = route.params || {};

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      try {
        if (Orientation && Orientation.lockToPortrait) {
          Orientation.lockToPortrait();
        }
      } catch (error) {
        console.warn('Orientation lock error:', error);
      }
    };
  }, []);

  useEffect(() => {
    const fetchStreamUrl = async () => {
      if (!contentId) {
        console.error('No content ID provided');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        const response = await axiosClient.get(`/content/stream/${contentId}`);
        if (response.data && response.data.success && response.data.videoUrl) {
          setVideoUrl(response.data.videoUrl);
        } else {
          console.error('Failed to load video stream');
        }
      } catch (err: any) {
        console.error('Error fetching stream URL:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreamUrl();
  }, [contentId]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{title || 'Video Player'}</Text>
      </View>
      <View style={styles.playerWrapper}>
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#FF7755" />
            <Text style={styles.loadingText}>Fetching secure video stream...</Text>
          </View>
        ) : videoUrl && isFocused ? (
          <AdvancedCustomVideoPlayer sourceUrl={videoUrl} title={title} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  backText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  playerWrapper: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 15,
    fontSize: 16,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  }
});
