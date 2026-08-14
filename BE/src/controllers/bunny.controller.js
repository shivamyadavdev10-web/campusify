import Content from "../models/content.models.js";
import { buildHlsUrl, buildMp4Url, sanitizeBunnyVideoId } from "../utils/bunnyUrl.utils.js";
import SimpleCache from "../utils/cache.utils.js";

// ══════════════════════════════════════════════════════════════════════════════
// 🚀 Stream URL Cache — Eliminates ~90% of MongoDB reads
// ══════════════════════════════════════════════════════════════════════════════
// Content metadata (fileKey → CDN URL) rarely changes. Caching for 5 minutes
// means 2,000 concurrent viewers watching the same courses generate near-zero
// DB load after the first request fills the cache.
//
// Memory: 500 entries × ~200 bytes = ~100 KB (negligible on 512MB Render)
const streamCache = new SimpleCache(500, 5 * 60 * 1000); // 500 entries, 5 min TTL

/**
 * Retrieves the Bunny Stream HLS URL for a specific content document.
 * Uses centralized URL builder for consistency.
 * ⚡ OPTIMIZED: In-memory cache + .lean() for minimal DB overhead.
 */
export const getStreamUrl = async (req, res) => {
    try {
        const { contentId } = req.params;

        if (!contentId) {
            return res.status(400).json({ success: false, message: 'contentId is required' });
        }

        // ⚡ Check cache first — skip MongoDB entirely on cache hit
        const cached = streamCache.get(contentId);
        if (cached) {
            // Tell client to cache this response for 5 minutes too
            res.set('Cache-Control', 'private, max-age=300');
            return res.status(200).json({ success: true, ...cached });
        }

        // Cache miss — fetch from MongoDB
        // .lean() returns a plain JS object (5x faster, 5x less memory than Mongoose doc)
        const content = await Content.findById(contentId).select("+fileKey").lean();

        if (!content || !content.fileKey) {
            return res.status(404).json({ success: false, message: 'Content or video ID not found' });
        }

        const cleanVideoId = sanitizeBunnyVideoId(content.fileKey);
        const videoUrl = buildHlsUrl(cleanVideoId);
        const videoDirectUrl = buildMp4Url(cleanVideoId);

        if (!videoUrl) {
            return res.status(500).json({ success: false, message: 'Server configuration error: Missing BUNNY_STREAM_HOSTNAME' });
        }

        // ⚡ Store in cache for subsequent requests
        const result = { videoUrl, videoDirectUrl };
        streamCache.set(contentId, result);

        // Tell client to cache this response for 5 minutes
        res.set('Cache-Control', 'private, max-age=300');
        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error("Error generating stream URL:", error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate stream URL'
        });
    }
};
