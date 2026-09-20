import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, StyleSheet, StatusBar, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { X, RefreshCw, FileText, AlertTriangle } from 'lucide-react-native';

interface PdfViewerProps {
  /** Full HTTPS URL of the PDF file */
  url: string;
  /** Title to show in the bottom bar */
  title: string;
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback to close the modal */
  onClose: () => void;
}

export default function PdfViewer({ url, title, visible, onClose }: PdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const webViewRef = useRef<WebView>(null);

  // Google Docs Viewer renders PDFs inside an iframe — works on Android & iOS
  const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    webViewRef.current?.reload();
  }, []);

  // Reset state when modal opens/closes
  const handleModalShow = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, []);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      onShow={handleModalShow}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1e1e2e" />

        {/* ── Top Bar ─────────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <View style={styles.fileIconWrap}>
              <FileText color="#60a5fa" size={16} />
            </View>
            <Text style={styles.topBarTitle} numberOfLines={1}>
              {title}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X color="#ffffff" size={20} />
          </TouchableOpacity>
        </View>

        {/* ── WebView (PDF Viewer) ────────────────────────────────── */}
        <View style={styles.webViewContainer}>
          {hasError ? (
            /* Error State */
            <View style={styles.errorContainer}>
              <AlertTriangle color="#f87171" size={48} />
              <Text style={styles.errorTitle}>Unable to load PDF</Text>
              <Text style={styles.errorDesc}>
                Check your internet connection and try again.
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.8}>
                <RefreshCw color="#ffffff" size={16} />
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WebView
              ref={webViewRef}
              source={{ uri: viewerUrl }}
              style={styles.webView}
              onLoadEnd={handleLoadEnd}
              onError={handleError}
              onHttpError={handleError}
              startInLoadingState={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scalesPageToFit={true}
              allowsFullscreenVideo={false}
              setSupportMultipleWindows={false}
              // Prevent navigation away from the viewer
              onShouldStartLoadWithRequest={(request) => {
                // Allow Google Docs Viewer URLs, block everything else
                if (
                  request.url.includes('docs.google.com') ||
                  request.url.includes('accounts.google.com') ||
                  request.url === 'about:blank'
                ) {
                  return true;
                }
                return false;
              }}
            />
          )}

          {/* Loading Overlay */}
          {isLoading && !hasError && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Loading PDF...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e2e',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 40 : 54,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1e1e2e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  fileIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  topBarTitle: {
    color: '#f3f4f6',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6366f1',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#1e1e2e',
  },
  errorTitle: {
    color: '#f87171',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
