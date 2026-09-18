import axios from 'axios';
import fs from 'fs';

// ══════════════════════════════════════════════════════════════════════════════
// 🐇 Bunny.net Stream Configuration
// ══════════════════════════════════════════════════════════════════════════════
// Dynamic getters so env vars are always fresh (handles late dotenv loading)
const getLibraryId = () => (process.env.BUNNY_STREAM_LIBRARY_ID || '736385').trim();
const getApiKey = () => (process.env.BUNNY_STREAM_API_KEY || '').trim();
const getBaseUrl = () => `https://video.bunnycdn.com/library/${getLibraryId()}/videos`;
const getCollectionsUrl = () => `https://video.bunnycdn.com/library/${getLibraryId()}/collections`;

/**
 * Returns common request headers for Bunny Stream API calls.
 */
const getBunnyHeaders = () => ({
    'AccessKey': getApiKey(),
    'Content-Type': 'application/json',
    'Accept': 'application/json',
});

// ══════════════════════════════════════════════════════════════════════════════
// 📁 Collection Management (Organize videos per subject)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Creates a Bunny Stream Collection (folder) in the current library.
 * Use this to organize videos by subject — e.g., "Mathematics", "Physics".
 *
 * @param {string} name - Name of the collection (e.g., subject name)
 * @returns {Promise<string>} collectionId (guid)
 *
 * API Ref: POST /library/{libraryId}/collections
 * Body: { "name": "Collection Name" }
 */
export const createBunnyCollection = async (name) => {
    const url = getCollectionsUrl();
    console.log(`\n[Bunny.net] Creating collection: "${name}" at ${url}`);

    try {
        const response = await axios.post(url, { name }, { headers: getBunnyHeaders() });
        const collectionId = response.data.guid;
        console.log(`✅ Collection created: "${name}" → ID: ${collectionId}`);
        return collectionId;
    } catch (error) {
        console.error("❌ Bunny Create Collection Error:", error?.response?.data || error.message);
        throw new Error(`Failed to create Bunny collection: ${error.response?.data?.Message || error.message}`);
    }
};

/**
 * Lists all Collections in the current library.
 * Useful for admin dashboard — show existing subject folders.
 *
 * @param {number} [page=1]
 * @param {number} [itemsPerPage=100]
 * @returns {Promise<Array>} Array of collection objects
 */
export const listBunnyCollections = async (page = 1, itemsPerPage = 100) => {
    const url = `${getCollectionsUrl()}?page=${page}&itemsPerPage=${itemsPerPage}`;

    try {
        const response = await axios.get(url, { headers: getBunnyHeaders() });
        return response.data.items || [];
    } catch (error) {
        console.error("❌ Bunny List Collections Error:", error?.response?.data || error.message);
        throw new Error(`Failed to list Bunny collections: ${error.response?.data?.Message || error.message}`);
    }
};

/**
 * Fetches a single Collection by ID.
 *
 * @param {string} collectionId
 * @returns {Promise<Object>} Collection object
 */
export const getBunnyCollection = async (collectionId) => {
    const url = `${getCollectionsUrl()}/${collectionId}`;

    try {
        const response = await axios.get(url, { headers: getBunnyHeaders() });
        return response.data;
    } catch (error) {
        console.error("❌ Bunny Get Collection Error:", error?.response?.data || error.message);
        throw new Error(`Failed to get Bunny collection: ${error.response?.data?.Message || error.message}`);
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// 🎥 Video Management
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Creates a video object in Bunny Stream and returns the guid (Video ID).
 * Optionally assigns the video to a Collection (subject folder).
 *
 * @param {string} title - Video title
 * @param {string} [collectionId] - Optional collection to place the video in
 * @returns {Promise<string>} guid (Bunny Video ID)
 *
 * API Ref: POST /library/{libraryId}/videos
 * Body: { "title": "...", "collectionId": "..." }
 */
export const createBunnyVideo = async (title, collectionId = null) => {
    const libraryId = getLibraryId();
    const apiKey = getApiKey();
    
    if (!libraryId) {
        throw new Error("Missing BUNNY_STREAM_LIBRARY_ID in environment variables.");
    }
    if (!apiKey) {
        throw new Error("Missing BUNNY_STREAM_API_KEY in environment variables.");
    }

    const baseUrl = `https://video.bunnycdn.com/library/${libraryId}/videos`;
    
    // Build request body — include collectionId if provided
    const body = { title };
    if (collectionId) {
        body.collectionId = collectionId;
    }

    console.log(`\n[Bunny.net] POST ${baseUrl}`);
    console.log(`[Bunny.net] Title: "${title}"${collectionId ? `, Collection: ${collectionId}` : ''}`);
    console.log(`[Bunny.net] API Key: ${apiKey ? apiKey.substring(0, 5) + '...' + apiKey.slice(-5) : 'UNDEFINED'}`);

    try {
        const response = await axios.post(baseUrl, body, { headers: getBunnyHeaders() });
        let guid = response.data.guid;
        if (guid && guid.includes('/')) {
            guid = guid.split('/').pop();
        }
        console.log(`✅ Video created: "${title}" → ID: ${guid}`);
        return guid;
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
 * Uploads the actual video file binary to Bunny Stream using a ReadStream.
 *
 * @param {string} guid - The Bunny Video GUID from createBunnyVideo
 * @param {string} localFilePath - Path to the local video file
 * @returns {Promise<void>}
 *
 * API Ref: PUT /library/{libraryId}/videos/{videoId}
 */
export const uploadBunnyVideo = async (guid, localFilePath) => {
    const apiKey = getApiKey();
    const uploadUrl = `${getBaseUrl()}/${guid}`;
    
    console.log(`\n[Bunny.net] PUT ${uploadUrl}`);
    console.log(`[Bunny.net] API Key: ${apiKey ? apiKey.substring(0, 5) + '...' + apiKey.slice(-5) : 'UNDEFINED'}`);

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
        console.log(`✅ Video uploaded successfully: ${guid}`);
    } catch (error) {
        console.error("❌ Bunny Upload Video Error:", error?.response?.data || error.message);
        throw new Error(`Failed to upload video to Bunny CDN: ${error.response?.data?.Message || error.message}`);
    }
};

/**
 * Moves an existing video to a different Collection.
 * Use this to reorganize videos between subjects.
 *
 * @param {string} videoGuid - The Bunny Video GUID
 * @param {string} collectionId - The target collection GUID
 * @returns {Promise<void>}
 *
 * API Ref: POST /library/{libraryId}/videos/{videoId}
 * Body: { "collectionId": "..." }
 */
export const moveVideoToCollection = async (videoGuid, collectionId) => {
    const url = `${getBaseUrl()}/${videoGuid}`;

    try {
        await axios.post(url, { collectionId }, { headers: getBunnyHeaders() });
        console.log(`✅ Video ${videoGuid} moved to collection ${collectionId}`);
    } catch (error) {
        console.error("❌ Bunny Move Video Error:", error?.response?.data || error.message);
        throw new Error(`Failed to move video: ${error.response?.data?.Message || error.message}`);
    }
};

/**
 * Lists videos in a specific collection (subject folder).
 * Enrolled students can be shown only videos from their semester's subjects.
 *
 * @param {string} collectionId
 * @param {number} [page=1]
 * @param {number} [itemsPerPage=100]
 * @returns {Promise<Array>} Array of video objects
 */
export const listVideosByCollection = async (collectionId, page = 1, itemsPerPage = 100) => {
    const url = `${getBaseUrl()}?collection=${collectionId}&page=${page}&itemsPerPage=${itemsPerPage}`;

    try {
        const response = await axios.get(url, { headers: getBunnyHeaders() });
        return response.data.items || [];
    } catch (error) {
        console.error("❌ Bunny List Videos Error:", error?.response?.data || error.message);
        throw new Error(`Failed to list videos: ${error.response?.data?.Message || error.message}`);
    }
};

/**
 * Deletes a video from Bunny Stream.
 *
 * @param {string} videoGuid - The Bunny Video GUID
 * @returns {Promise<void>}
 *
 * API Ref: DELETE /library/{libraryId}/videos/{videoId}
 */
export const deleteBunnyVideo = async (videoGuid) => {
    const cleanGuid = videoGuid.includes('/') ? videoGuid.split('/').pop() : videoGuid;
    const url = `${getBaseUrl()}/${cleanGuid}`;

    console.log(`\n[Bunny.net] DELETE ${url}`);

    try {
        await axios.delete(url, { headers: getBunnyHeaders() });
        console.log(`✅ Video deleted: ${cleanGuid}`);
    } catch (error) {
        console.error("❌ Bunny Delete Video Error:", error?.response?.data || error.message);
        throw new Error(`Failed to delete video: ${error.response?.data?.Message || error.message}`);
    }
};

/**
 * Fetches video details (status, duration, resolutions, etc.) from Bunny Stream.
 *
 * @param {string} videoGuid - The Bunny Video GUID
 * @returns {Promise<Object>} Video details object from Bunny API
 *
 * API Ref: GET /library/{libraryId}/videos/{videoId}
 */
export const getBunnyVideoDetails = async (videoGuid) => {
    const cleanGuid = videoGuid.includes('/') ? videoGuid.split('/').pop() : videoGuid;
    const url = `${getBaseUrl()}/${cleanGuid}`;

    try {
        const response = await axios.get(url, { headers: getBunnyHeaders() });
        return response.data;
    } catch (error) {
        console.error("❌ Bunny Get Video Error:", error?.response?.data || error.message);
        throw new Error(`Failed to get video details: ${error.response?.data?.Message || error.message}`);
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// 📁 Bunny.net Edge Storage — For PDFs, Images & Static Files
// ══════════════════════════════════════════════════════════════════════════════
// Unlike Bunny Stream (video-only), Edge Storage handles any file type.
// Files are uploaded to a Storage Zone and served via a connected Pull Zone CDN.

const getStorageZone = () => (process.env.BUNNY_STORAGE_ZONE || 'campusify-releases').trim();
const getStorageApiKey = () => (process.env.BUNNY_STORAGE_API_KEY || '').trim();
const getStorageEndpoint = () => (process.env.BUNNY_STORAGE_ENDPOINT || 'https://sg.storage.bunnycdn.com').trim();
const getStorageCdnUrl = () => (process.env.BUNNY_STORAGE_CDN_URL || 'https://campusify-releases.b-cdn.net').trim();

/**
 * Uploads a file to Bunny Edge Storage.
 * The file is placed under /pdfs/{subjectId}/{filename} for organized storage.
 *
 * @param {string} localFilePath - Path to the local file to upload
 * @param {string} storagePath - Path within the storage zone (e.g., "pdfs/subjectId/filename.pdf")
 * @returns {Promise<string>} CDN URL of the uploaded file
 */
export const uploadToBunnyStorage = async (localFilePath, storagePath) => {
    const storageZone = getStorageZone();
    const apiKey = getStorageApiKey();
    const endpoint = getStorageEndpoint();

    if (!apiKey) {
        throw new Error("Missing BUNNY_STORAGE_API_KEY in environment variables.");
    }

    const uploadUrl = `${endpoint}/${storageZone}/${storagePath}`;
    console.log(`\n[Bunny Storage] PUT ${uploadUrl}`);

    try {
        const stats = fs.statSync(localFilePath);
        const fileStream = fs.createReadStream(localFilePath);

        await axios.put(uploadUrl, fileStream, {
            headers: {
                'AccessKey': apiKey,
                'Content-Type': 'application/octet-stream',
                'Content-Length': stats.size,
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        });

        const cdnUrl = `${getStorageCdnUrl()}/${storagePath}`;
        console.log(`✅ File uploaded to Bunny Storage: ${cdnUrl}`);
        return cdnUrl;
    } catch (error) {
        console.error("❌ Bunny Storage Upload Error:", error?.response?.data || error.message);
        throw new Error(`Failed to upload to Bunny Storage: ${error.response?.data?.Message || error.message}`);
    }
};

/**
 * Deletes a file from Bunny Edge Storage.
 *
 * @param {string} storagePath - Path within the storage zone (e.g., "pdfs/subjectId/filename.pdf")
 * @returns {Promise<void>}
 */
export const deleteFromBunnyStorage = async (storagePath) => {
    const storageZone = getStorageZone();
    const apiKey = getStorageApiKey();
    const endpoint = getStorageEndpoint();

    const deleteUrl = `${endpoint}/${storageZone}/${storagePath}`;
    console.log(`\n[Bunny Storage] DELETE ${deleteUrl}`);

    try {
        await axios.delete(deleteUrl, {
            headers: { 'AccessKey': apiKey },
        });
        console.log(`✅ File deleted from Bunny Storage: ${storagePath}`);
    } catch (error) {
        console.error("❌ Bunny Storage Delete Error:", error?.response?.data || error.message);
        throw new Error(`Failed to delete from Bunny Storage: ${error.response?.data?.Message || error.message}`);
    }
};

