// Bunny.net Stream Configuration
// Library ID is now dynamic — passed per-video from the API response.
// The env var EXPO_PUBLIC_BUNNY_LIBRARY_ID acts as a last-resort fallback
// for contexts where the per-video library ID is not available.

// ─── Fallback library ID (used only when API doesn't return one) ──────────────
export const FALLBACK_BUNNY_LIBRARY_ID =
  process.env.EXPO_PUBLIC_BUNNY_LIBRARY_ID || '722568';

/**
 * Generates the Bunny.net embed player URL.
 * Always pass libraryId from the API response — this ensures the correct
 * library is used even if the backend library switches in future.
 *
 * Docs: https://docs.bunny.net/docs/stream-embedding-videos#supported-parameters
 */
export const getBunnyEmbedUrl = (
  videoId: string,
  libraryId: string = FALLBACK_BUNNY_LIBRARY_ID,
  autoplay = true,
) =>
  `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=${autoplay}&muted=false&responsive=true&preload=true&playsinline=true&showSpeed=true&loop=false&rememberPosition=true&compactControls=true`;

/**
 * Direct play URL (for sharing/linking, not embedding in WebView)
 */
export const getBunnyPlayUrl = (
  videoId: string,
  libraryId: string = FALLBACK_BUNNY_LIBRARY_ID,
) => `https://player.mediadelivery.net/play/${libraryId}/${videoId}`;

/**
 * Thumbnail URL — uses the CDN pull zone hostname.
 * NOTE: If you switch libraries, update the hostname here too.
 */
export const getBunnyThumbnailUrl = (videoId: string) =>
  `https://vz-00cfb11c-b5a.b-cdn.net/${videoId}/thumbnail.jpg`;
