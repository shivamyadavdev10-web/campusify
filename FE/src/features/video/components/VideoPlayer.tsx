import React, { useState, useCallback, useRef } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { X, WifiOff, AlertTriangle } from 'lucide-react-native';
import { getBunnyEmbedUrl, BUNNY_LIBRARY_ID } from '@/src/core/config/bunny';

interface VideoPlayerProps {
  bunnyVideoId?: string | null;
  isActive: boolean;
  onClose?: () => void;
}

const MAX_RETRIES = 3;

export default function VideoPlayer({ bunnyVideoId, isActive, onClose }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorType, setErrorType] = useState<'network' | 'http' | null>(null);
  const retryCount = useRef(0);
  const isRetrying = useRef(false);

  // ── GUARD: Never render WebView with invalid ID ───────────────────────
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

  const embedUrl = getBunnyEmbedUrl(bunnyVideoId);

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: #000; width: 100%; height: 100%; overflow: hidden; }
    iframe {
      width: 100%; height: 100%;
      border: none;
      position: absolute;
      top: 0; left: 0;
    }
  </style>
</head>
<body>
  <iframe
    src="${embedUrl}"
    loading="eager"
    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
    allowfullscreen="true"
    referrerpolicy="no-referrer-when-downgrade"
    style="border:none;">
  </iframe>
</body>
</html>`;

  const handleRetry = useCallback(() => {
    if (isRetrying.current) return; // debounce rapid taps
    if (retryCount.current >= MAX_RETRIES) {
      // Max retries hit — tell user to contact support
      return;
    }
    isRetrying.current = true;
    retryCount.current += 1;
    setHasError(false);
    setErrorType(null);
    setIsLoading(true);
    // Small delay so WebView has time to unmount cleanly
    setTimeout(() => { isRetrying.current = false; }, 500);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setErrorType('network');
    setIsLoading(false);
  }, []);

  const handleHttpError = useCallback((e: any) => {
    setHasError(true);
    setErrorType('http');
    setIsLoading(false);
  }, []);

  // Block any navigation that tries to leave the Bunny embed domain
  const handleShouldStartLoad = useCallback((request: WebViewNavigation) => {
    const { url } = request;
    if (
      url.startsWith('about:') ||
      url.includes('iframe.mediadelivery.net') ||
      url.includes('mediadelivery.net') ||
      url.startsWith('blob:')
    ) {
      return true;
    }
    // Block external navigation — prevents crash from redirect loops
    return false;
  }, []);

  const reachedMaxRetries = retryCount.current >= MAX_RETRIES;

  return (
    <View style={styles.container}>
      {!hasError && (
        <WebView
          key={`player-${bunnyVideoId}-${retryCount.current}`}
          source={{ html: htmlContent }}
          style={styles.webview}
          // ── Playback ──────────────────────────────────────────────
          allowsFullscreenVideo={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          // ── Security / Compat ─────────────────────────────────────
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="compatibility"
          allowsProtectedMedia={true}
          originWhitelist={['*']}
          setSupportMultipleWindows={false}
          // ── Navigation guard ──────────────────────────────────────
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          // ── Lifecycle ─────────────────────────────────────────────
          startInLoadingState={false}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={handleError}
          onHttpError={handleHttpError}
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
          <Text style={styles.errorTitle} numberOfLines={1}>
            {errorType === 'network' ? 'No Internet' : 'Video Not Found'}
          </Text>
          <Text style={styles.errorMsg}>
            {errorType === 'network'
              ? 'Check your connection and try again.'
              : 'This video could not be loaded.\nIt may not be processed yet.'}
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
              <Text style={styles.retryText}>
                Retry ({MAX_RETRIES - retryCount.current} left)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Close button — always visible */}
      {onClose && (
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
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
  webview: {
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
