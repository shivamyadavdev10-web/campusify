import axios from 'axios';
import fs from 'fs';

// Use dynamic getters to avoid issues if dotenv is loaded after this module is imported
const getLibraryId = () => (process.env.BUNNY_STREAM_LIBRARY_ID || '705341').trim();
const getApiKey = () => (process.env.BUNNY_STREAM_API_KEY || '1217df20-f43c-441a-86da47dc9193-5c64-4920').trim();
const getBaseUrl = () => `https://video.bunnycdn.com/library/${getLibraryId()}/videos`;

/**
 * Creates a video object in Bunny Stream and returns the guid (Video ID)
 * @param {string} title 
 * @returns {Promise<string>} guid
 */
export const createBunnyVideo = async (title) => {
    const libraryId = getLibraryId();
    const apiKey = getApiKey();
    
    if (!libraryId) {
        throw new Error("Missing BUNNY_STREAM_LIBRARY_ID in environment variables.");
    }
    if (!apiKey) {
        throw new Error("Missing BUNNY_STREAM_API_KEY in environment variables.");
    }

    const baseUrl = `https://video.bunnycdn.com/library/${libraryId}/videos`;
    
    // Enhanced Debug Logging
    console.log(`\n[Bunny.net] POST Request to: ${baseUrl}`);
    console.log(`[Bunny.net] Using API Key: ${apiKey ? apiKey.substring(0, 5) + '...' + apiKey.slice(-5) : 'UNDEFINED'}`);

    try {
        const response = await axios.post(
            baseUrl,
            { title: title },
            {
                headers: {
                    'AccessKey': apiKey,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );
        return response.data.guid;
    } catch (error) {
        if (error.response) {
            console.error("Bunny Create API Rejected:", error.response.data);
            throw new Error(`Bunny CDN Error: ${error.response.data.Message || 'Failed to create video'}`);
        } else {
            console.error("Network/Axios Error:", error.message);
            throw error;
        }
    }
};

/**
 * Uploads the actual video file binary to Bunny Stream using a ReadStream
 * @param {string} guid 
 * @param {string} localFilePath 
 * @returns {Promise<void>}
 */
export const uploadBunnyVideo = async (guid, localFilePath) => {
    const apiKey = getApiKey();
    const uploadUrl = `${getBaseUrl()}/${guid}`;
    
    // Enhanced Debug Logging
    console.log(`\n[Bunny.net] PUT Request to: ${uploadUrl}`);
    console.log(`[Bunny.net] Using API Key: ${apiKey ? apiKey.substring(0, 5) + '...' + apiKey.slice(-5) : 'UNDEFINED'}`);

    try {
        const stats = fs.statSync(localFilePath);
        const fileStream = fs.createReadStream(localFilePath);
        
        await axios.put(
            uploadUrl,
            fileStream,
            {
                headers: {
                    'AccessKey': apiKey,
                    'Content-Type': 'application/octet-stream',
                    'Content-Length': stats.size
                },
                // Prevents max content length error for large files
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            }
        );
    } catch (error) {
        console.error("❌ Bunny Upload Video Error:", error?.response?.data || error.message);
        throw new Error(`Failed to upload video to Bunny CDN: ${error.response?.data?.Message || error.message}`);
    }
};
