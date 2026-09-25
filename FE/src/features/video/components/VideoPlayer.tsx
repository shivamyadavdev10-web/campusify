import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Text, StyleSheet, Platform, Animated } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { X, WifiOff, AlertTriangle, RotateCcw, Volume2 } from 'lucide-react-native';
import { getBunnyHlsUrl } from '@/src/core/config/bunny';
import { useUserStore } from '@/src/core/stores/user.store';

interface VideoPlayerProps {
  bunnyVideoId?: string | null;
  hlsUrl?: string | null;         // Pre-built HLS URL from API (preferred)
  bunnyLibraryId?: string | null; // Kept for backward compat, no longer used for URL
  isActive: boolean;
  onClose?: () => void;
}

const MAX_RETRIES = 3;
const WATERMARK_INTERVAL = 5000; // move every 5 seconds

// ── Floating Watermark — forensic user identification on screen recording ─────
function FloatingWatermark({ email, phone }: { email: string; phone: string }) {
  const left   = useRef(new Animated.Value(30)).current;
  const top    = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const maskedPhone = phone ? phone.slice(0, 5) + 'XXXXX' : '';

  const moveTo = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: false }).start(() => {
      // random %, clamped so text stays within typical 16:9 player (% of container)
      const newLeft = 5 + Math.random() * 60;   // 5% – 65%
      const newTop  = 5 + Math.random() * 70;   // 5% – 75%
      left.setValue(newLeft);
      top.setValue(newTop);
      Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: false }).start();
    });
  }, [opacity, left, top]);

  useEffect(() => {
    const init = setTimeout(() =>
      Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: false }).start()
    , 1200);
    const interval = setInterval(moveTo, WATERMARK_INTERVAL);
    return () => { clearTimeout(init); clearInterval(interval); };
  }, [moveTo, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.watermark, { opacity, left: left.interpolate({ inputRange: [0,100], outputRange: ['0%','100%'] }), top: top.interpolate({ inputRange: [0,100], outputRange: ['0%','100%'] }) }]}
    >
      <Text style={styles.watermarkText}>{email}</Text>
      {!!maskedPhone && <Text style={styles.watermarkText}>{maskedPhone}</Text>}
    </Animated.View>
  );
}

export default function VideoPlayer({ bunnyVideoId, hlsUrl, isActive, onClose }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorType, setErrorType] = useState<'network' | 'source' | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // ── Watermark: get logged-in user's identity ──────────────────────────
  const profile = useUserStore((s) => s.profile);
  const wmEmail = profile?.email ?? '';
  const wmPhone = profile?.phoneNo ?? '';

  // ── GUARD: Never render player with invalid ID ────────────────────────
  if (!bunnyVideoId || bunnyVideoId === 'null' || bunnyVideoId === 'undefined') {
    return (
      <View style={styles.container}>
        <View style={styles.overlay}>
          <View style={styles.errorIconCircle}>
            <AlertTriangle color="#f87171" size={28} />
          </View>
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
            <X color="#ffffff" size={22} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!isActive) return null;

  // Sanitize: strip accidental library prefix (e.g., '722568/guid' → 'guid')
  const cleanVideoId = bunnyVideoId.includes('/') ? bunnyVideoId.split('/').pop()! : bunnyVideoId;

  // Resolve the video URL: prefer pre-built hlsUrl from API, else build from videoId
  const videoUrl = hlsUrl || getBunnyHlsUrl(cleanVideoId);

  // ── Native Video Player ────────────────────────────────────────────────
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false;
    // 🔊 Audio Fix: Force full volume & proper audio session mode
    p.volume = 1.0;
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
          <View style={styles.loadingPulse}>
            <ActivityIndicator size="large" color="#818cf8" />
          </View>
          <Text style={styles.loadingText}>Loading video…</Text>
          <View style={styles.loadingHint}>
            <Volume2 color="rgba(255,255,255,0.3)" size={12} />
            <Text style={styles.loadingHintText}>Make sure your volume is up</Text>
          </View>
        </View>
      )}

      {/* Error state */}
      {hasError && (
        <View style={styles.overlay}>
          <View style={styles.errorIconCircle}>
            {errorType === 'network' ? (
              <WifiOff color="#f87171" size={28} />
            ) : (
              <AlertTriangle color="#f87171" size={28} />
            )}
          </View>
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
              <RotateCcw color="#ffffff" size={15} />
              <Text style={styles.retryText}>
                Retry ({MAX_RETRIES - retryCount} left)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Close button — always visible, premium style */}
      {onClose && (
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleClose}
          activeOpacity={0.7}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <X color="#ffffff" size={22} />
        </TouchableOpacity>
      )}

      {/* 🔒 Forensic Watermark — floats + moves every 5s so screen recordings are traceable */}
      {!hasError && !!wmEmail && (
        <FloatingWatermark email={wmEmail} phone={wmPhone} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#0a0a0f',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 4,
  },
  videoView: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  // ── Loading ──
  loadingPulse: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  loadingHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  loadingHintText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontWeight: '500',
  },
  // ── Error ──
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  errorTitle: {
    color: '#f87171',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 6,
  },
  errorMsg: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
  // ── Close Button ──
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // shadow for visibility on bright videos
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 8,
  },
  // ── Forensic Watermark ──
  watermark: {
    position: 'absolute',
    zIndex: 9,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  watermarkText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 3,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
