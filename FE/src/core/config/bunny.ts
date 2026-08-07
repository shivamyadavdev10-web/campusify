// Bunny.net Stream Configuration
// Update BUNNY_LIBRARY_ID when switching Bunny libraries
export const BUNNY_LIBRARY_ID = '713170';

/**
 * Generates the Bunny.net embed player URL with optimized params for mobile.
 * Docs: https://docs.bunny.net/docs/stream-embedding-videos#supported-parameters
 */
export const getBunnyEmbedUrl = (videoId: string, autoplay = true) =>
  `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId}?autoplay=${autoplay}&responsive=true&preload=true&playsinline=true&showSpeed=true`;

/**
 * Direct play URL (for sharing/linking, not for embedding)
 */
export const getBunnyPlayUrl = (videoId: string) =>
  `https://player.mediadelivery.net/play/${BUNNY_LIBRARY_ID}/${videoId}`;

export const getBunnyThumbnailUrl = (videoId: string) =>
  `https://vz-3360af1f-5bd.b-cdn.net/${videoId}/thumbnail.jpg`;
