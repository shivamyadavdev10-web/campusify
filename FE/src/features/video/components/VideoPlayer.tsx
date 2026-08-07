import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { X } from 'lucide-react-native';
import { getBunnyEmbedUrl } from '@/src/core/config/bunny';

interface VideoPlayerProps {
  bunnyVideoId?: string;
  isActive: boolean;
  onClose?: () => void;
}

export default function VideoPlayer({ bunnyVideoId, isActive, onClose }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Fallback if bunnyVideoId is missing
  if (!bunnyVideoId) {
    return (
      <View style={styles.container}>
        <View style={styles.overlay}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Video Not Found</Text>
          <Text style={styles.errorMsg}>This video does not have a valid Bunny ID.</Text>
        </View>
        {onClose && (
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <X color="#ffffff" size={20} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const embedUrl = getBunnyEmbedUrl(bunnyVideoId);

  const htmlContent = `
    <!DOCTYPE html>
    <html><head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { background: #000; width: 100%; height: 100%; overflow: hidden; }
        iframe { width: 100%; height: 100%; border: none; position: absolute; top: 0; left: 0; }
      </style>
    </head><body>
      <iframe 
        src="${embedUrl}" 
        loading="eager" 
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen" 
        allowfullscreen="true"
        style="border:none;">
      </iframe>
    </body></html>
  `;

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
  }, []);

  if (!isActive) return null;

  return (
    <View style={styles.container}>
      {!hasError && (
        <WebView
          key={hasError ? 'retry' : 'initial'}
          source={{ html: htmlContent }}
          style={styles.webview}
          allowsFullscreenVideo={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => { setHasError(true); setIsLoading(false); }}
          onHttpError={() => { setHasError(true); setIsLoading(false); }}
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
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Playback Error</Text>
          <Text style={styles.errorMsg}>Could not load this video. Please check your connection and try again.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.8}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Close button */}
      {onClose && (
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
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
    borderRadius: 12,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    marginTop: 12,
    fontWeight: '500',
  },
  errorIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  errorTitle: {
    color: '#f87171',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  errorMsg: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
    lineHeight: 18,
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
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
});
