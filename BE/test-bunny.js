import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Hardcoded dummy video ID for testing
const videoId = 'c3e819d3-1501-4160-94bc-a9791d2244c1';

const testSecureVideoToken = () => {
    const securityKey = process.env.BUNNY_STREAM_SECURITY_KEY;
    const hostname = process.env.BUNNY_STREAM_HOSTNAME;

    if (!securityKey || !hostname) {
        console.error("Missing Bunny Stream environment variables: BUNNY_STREAM_SECURITY_KEY or BUNNY_STREAM_HOSTNAME in .env file.");
        return;
    }

    // 1. Expiration time: Exactly 2 hours (7200 seconds) from the current time.
    const expirationTimeInSeconds = Math.floor(Date.now() / 1000) + 7200;

    // 2. Hash formula: SHA256_HEX(securityKey + videoId + expirationTimeInSeconds)
    const hashInput = `${securityKey}${videoId}${expirationTimeInSeconds}`;
    const token = crypto.createHash('sha256').update(hashInput).digest('hex');

    // 3. Construct final URL strictly
    // Note: ensure we don't append https:// twice. The formula provided in the prompt is exactly used.
    const videoUrl = `https://${hostname}/${videoId}/playlist.m3u8?token=${token}&expires=${expirationTimeInSeconds}`;

    console.log("==================================================");
    console.log("✅ Bunny Stream Secure Token Generated Successfully");
    console.log("==================================================");
    console.log(`Video ID : ${videoId}`);
    console.log(`Expires  : ${new Date(expirationTimeInSeconds * 1000).toLocaleString()}`);
    console.log(`Token    : ${token}`);
    console.log("--------------------------------------------------");
    console.log("🔗 Copy and Paste this URL to test (VLC / Safari):");
    console.log(videoUrl);
    console.log("==================================================");
};

testSecureVideoToken();
