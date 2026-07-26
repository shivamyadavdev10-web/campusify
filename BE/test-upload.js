import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

const run = async () => {
    try {
        console.log("1. Logging in...");
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: "shivamy1@campusify.com",
            password: "shivamy1@",
            deviceId: "postman-test-device-123"
        });

        // Try getting token from JSON response or cookies
        const token = loginRes.data.accessToken || loginRes.data.data?.token || loginRes.data.token || '';
        let cookieHeader = loginRes.headers['set-cookie'];
        
        console.log("Login successful!", {
            token: token ? "Token received" : "No token in body",
            cookie: cookieHeader ? "Cookies received" : "No cookies"
        });

        console.log("2. Preparing form data...");
        const form = new FormData();
        form.append('subjectId', '6a5e07ce21b6da4bedcfd38a');
        form.append('title', 'lec 1 : AA');
        form.append('unit', 'Unit 2');
        form.append('type', 'video');
        form.append('orderSequence', '1');
        
        const filePath = 'C:\\vk-studio\\BE\\ACN 1.1.mp4';
        if (!fs.existsSync(filePath)) {
            console.error("File not found:", filePath);
            return;
        }
        form.append('file', fs.createReadStream(filePath));

        console.log("3. Uploading video...");
        const headers = { ...form.getHeaders() };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (cookieHeader) headers['Cookie'] = cookieHeader.join('; ');

        const uploadRes = await axios.post('http://localhost:5000/api/admin/content', form, {
            headers,
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        console.log("Upload successful!");
        console.log(JSON.stringify(uploadRes.data, null, 2));

    } catch (err) {
        console.error("Error:");
        if (err.response) {
            console.error(err.response.status, err.response.data);
        } else {
            console.error(err.message);
        }
    }
};

run();
