import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Pdf from 'react-native-pdf';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { ArrowLeft, AlertCircle, Download, CheckCircle } from 'lucide-react-native';

import axiosClient from '../../api/axiosClient.api';
import { useAuthStore } from '../../store/useAuthStore';
import { colors } from '../../theme/colors.theme';
import { typography } from '../../theme/typography.theme';

export default function PdfViewerScreen({ route, navigation }: { route: any; navigation: any }) {
  // 1️⃣ Params setup (assuming we pass documentId now, not just direct url)
  const { documentId, title } = route?.params || {};
  const { userProfile } = useAuthStore();
  
  // 📦 States
  const [pdfSource, setPdfSource] = useState<{ uri: string; cache?: boolean } | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // 💾 Download Management States
  const [downloadState, setDownloadState] = useState({
    isDownloaded: false,
    isDownloading: false,
    progress: 0
  });

  // 📂 Secure Local Sandbox Path
  const localPdfPath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/doc_${documentId}.pdf`;

  // ==========================================
  // 3️⃣ SECURE FETCH (Stream/View mode)
  // ==========================================
  const fetchSecurePdfUrl = useCallback(async (isMounted = true) => {
    try {
      // 🌐 API Call to your secure backend endpoint for PDF access
      const response = await axiosClient.get(`/curriculum/secure-doc/${documentId}`);
      
      if (response.data.status && isMounted) {
        // We set the temporary pre-signed URL to view the PDF online
        setPdfSource({ uri: response.data.url, cache: false });
        setError(false);
      } else if (isMounted) {
        setError(true);
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to load secure PDF:", err);
      if (isMounted) {
        setError(true);
        setLoading(false);
      }
    }
  }, [documentId]);

  // ==========================================
  // 2️⃣ INITIALIZATION & LOCAL CACHE CHECK
  // ==========================================
  useEffect(() => {
    let isMounted = true;

    const initializeDocument = async () => {
      try {
        const exists = await ReactNativeBlobUtil.fs.exists(localPdfPath);
        if (exists && isMounted) {
          // File found locally -> Render directly from Sandbox
          setDownloadState(prev => ({ ...prev, isDownloaded: true }));
          setPdfSource({ uri: `file://${localPdfPath}`, cache: false });
          setLoading(false);
        } else {
          // Not found -> Fetch Secure Link from Backend
          fetchSecurePdfUrl(isMounted);
        }
      } catch (err) {
        console.error("Local PDF check failed:", err);
        fetchSecurePdfUrl(isMounted);
      }
    };

    initializeDocument();
    return () => { isMounted = false; };
  }, [documentId, fetchSecurePdfUrl, localPdfPath]);

  // ==========================================
  // 4️⃣ SECURE OFFLINE DOWNLOAD LOGIC
  // ==========================================
  const handleDownloadPdf = async () => {
    if (downloadState.isDownloaded || downloadState.isDownloading) return;

    setDownloadState({ isDownloaded: false, isDownloading: true, progress: 0 });

    try {
      // Get the secure download URL from backend
      const response = await axiosClient.get(`/curriculum/secure-doc/${documentId}`);
      const downloadUrl = response.data?.url;

      if (!downloadUrl) throw new Error("Could not generate secure download link");

      const res = await ReactNativeBlobUtil.config({
        path: localPdfPath,
        fileCache: true,
      })
      .fetch('GET', downloadUrl)
      .progress((received: string | number, total: string | number) => {
        const percentage = Math.floor((Number(received) / Number(total)) * 100);
        setDownloadState(prev => ({ ...prev, progress: percentage }));
      });

      if (res.info().status === 200) {
        setDownloadState({ isDownloaded: true, isDownloading: false, progress: 100 });
        // Update viewer to read from the local file now!
        setPdfSource({ uri: `file://${localPdfPath}`, cache: false });
        Alert.alert("Download Complete", "This document is now available for offline viewing.");
      } else {
        throw new Error("Download status code non-200");
      }

    } catch (err) {
      console.error("PDF Download failed:", err);
      setDownloadState({ isDownloaded: false, isDownloading: false, progress: 0 });
      Alert.alert("Download Failed", "Something went wrong while saving the document offline.");
      // Security Cleanup
      await ReactNativeBlobUtil.fs.unlink(localPdfPath).catch(() => {});
    }
  };

  // ==========================================
  // 🎨 RENDERERS
  // ==========================================
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* 🔝 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
          <ArrowLeft size={24} color={colors.textMain} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title || 'Secure Document'}
        </Text>

        {/* 📥 SMART DOWNLOAD ICON */}
        {!error && (
          <TouchableOpacity 
            style={styles.downloadIconBtn}
            onPress={handleDownloadPdf}
            disabled={downloadState.isDownloaded || downloadState.isDownloading}
          >
            {downloadState.isDownloaded ? (
              <CheckCircle size={24} color={colors.success} />
            ) : downloadState.isDownloading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Download size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* 📄 PDF RENDERER */}
      <View style={styles.pdfContainer}>
        {error ? (
          <View style={styles.errorContainer}>
            <AlertCircle color={colors.danger} size={48} style={styles.errorIcon} />
            <Text style={styles.errorTitle}>Failed to load Document</Text>
            <Text style={styles.errorSub}>The secure link might have expired or you are offline. Please try again.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchSecurePdfUrl()}>
              <Text style={styles.retryText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        ) : pdfSource ? (
          <>
            <Pdf
              source={pdfSource}
              trustAllCerts={false} 
              onLoadComplete={() => setLoading(false)}
              onError={(err) => {
                 console.log("PDF Render Error:", err);
                 setError(true);
                 setLoading(false);
              }}
              style={styles.pdf}
            />
            {/* 🛡️ ANTI-PIRACY WATERMARK */}
            <View style={styles.watermarkOverlay} pointerEvents="none">
               <Text style={styles.floatingWatermarkText}>
                 {userProfile?.email || userProfile?.phoneNo || 'Campusify Protected'}
               </Text>
            </View>
          </>
        ) : null}

        {/* ⏳ LOADER */}
        {loading && !error && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loaderText}>
              {downloadState.isDownloading 
                ? `Downloading... ${downloadState.progress}%` 
                : "Decrypting Secure Document..."}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, elevation: 2, zIndex: 10 },
  backBtn: { padding: 8, marginRight: 8, marginLeft: -8 },
  headerTitle: { flex: 1, fontSize: typography.size.lg, fontFamily: typography.fontFamily.bold, color: colors.textMain, marginRight: 10 },
  downloadIconBtn: { padding: 8, marginLeft: 'auto' }, // Pushes icon to the far right

  pdfContainer: { flex: 1, backgroundColor: colors.border, position: 'relative' },
  pdf: { flex: 1, width: '100%', height: '100%', backgroundColor: colors.border },
  
  watermarkOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', opacity: 0.15, zIndex: 10 },
  floatingWatermarkText: { color: colors.textMain, fontSize: typography.size.xxl, fontFamily: typography.fontFamily.bold, transform: [{ rotate: '-45deg' }] },

  loaderOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, zIndex: 20 },
  loaderText: { marginTop: 12, fontSize: typography.size.sm, color: colors.textMuted, fontFamily: typography.fontFamily.medium },

  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.background, zIndex: 20 },
  errorIcon: { marginBottom: 16 },
  errorTitle: { fontSize: typography.size.lg, fontFamily: typography.fontFamily.bold, color: colors.textMain, marginBottom: 8 },
  errorSub: { fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center', fontFamily: typography.fontFamily.regular },
  retryBtn: { marginTop: 24, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: colors.primary, borderRadius: 8 },
  retryText: { color: colors.textWhite, fontFamily: typography.fontFamily.bold }
});