import dotenv from 'dotenv';
// 1. .env file ko load karna
dotenv.config({ path: './.env' }); 

import { decryptPassword } from './src/models/user.models.js';

// 2. Yahan aap apna Encrypted Password manually change / paste kar sakte hain
const storedPassword = "yahan_apna_encrypted_password_paste_karein";

console.log("=================================");
console.log("🔑 Secret Key mili? :", process.env.ENCRYPTION_KEY ? "Haan mil gayi!" : "Nahi mili, .env check karo!");
console.log("🔓 Asli Password Hai :", decryptPassword(storedPassword));
console.log("=================================");