import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const videoId = 'c3e819d3-1501-4160-94bc-a9791d2244c1';
const securityKey = '3e23a4af-7717-4115-9316-e9c47ea144bb'; // From their stream screenshot
const hostname = 'vz-456fd924-c6c.b-cdn.net';
const expires = Math.floor(Date.now() / 1000) + 7200;

async function testPlainSHA256() {
    const tokenPath = `/${videoId}/`;
    const path = `/${videoId}/playlist.m3u8`;
    
    // As per the PHP example in docs: securityKey + path + expiration
    const stringToHash = securityKey + path + expires;
    const hash = crypto.createHash('sha256').update(stringToHash).digest('base64');
    let token = hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    const url = `https://${hostname}${path}?token=${token}&expires=${expires}`;
    console.log("Testing Plain SHA256 URL:", url);
    const res = await fetch(url);
    console.log("Plain SHA256 Status:", res.status);
}

async function testPlainSHA256_WithPath() {
    const tokenPath = `/${videoId}/`;
    const path = `/${videoId}/playlist.m3u8`;
    
    // What if token_path is appended to the string?
    const stringToHash = securityKey + path + expires + `token_path=${tokenPath}`;
    const hash = crypto.createHash('sha256').update(stringToHash).digest('base64');
    let token = hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    const url = `https://${hostname}${path}?token=${token}&expires=${expires}&token_path=${tokenPath}`;
    console.log("Testing Plain SHA256 URL with token_path:", url);
    const res = await fetch(url);
    console.log("Plain SHA256 Status with token_path:", res.status);
}

async function testPlainSHA256_DirToken() {
    const tokenPath = `/${videoId}/`;
    const path = `/${videoId}/playlist.m3u8`;
    
    // Maybe just signing the tokenPath?
    const stringToHash = securityKey + tokenPath + expires;
    const hash = crypto.createHash('sha256').update(stringToHash).digest('base64');
    let token = hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    const url = `https://${hostname}${path}?token=${token}&expires=${expires}&token_path=${tokenPath}`;
    console.log("Testing Plain SHA256 URL Directory Token:", url);
    const res = await fetch(url);
    console.log("Plain SHA256 Status Directory Token:", res.status);
}

async function runAll() {
    await testPlainSHA256();
    await testPlainSHA256_WithPath();
    await testPlainSHA256_DirToken();
}
runAll();
