/**
 * Centralized Bunny.net URL builder.
 * Single source of truth for all Bunny Stream video URLs.
 * If the URL format ever changes, only this file needs updating.
 */

/**
 * Builds an HLS streaming URL for a Bunny Stream video.
 * @param {string} videoId - The Bunny Video GUID (must NOT contain library prefix)
 * @param {string} [hostname] - CDN hostname override. Defaults to BUNNY_STREAM_HOSTNAME env.
 * @returns {string|null} Full HLS URL or null if inputs invalid
 */
export const buildHlsUrl = (videoId, hostname = null) => {
    if (!videoId) return null;
    // Strip accidental library prefix
    const cleanId = videoId.includes('/') ? videoId.split('/').pop() : videoId;
    const host = (hostname || process.env.BUNNY_STREAM_HOSTNAME || '').replace(/^https?:\/\//, '').trim();
    if (!host || !cleanId) return null;
    return `https://${host}/${cleanId}/playlist.m3u8`;
};

/**
 * Builds a direct MP4 URL (720p) for fallback playback.
 * @param {string} videoId - The Bunny Video GUID
 * @param {string} [quality='720p'] - Quality variant
 * @param {string} [hostname] - CDN hostname override
 * @returns {string|null}
 */
export const buildMp4Url = (videoId, quality = '720p', hostname = null) => {
    if (!videoId) return null;
    const cleanId = videoId.includes('/') ? videoId.split('/').pop() : videoId;
    const host = (hostname || process.env.BUNNY_STREAM_HOSTNAME || '').replace(/^https?:\/\//, '').trim();
    if (!host || !cleanId) return null;
    return `https://${host}/${cleanId}/play_${quality}.mp4`;
};

/**
 * Builds a thumbnail URL for a Bunny Stream video.
 * @param {string} videoId - The Bunny Video GUID
 * @param {string} [hostname] - CDN hostname override
 * @returns {string|null}
 */
export const buildThumbnailUrl = (videoId, hostname = null) => {
    if (!videoId) return null;
    const cleanId = videoId.includes('/') ? videoId.split('/').pop() : videoId;
    const host = (hostname || process.env.BUNNY_STREAM_HOSTNAME || '').replace(/^https?:\/\//, '').trim();
    if (!host || !cleanId) return null;
    return `https://${host}/${cleanId}/thumbnail.jpg`;
};

/**
 * Sanitizes a Bunny video ID by stripping any library prefix.
 * Input: '722568/d186a612-...' → Output: 'd186a612-...'
 * Input: 'd186a612-...' → Output: 'd186a612-...' (unchanged)
 * @param {string} videoId
 * @returns {string|null}
 */
export const sanitizeBunnyVideoId = (videoId) => {
    if (!videoId) return null;
    return videoId.includes('/') ? videoId.split('/').pop() : videoId;
};
