// Bunny.net Stream Configuration
// Library ID is now dynamic — passed per-video from the API response.
// The env var EXPO_PUBLIC_BUNNY_LIBRARY_ID acts as a last-resort fallback
// for contexts where the per-video library ID is not available.

// ─── Fallback library ID (used only when API doesn't return one) ──────────────
export const FALLBACK_BUNNY_LIBRARY_ID =
  process.env.EXPO_PUBLIC_BUNNY_LIBRARY_ID || '722568';

// ─── CDN Pull Zone hostname for direct HLS streaming ─────────────────────────
export const BUNNY_CDN_HOSTNAME =
  process.env.EXPO_PUBLIC_BUNNY_CDN_HOSTNAME || 'vz-00cfb11c-b5a.b-cdn.net';

/**
 * Direct HLS playlist URL — plays natively on iOS (AVPlayer) & Android (ExoPlayer).
 * This is the preferred URL for mobile apps using expo-video or react-native-video.
 *
 * Format: https://{pullZoneHostname}/{videoId}/playlist.m3u8
 */
export const getBunnyHlsUrl = (videoId: string): string | null => {
  if (!videoId) return null;
  // Strip accidental library prefix (e.g., '722568/guid' → 'guid')
  const cleanId = videoId.includes('/') ? videoId.split('/').pop()! : videoId;
  return `https://${BUNNY_CDN_HOSTNAME}/${cleanId}/playlist.m3u8`;
};

/**
 * Direct MP4 fallback URL (720p max).
 * Use only when HLS is not supported by the device.
 */
export const getBunnyMp4Url = (videoId: string): string | null => {
  if (!videoId) return null;
  const cleanId = videoId.includes('/') ? videoId.split('/').pop()! : videoId;
  return `https://${BUNNY_CDN_HOSTNAME}/${cleanId}/play_720p.mp4`;
};

/**
 * Thumbnail URL — uses the CDN pull zone hostname.
 */
export const getBunnyThumbnailUrl = (videoId: string): string | null => {
  if (!videoId) return null;
  const cleanId = videoId.includes('/') ? videoId.split('/').pop()! : videoId;
  return `https://${BUNNY_CDN_HOSTNAME}/${cleanId}/thumbnail.jpg`;
};
