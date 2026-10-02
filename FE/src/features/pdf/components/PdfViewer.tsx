import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, StatusBar, Platform, Animated, Dimensions } from 'react-native';
import Pdf from 'react-native-pdf';
import { X, FileText, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { useSecurePdf } from '../../../hooks/useSecurePdf';

const { width } = Dimensions.get('window');

interface PdfViewerProps {
  url: string;
  title: string;
  visible: boolean;
  onClose: () => void;
}

export default function PdfViewer({ url, title, visible, onClose }: PdfViewerProps) {
  // Use our new highly secure, persistent downloader
  const { localUri, progress, error: downloadError } = useSecurePdf(visible ? url : '');
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Combine custom download error and native PDF rendering error
  const showRetry = hasError || downloadError;

  // Pulse animation for skeleton
  const [pulseAnim] = useState(new Animated.Value(0.3));

  const startSkeletonPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const handleModalShow = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    startSkeletonPulse();
  }, [startSkeletonPulse]);

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    startSkeletonPulse();
    // In a real scenario, you might want to trigger a re-download in the hook here
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
      onShow={handleModalShow}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1e1e2e" />

        {/* ── Top Bar (Premium Glass/Dark Look) ── */}
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

        <View style={styles.contentContainer}>
          {showRetry ? (
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
            // Only render the PDF component once we have a secure local URI
            localUri ? (
              <Pdf
                source={{ uri: localUri }}
                trustAllCerts={false}
                onLoadComplete={(numberOfPages, filePath) => {
                  setIsLoading(false);
                }}
                onError={(error) => {
                  console.log('PDF Render Error:', error);
                  setIsLoading(false);
                  setHasError(true);
                }}
                style={styles.pdf}
              />
            ) : null
          )}

          {/* Premium Skeleton Loader overlay */}
          {(isLoading || !localUri) && !showRetry && (
            <View style={styles.skeletonContainer}>
              {/* Fake PDF Header */}
              <Animated.View style={[styles.skeletonHeader, { opacity: pulseAnim }]} />
              
              {/* Fake PDF Lines */}
              {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                <Animated.View 
                  key={item} 
                  style={[
                    styles.skeletonLine, 
                    { 
                      opacity: pulseAnim, 
                      width: item % 2 === 0 ? '90%' : '100%' 
                    }
                  ]} 
                />
              ))}

              <View style={styles.progressWrapper}>
                <Text style={styles.loadingText}>
                  Securely syncing offline... {Math.round(progress * 100)}%
                </Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                </View>
              </View>
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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 40) : 54,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1e1e2e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    zIndex: 10,
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
  contentContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  pdf: {
    flex: 1,
    width: width,
    backgroundColor: '#f1f5f9',
  },
  skeletonContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    padding: 24,
    zIndex: 5,
  },
  skeletonHeader: {
    height: 40,
    width: '60%',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 32,
    marginTop: 12,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 16,
  },
  progressWrapper: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressBarBg: {
    height: 6,
    width: '100%',
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
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
