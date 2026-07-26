import Content from "../models/content.models.js";

/**
 * Retrieves the Bunny Stream raw HLS URL (.m3u8) for a specific content document.
 * (No token logic, returning raw URL for custom React Native player)
 */
export const getStreamUrl = async (req, res) => {
    try {
        const { contentId } = req.params;

        if (!contentId) {
            return res.status(400).json({ success: false, message: 'contentId is required' });
        }

        // 1. Fetch content from DB and explicitly select fileKey
        const content = await Content.findById(contentId).select("+fileKey");

        if (!content || !content.fileKey) {
            return res.status(404).json({ success: false, message: 'Content or video ID not found' });
        }

        let hostname = process.env.BUNNY_STREAM_HOSTNAME;

        if (!hostname) {
            return res.status(500).json({ success: false, message: 'Server configuration error: Missing BUNNY_STREAM_HOSTNAME' });
        }
        
        hostname = hostname.replace(/^https?:\/\//, '');

        // 2. Construct standard raw video URL
        // fileKey contains the Bunny Video ID
        const videoUrl = `https://${hostname}/${content.fileKey}/playlist.m3u8`;

        // 3. Return to the frontend
        return res.status(200).json({
            success: true,
            videoUrl
        });

    } catch (error) {
        console.error("Error generating stream URL:", error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate stream URL'
        });
    }
};
