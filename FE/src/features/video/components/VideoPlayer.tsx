import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Text, StyleSheet, Platform } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { X, WifiOff, AlertTriangle, RotateCcw } from 'lucide-react-native';
import { getBunnyHlsUrl } from '@/src/core/config/bunny';

interface VideoPlayerProps {
  bunnyVideoId?: string | null;
  hlsUrl?: string | null;         // Pre-built HLS URL from API (preferred)
  bunnyLibraryId?: string | null; // Kept for backward compat, no longer used for URL
  isActive: boolean;
  onClose?: () => void;
}

const MAX_RETRIES = 3;

export default function VideoPlayer({ bunnyVideoId, hlsUrl, isActive, onClose }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorType, setErrorType] = useState<'network' | 'source' | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // ── GUARD: Never render player with invalid ID ────────────────────────
  if (!bunnyVideoId || bunnyVideoId === 'null' || bunnyVideoId === 'undefined') {
    return (
      <View style={styles.container}>
        <View style={styles.overlay}>
          <Text style={styles.errorIcon}>🎬</Text>
          <Text style={styles.errorTitle}>Video Unavailable</Text>
          <Text style={styles.errorMsg}>
            This video is not yet available.{'\n'}Please check back later.
          </Text>
        </View>
        {onClose && (
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <X color="#ffffff" size={20} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!isActive) return null;

  // Resolve the video URL: prefer pre-built hlsUrl from API, else build from videoId
  const videoUrl = hlsUrl || getBunnyHlsUrl(bunnyVideoId);

  // ── Native Video Player ────────────────────────────────────────────────
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false;
    p.play();
  });

  // ── Player event listeners ─────────────────────────────────────────────
  useEffect(() => {
    if (!player) return;

    const statusSub = player.addListener('statusChange', (payload: any) => {
      const status = payload?.status ?? payload;
      if (status === 'readyToPlay') {
        setIsLoading(false);
        setHasError(false);
      } else if (status === 'loading') {
        setIsLoading(true);
      } else if (status === 'error') {
        setIsLoading(false);
        setHasError(true);
        setErrorType('source');
      }
    });

    return () => {
      statusSub.remove();
    };
  }, [player]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      try {
        player?.pause();
      } catch (e) {
        // Player may already be released
      }
    };
  }, [player]);

  const handleRetry = useCallback(() => {
    if (retryCount >= MAX_RETRIES) return;
    setRetryCount((c) => c + 1);
    setHasError(false);
    setErrorType(null);
    setIsLoading(true);
    try {
      player?.replace(videoUrl);
      player?.play();
    } catch (e) {
      // Ignore — player may be in bad state
    }
  }, [retryCount, player, videoUrl]);

  const handleClose = useCallback(() => {
    try {
      player?.pause();
    } catch (e) {
      // Ignore
    }
    onClose?.();
  }, [player, onClose]);

  const reachedMaxRetries = retryCount >= MAX_RETRIES;

  return (
    <View style={styles.container}>
      {/* Native Video View */}
      {!hasError && (
        <VideoView
          player={player}
          style={styles.videoView}
          contentFit="contain"
          nativeControls={true}
          allowsFullscreen={true}
          allowsPictureInPicture={Platform.OS === 'ios'}
        />
      )}

      {/* Loading overlay */}
      {isLoading && !hasError && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#818cf8" />
          <Text style={styles.loadingText}>Loading video…</Text>
        </View>
      )}

      {/* Error state */}
      {hasError && (
        <View style={styles.overlay}>
          {errorType === 'network' ? (
            <WifiOff color="#f87171" size={40} />
          ) : (
            <AlertTriangle color="#f87171" size={40} />
          )}
          <Text style={styles.errorTitle}>
            {errorType === 'network' ? 'No Internet' : 'Video Not Found'}
          </Text>
          <Text style={styles.errorMsg}>
            {errorType === 'network'
              ? 'Check your connection and try again.'
              : 'This video could not be loaded.\nIt may still be processing.'}
          </Text>

          {reachedMaxRetries ? (
            <Text style={styles.maxRetryMsg}>
              Too many retries. Please close and try again later.
            </Text>
          ) : (
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={handleRetry}
              activeOpacity={0.8}
            >
              <RotateCcw color="#ffffff" size={14} style={{ marginRight: 6 }} />
              <Text style={styles.retryText}>
                Retry ({MAX_RETRIES - retryCount} left)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Close button — always visible */}
      {onClose && (
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleClose}
          activeOpacity={0.7}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <X color="#ffffff" size={20} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
  },
  videoView: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 12,
    fontWeight: '500',
  },
  errorIcon: {
    fontSize: 38,
    marginBottom: 12,
  },
  errorTitle: {
    color: '#f87171',
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
  },
  errorMsg: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 19,
  },
  retryBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  maxRetryMsg: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
});
