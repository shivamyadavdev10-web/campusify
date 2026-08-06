import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useAppState } from '@/src/hooks/useAppState';
import { X } from 'lucide-react-native';

interface VideoPlayerProps {
  streamUrl: string;
  directUrl?: string;
  posterUrl?: string;
  isActive: boolean;
  onClose?: () => void;
}

export default function VideoPlayer({ streamUrl, directUrl, posterUrl, isActive, onClose }: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('Failed to load video');
  const [usingFallback, setUsingFallback] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appState = useAppState();

  // The URL currently being played
  const currentUrl = usingFallback && directUrl ? directUrl : streamUrl;

  // Clear timeout helper
  const clearLoadTimeout = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, []);

  // Fallback to MP4 direct URL
  const switchToFallback = useCallback(async () => {
    if (usingFallback || !directUrl) {
      // Already on fallback or no fallback available — show error
      setHasError(true);
      setErrorMessage('Video could not be loaded. Please try again later.');
      setIsBuffering(false);
      return;
    }
    
    console.log('[VideoPlayer] HLS failed, switching to MP4 fallback:', directUrl);
    setUsingFallback(true);
    setHasError(false);
    setIsBuffering(true);
    setHasStartedPlaying(false);
    
    try {
      await videoRef.current?.unloadAsync();
      await videoRef.current?.loadAsync({ uri: directUrl }, { shouldPlay: true });
    } catch {
      setHasError(true);
      setErrorMessage('Video could not be loaded. Please try again later.');
      setIsBuffering(false);
    }
  }, [usingFallback, directUrl]);

  // Loading timeout: if video doesn't start within 15s, try fallback
  useEffect(() => {
    if (isActive && !hasStartedPlaying && !hasError) {
      clearLoadTimeout();
      loadTimeoutRef.current = setTimeout(() => {
        if (!hasStartedPlaying) {
          console.log('[VideoPlayer] Loading timeout reached, attempting fallback...');
          switchToFallback();
        }
      }, 15000);
    }
    
    return clearLoadTimeout;
  }, [isActive, hasStartedPlaying, hasError, clearLoadTimeout, switchToFallback]);

  // Pause video when app goes to background
  useEffect(() => {
    if (appState !== 'active') {
      videoRef.current?.pauseAsync();
    }
  }, [appState]);

  // Pause when not active (modal closed, etc.)
  useEffect(() => {
    if (!isActive) {
      videoRef.current?.pauseAsync();
    }
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLoadTimeout();
      videoRef.current?.unloadAsync();
    };
  }, [clearLoadTimeout]);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error('[VideoPlayer] Playback error:', status.error);
        switchToFallback();
      }
      return;
    }
    
    // Video has started playing successfully
    if (status.isPlaying && !hasStartedPlaying) {
      setHasStartedPlaying(true);
      clearLoadTimeout();
    }
    
    setIsBuffering(status.isBuffering ?? false);
    setHasError(false);
  }, [hasStartedPlaying, switchToFallback, clearLoadTimeout]);

  const handleRetry = useCallback(async () => {
    // Reset everything and try from the beginning (HLS first)
    setHasError(false);
    setIsBuffering(true);
    setUsingFallback(false);
    setHasStartedPlaying(false);
    setErrorMessage('Failed to load video');
    
    try {
      await videoRef.current?.unloadAsync();
      await videoRef.current?.loadAsync({ uri: streamUrl }, { shouldPlay: true });
    } catch {
      switchToFallback();
    }
  }, [streamUrl, switchToFallback]);

  return (
    <View className="w-full aspect-video bg-black relative">
      <Video
        ref={videoRef}
        style={StyleSheet.absoluteFillObject}
        source={{ uri: currentUrl }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        isLooping={false}
        shouldPlay={isActive}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        posterSource={posterUrl ? { uri: posterUrl } : undefined}
        usePoster={!!posterUrl}
      />

      {/* Buffering indicator */}
      {isBuffering && !hasError && (
        <View className="absolute inset-0 items-center justify-center bg-black/40">
          <ActivityIndicator size="large" color="#6366f1" />
          {usingFallback && (
            <Text className="text-white/70 text-xs mt-2">Loading direct stream…</Text>
          )}
        </View>
      )}

      {/* Error state with retry */}
      {hasError && (
        <View className="absolute inset-0 items-center justify-center bg-black/80">
          <Text className="text-red-500 text-base font-bold mb-1">Playback Error</Text>
          <Text className="text-white/60 text-xs mb-4 px-8 text-center">{errorMessage}</Text>
          <TouchableOpacity
            className="bg-[#6366f1] px-6 py-2.5 rounded-lg"
            onPress={handleRetry}
          >
            <Text className="text-white font-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Close button */}
      {onClose && (
        <TouchableOpacity
          className="absolute top-4 right-4 bg-black/60 w-9 h-9 rounded-full items-center justify-center z-10"
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X color="#ffffff" size={20} />
        </TouchableOpacity>
      )}
    </View>
  );
}
