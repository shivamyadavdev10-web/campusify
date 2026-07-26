import Content from "../models/content.models.js";

export const getStreamUrl = async (req, res) => {
  try {
    const { contentId } = req.params;

    // Explicitly query the hidden Bunny Video ID
    const content = await Content.findById(contentId).select("+fileKey");

    if (!content) {
      return res.status(404).json({ success: false, message: "Content not found" });
    }

    if (!content.fileKey) {
      return res.status(400).json({ success: false, message: "Video ID not found for this content" });
    }

    // Generate standard HLS URL (No token authentication)
    const videoUrl = `https://${process.env.BUNNY_STREAM_HOSTNAME}/${content.fileKey}/playlist.m3u8`;

    return res.status(200).json({ success: true, videoUrl });
  } catch (error) {
    console.error("Error generating stream URL:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
