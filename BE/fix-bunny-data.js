import dotenv from 'dotenv';
import mongoose from 'mongoose';
import axios from 'axios';
import readline from 'readline';

dotenv.config({ path: './.env' });

const { MONGODB_URI, BUNNY_STREAM_LIBRARY_ID, BUNNY_STREAM_API_KEY } = process.env;

const libraryId = (BUNNY_STREAM_LIBRARY_ID || '722568').trim();
const apiKey = (BUNNY_STREAM_API_KEY || '').trim();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

// Define a minimal Content model to query
const contentSchema = new mongoose.Schema({
    fileKey: { type: String, select: true }
}, { strict: false });

const Content = mongoose.model('Content', contentSchema);

const checkBunnyVideoExists = async (guid) => {
    try {
        const url = `https://video.bunnycdn.com/library/${libraryId}/videos/${guid}`;
        await axios.get(url, {
            headers: {
                'AccessKey': apiKey,
                'Accept': 'application/json'
            }
        });
        return true;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return false;
        }
        console.error(`Error checking Bunny API for GUID ${guid}:`, error.message);
        return false;
    }
};

const runFixes = async () => {
    try {
        if (!MONGODB_URI) throw new Error('MONGODB_URI is missing');
        
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const allContents = await Content.find({ type: 'video' }).select('+fileKey');
        console.log(`Found ${allContents.length} video contents.`);

        const toFixPrefix = [];
        const toFixMissing = [];

        for (const content of allContents) {
            if (!content.fileKey) continue;

            let guid = content.fileKey;

            // Check if it has a prefix
            if (guid.includes('/')) {
                toFixPrefix.push(content);
                guid = guid.split('/').pop();
            }

            // Verify with Bunny API
            const exists = await checkBunnyVideoExists(guid);
            if (!exists) {
                toFixMissing.push({ content, checkedGuid: guid });
            }
        }

        console.log('\n--- REPORT ---');
        console.log(`Contents with corrupted fileKey (contains '/'): ${toFixPrefix.length}`);
        console.log(`Contents with missing video on Bunny.net: ${toFixMissing.length}`);

        if (toFixPrefix.length > 0) {
            console.log('\nCorrupted files examples:');
            toFixPrefix.slice(0, 5).forEach(c => console.log(` - ID: ${c._id}, fileKey: ${c.fileKey}`));
        }
        if (toFixMissing.length > 0) {
            console.log('\nMissing videos examples:');
            toFixMissing.slice(0, 5).forEach(m => console.log(` - ID: ${m.content._id}, expected GUID: ${m.checkedGuid}`));
        }

        if (toFixPrefix.length === 0) {
            console.log('\nNo prefix fixes needed.');
            process.exit(0);
        }

        const answer = await askQuestion('\nDo you want to fix the corrupted fileKeys by stripping the prefix? (yes/no): ');
        if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
            console.log('Applying fixes...');
            for (const content of toFixPrefix) {
                const newGuid = content.fileKey.split('/').pop();
                await Content.updateOne({ _id: content._id }, { $set: { fileKey: newGuid } });
                console.log(`✅ Fixed ${content._id}: ${content.fileKey} -> ${newGuid}`);
            }
            console.log('Done!');
        } else {
            console.log('Aborted.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        rl.close();
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

runFixes();
