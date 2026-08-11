import Content from "../models/content.models.js";
import { buildHlsUrl, buildMp4Url, sanitizeBunnyVideoId } from "../utils/bunnyUrl.utils.js";

/**
 * Retrieves the Bunny Stream HLS URL for a specific content document.
 * Uses centralized URL builder for consistency.
 */
export const getStreamUrl = async (req, res) => {
    try {
        const { contentId } = req.params;

        if (!contentId) {
            return res.status(400).json({ success: false, message: 'contentId is required' });
        }

        const content = await Content.findById(contentId).select("+fileKey");

        if (!content || !content.fileKey) {
            return res.status(404).json({ success: false, message: 'Content or video ID not found' });
        }

        const cleanVideoId = sanitizeBunnyVideoId(content.fileKey);
        const videoUrl = buildHlsUrl(cleanVideoId);
        const videoDirectUrl = buildMp4Url(cleanVideoId);

        if (!videoUrl) {
            return res.status(500).json({ success: false, message: 'Server configuration error: Missing BUNNY_STREAM_HOSTNAME' });
        }

        return res.status(200).json({
            success: true,
            videoUrl,
            videoDirectUrl
        });

    } catch (error) {
        console.error("Error generating stream URL:", error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate stream URL'
        });
    }
};
