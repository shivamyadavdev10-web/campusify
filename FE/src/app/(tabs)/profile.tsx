import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking, Platform, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/core/api/client';
import { useAuthStore } from '@/src/core/stores/auth.store';
import { useUIStore } from '@/src/core/stores/ui.store';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { getInitials } from '@/src/utils/helpers.utils';
import { LogOut, BookOpen, CreditCard, Mail, Phone, Lock, ChevronRight, CheckCircle2, MessageCircle, Bug, Download, ArrowUpCircle, CheckCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import axios from 'axios';

// ══════════════════════════════════════════════════════════════════════════════
// 🔄 App Update — Version Check & In-App APK Download
// ══════════════════════════════════════════════════════════════════════════════

const RELEASES_CDN = process.env.EXPO_PUBLIC_RELEASES_CDN_URL || 'https://campusify-releases.b-cdn.net';
const VERSION_CHECK_URL = `${RELEASES_CDN}/releases/version.json`;
const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

interface VersionInfo {
  latestVersion: string;
  minVersion: string;
  apkUrl: string;
  releaseNotes: string;
  forceUpdate: boolean;
}

/**
 * Compares two semver strings (e.g. "1.2.0" vs "1.1.0").
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na < nb) return -1;
    if (na > nb) return 1;
  }
  return 0;
}

// ══════════════════════════════════════════════════════════════════════════════
// 📱 Profile Screen
// ══════════════════════════════════════════════════════════════════════════════

export default function ProfileScreen() {
  const { logout } = useAuthStore();
  const { showToast } = useUIStore();
  const router = useRouter();
  
  // ── Profile Data ──
  const { data: profileData, isLoading: profileLoading, isError: profileError, refetch: refetchProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient.get('/user/me').then(res => res.data.data)
  });

  // ── Version Check (CDN — no backend load, cached 1hr) ──
  const { data: versionData } = useQuery<VersionInfo>({
    queryKey: ['app-version-check'],
    queryFn: async () => {
      // Direct fetch from Bunny CDN — bypasses backend completely
      const res = await axios.get(VERSION_CHECK_URL, { timeout: 10000 });
      return res.data;
    },
    staleTime: 60 * 60 * 1000,  // Cache for 1 hour — don't spam CDN
    retry: 1,                     // Retry once on failure, then give up silently
    enabled: Platform.OS === 'android', // Only check on Android (APK doesn't apply to iOS)
  });

  // ── Download State ──
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadedFilePath, setDownloadedFilePath] = useState<string | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  // Determine update status
  const isUpdateAvailable = versionData && compareSemver(APP_VERSION, versionData.latestVersion) < 0;
  const hasApkUrl = !!versionData?.apkUrl;

  // ── Download APK ──
  const handleDownload = useCallback(async () => {
    if (!versionData?.apkUrl) {
      showToast('Download link not available yet', 'info');
      return;
    }

    try {
      setDownloadProgress(0);
      setDownloadedFilePath(null);

      const fileName = `campusify-v${versionData.latestVersion}.apk`;
      const fileUri = FileSystem.cacheDirectory + fileName;

      // Check if already downloaded (resume-friendly)
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists && fileInfo.size && fileInfo.size > 1000000) {
        // File already exists and seems complete (>1MB)
        setDownloadedFilePath(fileUri);
        setDownloadProgress(100);
        showToast('APK ready! Tap Install to continue.', 'info');
        return;
      }

      const downloadResumable = FileSystem.createDownloadResumable(
        versionData.apkUrl,
        fileUri,
        {},
        (progress) => {
          const pct = Math.round((progress.totalBytesWritten / progress.totalBytesExpectedToWrite) * 100);
          setDownloadProgress(pct);
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (result?.uri) {
        setDownloadedFilePath(result.uri);
        setDownloadProgress(100);
        showToast('Download complete! Tap Install.', 'info');
      } else {
        throw new Error('Download returned no URI');
      }
    } catch (error: any) {
      setDownloadProgress(null);
      const msg = error?.message || 'Download failed';
      if (msg.includes('Network') || msg.includes('timeout')) {
        showToast('Check your internet and try again', 'error');
      } else {
        showToast('Download failed. Please try again.', 'error');
      }
      console.warn('APK Download Error:', error);
    }
  }, [versionData, showToast]);

  // ── Install APK ──
  const handleInstall = useCallback(async () => {
    if (!downloadedFilePath) return;

    try {
      setIsInstalling(true);

      // Convert file:// URI to content:// URI (REQUIRED for Android security)
      const contentUri = await FileSystem.getContentUriAsync(downloadedFilePath);

      // Launch Android's package installer
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        type: 'application/vnd.android.package-archive',
      });
    } catch (error) {
      console.warn('Install Error:', error);
      // Show guide for first-time install permission
      Alert.alert(
        '📋 Installation Guide',
        'If Android blocked the install:\n\n' +
        '1️⃣ Go to Settings → Apps → Campusify\n' +
        '2️⃣ Enable "Install unknown apps"\n' +
        '3️⃣ Come back and tap Install again\n\n' +
        'If Play Protect warns, tap "Install anyway" — it\'s safe! ✅',
        [{ text: 'Got it', style: 'default' }]
      );
    } finally {
      setIsInstalling(false);
    }
  }, [downloadedFilePath]);

  // ── Loading State ──
  if (profileLoading) {
    return (
      <View className="flex-1 bg-background pt-12 px-5">
        <Skeleton width={100} height={100} borderRadius={50} className="self-center mb-6" />
        <Skeleton width="60%" height={24} className="self-center mb-2" />
        <Skeleton width="40%" height={16} className="self-center mb-8" />
      </View>
    );
  }

  if (profileError) return <ErrorState message="Failed to load profile" onRetry={refetchProfile} />;

  return (
    <ScrollView className="flex-1 bg-background px-5 pt-10 pb-24">
      {/* Profile Header */}
      <View className="bg-surface-container-lowest rounded-3xl p-5 flex-row items-center shadow-sm mb-6 border border-outline-variant">
        <View className="w-[68px] h-[68px] rounded-full bg-[#f0f5ff] flex items-center justify-center mr-4">
          <Text className="text-[22px] font-semibold text-[#2563eb]">
            {getInitials(profileData?.firstName, profileData?.lastName)}
          </Text>
        </View>
        <View className="flex-1 overflow-hidden">
          <Text className="text-[17px] font-semibold text-on-surface mb-0.5" numberOfLines={1}>
            {profileData?.firstName} {profileData?.lastName}
          </Text>
          <View className="flex-row items-center mb-2">
            <Mail color="#737686" size={14} className="mr-1.5" />
            <Text className="text-on-surface-variant text-[13px] truncate" numberOfLines={1}>
              {profileData?.email}
            </Text>
          </View>
          {profileData?.isVerified ? (
            <View className="self-start bg-[#f0fdf4] px-2 py-1 rounded-md flex-row items-center">
              <CheckCircle2 color="#16a34a" size={12} className="mr-1" />
              <Text className="text-[#16a34a] text-[11px] font-medium">Verified Student</Text>
            </View>
          ) : (
            <View className="self-start bg-[#fefce8] px-2 py-1 rounded-md flex-row items-center">
              <Text className="text-[#eab308] text-[11px] font-medium">Verify Account</Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick Action Cards */}
      <TouchableOpacity 
        className="bg-surface-container-lowest rounded-3xl p-4 flex-row items-center justify-between shadow-sm mb-4 border border-outline-variant active:scale-95 transition-transform"
        onPress={() => router.push('/(tabs)/my-courses')} 
      >
        <View className="flex-row items-center">
          <View className="w-[42px] h-[42px] rounded-full bg-[#f0f5ff] flex items-center justify-center mr-4">
            <BookOpen color="#3b82f6" size={20} />
          </View>
          <View>
            <Text className="text-[15px] font-medium text-on-surface">Courses</Text>
            <Text className="text-[13px] text-on-surface-variant mt-0.5">View your enrolled content</Text>
          </View>
        </View>
        <ChevronRight color="#c1c3ce" size={20} />
      </TouchableOpacity>

      <TouchableOpacity 
        className="bg-surface-container-lowest rounded-3xl p-4 flex-row items-center justify-between shadow-sm mb-8 border border-outline-variant active:scale-95 transition-transform"
        onPress={() => showToast('Payment history coming in next update', 'info')}
      >
        <View className="flex-row items-center">
          <View className="w-[42px] h-[42px] rounded-full bg-[#f0f5ff] flex items-center justify-center mr-4">
            <CreditCard color="#3b82f6" size={20} />
          </View>
          <View>
            <Text className="text-[15px] font-medium text-on-surface">Payments</Text>
            <Text className="text-[13px] text-on-surface-variant mt-0.5">Transactions and billing</Text>
          </View>
        </View>
        <ChevronRight color="#c1c3ce" size={20} />
      </TouchableOpacity>

      {/* Account & Support Section */}
      <View className="mb-8">
        <Text className="text-[15px] text-on-surface font-medium mb-3 px-1">Account & Support</Text>
        <View className="bg-surface-container-lowest rounded-[24px] p-2 shadow-sm border border-outline-variant">
          
          {/* Contact Support — call + WhatsApp */}
          <View className="flex-row items-center p-3 border-b border-surface-container-highest rounded-xl">
            <View className="w-10 h-10 rounded-full bg-[#f0fdfa] flex items-center justify-center mr-4">
              <Phone color="#0d9488" size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-medium text-on-surface">Contact Support</Text>
              <Text className="text-[13px] text-on-surface-variant mt-0.5">Call: +91 7977675291</Text>
            </View>
            {/* WhatsApp DM button */}
            <TouchableOpacity 
              className="bg-[#25D366] w-9 h-9 rounded-full items-center justify-center"
              onPress={() => Linking.openURL('https://wa.me/917977675291')}
            >
              <MessageCircle color="#ffffff" size={16} />
            </TouchableOpacity>
          </View>
          
          {/* Reset Password */}
          <TouchableOpacity 
            className="flex-row items-center p-3 border-b border-surface-container-highest active:bg-surface-container-lowest rounded-xl"
            onPress={() => router.push('/change-password')}
          >
            <View className="w-10 h-10 rounded-full bg-[#f0f5ff] flex items-center justify-center mr-4">
              <Lock color="#3b82f6" size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-medium text-on-surface">Reset Password</Text>
              <Text className="text-[13px] text-on-surface-variant mt-0.5">Update your security credentials</Text>
            </View>
          </TouchableOpacity>

          {/* Report Bugs — WhatsApp redirect */}
          <TouchableOpacity 
            className="flex-row items-center p-3 border-b border-surface-container-highest active:bg-surface-container-lowest rounded-xl"
            onPress={() => Linking.openURL('https://wa.me/917977675291?text=Bug%20Report%3A%20')}
          >
            <View className="w-10 h-10 rounded-full bg-[#fef3c7] flex items-center justify-center mr-4">
              <Bug color="#d97706" size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-medium text-on-surface">Report Bugs</Text>
              <Text className="text-[13px] text-on-surface-variant mt-0.5">Help us improve the app</Text>
            </View>
            <ChevronRight color="#c1c3ce" size={20} />
          </TouchableOpacity>

          {/* Log Out — with confirmation popup */}
          <TouchableOpacity 
            className="flex-row items-center p-3 active:bg-surface-container-lowest rounded-xl"
            onPress={() => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Yes, Logout', style: 'destructive', onPress: () => logout() },
                ]
              );
            }}
          >
            <View className="w-10 h-10 rounded-full bg-[#fef2f2] flex items-center justify-center mr-4">
              <LogOut color="#ef4444" size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-medium text-[#ef4444]">Log Out</Text>
              <Text className="text-[13px] text-on-surface-variant mt-0.5">Securely sign out of this device</Text>
            </View>
          </TouchableOpacity>
          
        </View>
      </View>

      {/* ═══════ App Update Section (Android Only) ═══════ */}
      {Platform.OS === 'android' && isUpdateAvailable && hasApkUrl && (
        <View className="mb-8">
          <Text className="text-[15px] text-on-surface font-medium mb-3 px-1">App Update</Text>
          <View className="bg-[#f0fdf4] rounded-[24px] p-4 border border-[#bbf7d0]">
            {/* Header */}
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-full bg-[#dcfce7] flex items-center justify-center mr-3">
                <ArrowUpCircle color="#16a34a" size={22} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-[#15803d]">Update Available!</Text>
                <Text className="text-[12px] text-[#16a34a] mt-0.5">
                  v{APP_VERSION} → v{versionData?.latestVersion}
                </Text>
              </View>
            </View>

            {/* Release Notes */}
            {versionData?.releaseNotes ? (
              <Text className="text-[13px] text-[#166534] mb-3 leading-5">
                {versionData.releaseNotes}
              </Text>
            ) : null}

            {/* Progress Bar — visible during download */}
            {downloadProgress !== null && downloadProgress < 100 && (
              <View className="mb-3">
                <View className="h-2 bg-[#bbf7d0] rounded-full overflow-hidden">
                  <View 
                    className="h-full bg-[#16a34a] rounded-full"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </View>
                <Text className="text-[11px] text-[#16a34a] mt-1 text-center font-medium">
                  Downloading... {downloadProgress}%
                </Text>
              </View>
            )}

            {/* Action Button */}
            {downloadProgress === 100 && downloadedFilePath ? (
              // Download complete — show Install button
              <TouchableOpacity
                className="bg-[#16a34a] rounded-xl py-3.5 flex-row items-center justify-center active:bg-[#15803d]"
                onPress={handleInstall}
                disabled={isInstalling}
              >
                {isInstalling ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <CheckCircle color="#ffffff" size={18} />
                    <Text className="text-white font-bold text-[14px] ml-2">Install Now</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : downloadProgress !== null && downloadProgress < 100 ? (
              // Downloading — show disabled button
              <View className="bg-[#86efac] rounded-xl py-3.5 flex-row items-center justify-center opacity-70">
                <ActivityIndicator color="#15803d" size="small" />
                <Text className="text-[#15803d] font-bold text-[14px] ml-2">Downloading...</Text>
              </View>
            ) : (
              // Not started — show Download button
              <TouchableOpacity
                className="bg-[#16a34a] rounded-xl py-3.5 flex-row items-center justify-center active:bg-[#15803d]"
                onPress={handleDownload}
              >
                <Download color="#ffffff" size={18} />
                <Text className="text-white font-bold text-[14px] ml-2">Download & Install</Text>
              </TouchableOpacity>
            )}

            {/* First-time guide hint */}
            <Text className="text-[11px] text-[#166534]/60 mt-2 text-center">
              First time? Android may ask to allow installation.
            </Text>
          </View>
        </View>
      )}
      
      {/* Version Footer */}
      <View className="flex-row items-center justify-center mb-6">
        <Text className="text-center text-xs text-on-surface-variant">
          {`Campusify App v${APP_VERSION}`}
        </Text>
        {Platform.OS === 'android' && versionData && !isUpdateAvailable && (
          <View className="flex-row items-center ml-2">
            <CheckCircle2 color="#16a34a" size={12} />
            <Text className="text-[#16a34a] text-xs font-medium ml-1">Latest</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
