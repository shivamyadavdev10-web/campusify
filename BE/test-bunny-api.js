import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const run = async () => {
    try {
        const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
        const apiKey = process.env.BUNNY_STREAM_API_KEY;

        console.log(`Library ID: ${libraryId}`);
        console.log(`API Key: ${apiKey}`);

        const createRes = await axios.post(
            `https://sg.video.bunnycdn.com/library/${libraryId}/videos`,
            { title: "Test Video" },
            {
                headers: {
                    AccessKey: apiKey,
                    accept: 'application/json',
                    'content-type': 'application/json'
                }
            }
        );
        console.log("Create successful!", createRes.data);
    } catch (err) {
        if (err.response) {
            console.error(err.response.status, err.response.data);
        } else {
            console.error(err.message);
        }
    }
};

run();
